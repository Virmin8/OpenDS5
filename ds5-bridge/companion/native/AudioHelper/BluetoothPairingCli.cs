using System.Text.Json;
using System.Text.RegularExpressions;
using Windows.Devices.Bluetooth;
using Windows.Devices.Enumeration;

/// <summary>
/// Windows: pairs a DualSense in pairing mode, or forgets a paired one, for
/// the Bluetooth tab. Reports on stdout as JSON lines: {"stage":"…"} while
/// working, then one {"result":{…}}. Cancelling is ending the process.
/// </summary>
static class BluetoothPairingCli
{
    // Classic Bluetooth (BR/EDR) association endpoints.
    private const string ClassicBluetoothProtocol = "{e0cbf06c-cd8b-4647-bb8a-263b43f0f974}";
    private static readonly Regex ControllerName = new("wireless controller|dualsense", RegexOptions.IgnoreCase);
    private static readonly string[] Properties =
    {
        "System.Devices.Aep.DeviceAddress",
        "System.Devices.Aep.IsPaired"
    };

    public static async Task<int> PairAsync(TimeSpan searchTimeout)
    {
        Stage("searching");
        var found = await FindUnpairedControllerAsync(searchTimeout);
        if (found is null)
        {
            return Fail("No controller found. Hold PS and Create until the light bar flashes quickly, then try again. " +
                        "If it was paired with Windows before, forget it first.");
        }

        Stage("pairing");
        var custom = found.Pairing.Custom;
        custom.PairingRequested += (_, request) =>
        {
            // The DualSense uses Just Works pairing: nothing to show or type.
            request.Accept();
        };
        var result = await custom.PairAsync(
            DevicePairingKinds.ConfirmOnly | DevicePairingKinds.ConfirmPinMatch |
            DevicePairingKinds.DisplayPin | DevicePairingKinds.ProvidePin,
            DevicePairingProtectionLevel.None);
        if (result.Status is not (DevicePairingResultStatus.Paired or DevicePairingResultStatus.AlreadyPaired))
        {
            return Fail($"Pairing failed ({result.Status}). Put the controller back in pairing mode and try again.");
        }

        var address = AddressOf(found) ?? await AddressFromDeviceAsync(found.Id);
        if (address is null)
        {
            return Fail("Paired, but Windows did not report the controller's address. Attach it from the list.");
        }
        Result(new { ok = true, address, name = string.IsNullOrWhiteSpace(found.Name) ? "Wireless Controller" : found.Name });
        return 0;
    }

    public static async Task<int> UnpairAsync(string address)
    {
        var wanted = NormalizeAddress(address);
        var query = $"System.Devices.Aep.ProtocolId:=\"{ClassicBluetoothProtocol}\" AND " +
                    "System.Devices.Aep.IsPaired:=System.StructuredQueryType.Boolean#True";
        var paired = await DeviceInformation.FindAllAsync(query, Properties, DeviceInformationKind.AssociationEndpoint);
        var device = paired.FirstOrDefault((info) => AddressOf(info) == wanted);
        if (device is null)
        {
            // Already gone from Windows: nothing to do.
            Result(new { ok = true, address = wanted });
            return 0;
        }
        var result = await device.Pairing.UnpairAsync();
        if (result.Status is not (DeviceUnpairingResultStatus.Unpaired or DeviceUnpairingResultStatus.AlreadyUnpaired))
        {
            return Fail($"Windows could not forget the controller ({result.Status}).");
        }
        Result(new { ok = true, address = wanted });
        return 0;
    }

    private static async Task<DeviceInformation?> FindUnpairedControllerAsync(TimeSpan timeout)
    {
        var query = $"System.Devices.Aep.ProtocolId:=\"{ClassicBluetoothProtocol}\" AND " +
                    "System.Devices.Aep.IsPaired:=System.StructuredQueryType.Boolean#False";
        var watcher = DeviceInformation.CreateWatcher(query, Properties, DeviceInformationKind.AssociationEndpoint);
        var seen = new Dictionary<string, DeviceInformation>();
        var found = new TaskCompletionSource<DeviceInformation?>(TaskCreationOptions.RunContinuationsAsynchronously);
        watcher.Added += (_, info) =>
        {
            lock (seen) seen[info.Id] = info;
            if (ControllerName.IsMatch(info.Name ?? string.Empty)) found.TrySetResult(info);
        };
        // Names can arrive after the device does.
        watcher.Updated += (_, update) =>
        {
            DeviceInformation? info;
            lock (seen) seen.TryGetValue(update.Id, out info);
            if (info is null) return;
            info.Update(update);
            if (ControllerName.IsMatch(info.Name ?? string.Empty)) found.TrySetResult(info);
        };
        watcher.Start();
        var winner = await Task.WhenAny(found.Task, Task.Delay(timeout));
        try
        {
            watcher.Stop();
        }
        catch (Exception)
        {
            // already stopped
        }
        return winner == found.Task ? found.Task.Result : null;
    }

    private static string? AddressOf(DeviceInformation info)
    {
        return info.Properties.TryGetValue("System.Devices.Aep.DeviceAddress", out var value) && value is string text
            ? NormalizeAddress(text)
            : null;
    }

    private static async Task<string?> AddressFromDeviceAsync(string id)
    {
        try
        {
            using var device = await BluetoothDevice.FromIdAsync(id);
            if (device is null) return null;
            var raw = device.BluetoothAddress;
            return string.Join(":", Enumerable.Range(0, 6).Select((i) => ((raw >> (8 * (5 - i))) & 0xff).ToString("X2")));
        }
        catch (Exception)
        {
            return null;
        }
    }

    internal static string NormalizeAddress(string address)
    {
        var hex = new string(address.Where(Uri.IsHexDigit).ToArray()).ToUpperInvariant();
        return hex.Length == 12
            ? string.Join(":", Enumerable.Range(0, 6).Select((i) => hex.Substring(i * 2, 2)))
            : address.ToUpperInvariant();
    }

    private static void Stage(string stage) => Write(new { stage });

    private static void Result(object result) => Write(new { result });

    private static int Fail(string error)
    {
        Result(new { ok = false, cancelled = false, error });
        return 1;
    }

    private static void Write(object value)
    {
        Console.Out.WriteLine(JsonSerializer.Serialize(value));
        Console.Out.Flush();
    }
}
