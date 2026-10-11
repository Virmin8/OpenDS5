# SPDX-License-Identifier: AGPL-3.0-only
#
# OpenDS5 system setup for Windows: installs USB/IP (usbip-win2) and HidHide,
# copies vdsd to Program Files and registers it as an automatic service; with
# -Uninstall removes the service and its files again.
#
# Same interface as installer/opends5-install on Linux, so the companion's
# setup wizard drives both:
#   -DryRun        print the plan ("  1. step") and exit
#   -JsonProgress  emit {"event":"plan"|"step"|"done"} lines on stdout
#   exit 0 = done, 6 = Windows must restart to finish, anything else = failed
#
# Run unelevated, it asks for administrator rights once (UAC) and relays the
# elevated run's progress.

[CmdletBinding()]
param(
  [switch]$DryRun,
  [switch]$Yes,
  [switch]$JsonProgress,
  [switch]$Uninstall,
  [switch]$Purge,
  # Accepted for parity with the Linux installer; Windows has no kernel module.
  [switch]$RebuildModule,
  # Elevated child only: where to append progress lines for the parent.
  [string]$ProgressPath = "",
  # Bundled vdsd.exe, vdsctl.exe and install_dependencies.ps1.
  [string]$BundleDir = "",
  # The signed-in user's OpenDS5 settings (removed by -Purge). Passed down
  # because the elevated run may belong to a different administrator.
  [string]$UserDataDir = ""
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version 2.0

$ServiceName = "vdsd"
$ProgramFiles64 = [Environment]::GetEnvironmentVariable("ProgramW6432")
if ([string]::IsNullOrWhiteSpace($ProgramFiles64)) {
  $ProgramFiles64 = $env:ProgramFiles
}
# Admin-owned: a service running as SYSTEM must never start a binary from the
# per-user app folder, which the user (or anything they run) can replace.
$InstallDir = Join-Path $ProgramFiles64 "OpenDS5\vds"
$LogDir = Join-Path $env:ProgramData "OpenDS5\logs"
$LogPath = Join-Path $LogDir ($(if ($Uninstall) { "uninstall.log" } else { "install.log" }))
# Also admin-only: installers verified here then run elevated, so nothing
# unelevated may swap them in between.
$DownloadDir = Join-Path $ProgramFiles64 "OpenDS5\downloads"
if ([string]::IsNullOrWhiteSpace($BundleDir)) {
  # Packaged layout: resources\installer\windows\ next to resources\vds-win\.
  $BundleDir = Join-Path $PSScriptRoot "..\..\vds-win"
}
$BundleDir = [System.IO.Path]::GetFullPath($BundleDir)
if ([string]::IsNullOrWhiteSpace($UserDataDir)) {
  $UserDataDir = Join-Path $env:APPDATA "OpenDS5"
}

$ExitRestartRequired = 6
$ExitStepFailed = 7
# Same as pkexec's "dismissed": nothing was changed.
$ExitCancelled = 126

function Test-Administrator {
  $Identity = [Security.Principal.WindowsIdentity]::GetCurrent()
  $Principal = New-Object Security.Principal.WindowsPrincipal($Identity)
  return $Principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

# Straight to stdout: Write-Output inside a function would become part of
# the function's return value.
function Write-StdoutLine([string]$Line) {
  [Console]::Out.WriteLine($Line)
  [Console]::Out.Flush()
}

function Write-SetupEvent([hashtable]$Data) {
  $Line = $Data | ConvertTo-Json -Compress
  if ($ProgressPath) {
    Add-Content -LiteralPath $ProgressPath -Value $Line -Encoding UTF8
  } elseif ($JsonProgress) {
    Write-StdoutLine $Line
  }
}

function Write-SetupLog([string]$Message) {
  New-Item -ItemType Directory -Force -Path $LogDir | Out-Null
  $Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
  Add-Content -LiteralPath $LogPath -Value "$Timestamp $Message" -Encoding UTF8
}

function Test-ServiceExists {
  return $null -ne (Get-Service -Name $ServiceName -ErrorAction SilentlyContinue)
}

function Invoke-Sc([string[]]$Arguments) {
  $Output = & sc.exe @Arguments 2>&1
  if ($LASTEXITCODE -ne 0) {
    throw "sc.exe $($Arguments -join ' ') failed: $Output"
  }
}

function Invoke-Dependencies([string]$Mode) {
  $Script = Join-Path $BundleDir "install_dependencies.ps1"
  # The plan's Check also runs unelevated, before the log dir may exist.
  $DependencyLog = if ($Mode -eq "Check") { Join-Path $env:TEMP "opends5-setup-check.log" } else { $LogPath }
  & powershell.exe -NoProfile -ExecutionPolicy Bypass -File $Script `
    -Mode $Mode -DownloadDir $DownloadDir -LogPath $DependencyLog | Out-Null
  return $LASTEXITCODE
}

function Stop-Vdsd {
  if (!(Test-ServiceExists)) {
    return
  }
  $Service = Get-Service -Name $ServiceName
  if ($Service.Status -ne "Stopped") {
    Stop-Service -Name $ServiceName -Force
    $Service.WaitForStatus("Stopped", [TimeSpan]::FromSeconds(20))
  }
}

# --- Steps -----------------------------------------------------------------

$Steps = New-Object System.Collections.ArrayList
function Add-Step([string]$Description, [scriptblock]$Action) {
  [void]$Steps.Add([pscustomobject]@{ Description = $Description; Action = $Action })
}

$script:RestartRequired = $false

if ($Uninstall) {
  Add-Step "Stop and remove the vdsd service" {
    Stop-Vdsd
    if (Test-ServiceExists) {
      Invoke-Sc @("delete", $ServiceName)
    }
  }
  Add-Step "Remove $InstallDir" {
    if (Test-Path -LiteralPath $InstallDir) {
      Remove-Item -LiteralPath $InstallDir -Recurse -Force
    }
    $Parent = Split-Path -Parent $InstallDir
    if ((Test-Path -LiteralPath $Parent) -and !(Get-ChildItem -LiteralPath $Parent)) {
      Remove-Item -LiteralPath $Parent -Force
    }
  }
  if ($Purge) {
    Add-Step "Remove OpenDS5 app settings and logs" {
      Remove-Item -LiteralPath (Join-Path $env:ProgramData "OpenDS5") -Recurse -Force -ErrorAction SilentlyContinue
      Remove-Item -LiteralPath $UserDataDir -Recurse -Force -ErrorAction SilentlyContinue
    }
  }
} else {
  # USB/IP and HidHide stay installed on uninstall: other tools use them too.
  $DependencyState = Invoke-Dependencies "Check"
  if ($DependencyState -ne 0) {
    Add-Step "Download USB/IP (usbip-win2) and HidHide from their GitHub releases" {
      $Code = Invoke-Dependencies "Download"
      if ($Code -ne 0) { throw "dependency download failed ($Code)" }
    }
    Add-Step "Install USB/IP and HidHide (USB 3 hubs restart briefly)" {
      $Code = Invoke-Dependencies "Install"
      if ($Code -eq 3010) { $script:RestartRequired = $true }
      elseif ($Code -ne 0) { throw "dependency installation failed ($Code)" }
      Remove-Item -LiteralPath $DownloadDir -Recurse -Force -ErrorAction SilentlyContinue
    }
  }
  Add-Step "Copy vdsd to $InstallDir" {
    foreach ($File in @("vdsd.exe", "vdsctl.exe")) {
      if (!(Test-Path -LiteralPath (Join-Path $BundleDir $File) -PathType Leaf)) {
        throw "$File is missing from $BundleDir"
      }
    }
    Stop-Vdsd
    New-Item -ItemType Directory -Force -Path $InstallDir | Out-Null
    Get-ChildItem -LiteralPath $BundleDir -File |
      Where-Object { $_.Extension -in @(".exe", ".dll") } |
      Copy-Item -Destination $InstallDir -Force
  }
  Add-Step "Register and start the vdsd service" {
    $Binary = '"' + (Join-Path $InstallDir "vdsd.exe") + '"'
    if (Test-ServiceExists) {
      Invoke-Sc @("config", $ServiceName, "binPath=", $Binary, "start=", "auto", "DisplayName=", "OpenDS5 vdsd")
    } else {
      Invoke-Sc @("create", $ServiceName, "binPath=", $Binary, "start=", "auto", "DisplayName=", "OpenDS5 vdsd")
    }
    Invoke-Sc @("description", $ServiceName, "OpenDS5: bridges Bluetooth DualSense controllers as wired ones")
    # Restart after a crash, up to twice a day.
    Invoke-Sc @("failure", $ServiceName, "reset=", "86400", "actions=", "restart/5000/restart/5000//")
    if (!$script:RestartRequired) {
      Start-Service -Name $ServiceName
    }
  }
}

function Write-Plan {
  Write-Output "The following steps will be performed:"
  for ($Index = 0; $Index -lt $Steps.Count; ++$Index) {
    Write-Output ("  {0}. {1}" -f ($Index + 1), $Steps[$Index].Description)
  }
}

function Send-Plan {
  Write-SetupEvent @{
    event = "plan"
    total = $Steps.Count
    steps = @($Steps | ForEach-Object { $_.Description })
    log = $LogPath
  }
}

# Install stops at the first failed step; uninstall runs every step so a
# half-removed install is still cleaned up as far as possible.
function Invoke-Steps {
  Write-SetupLog "=== opends5-setup $(if ($Uninstall) { '-Uninstall' } else { 'install' }) ==="
  $Failed = $false
  for ($Index = 0; $Index -lt $Steps.Count; ++$Index) {
    $Step = $Steps[$Index]
    Write-SetupEvent @{ event = "step"; index = $Index; status = "start" }
    Write-SetupLog "STEP $($Index + 1): $($Step.Description)"
    try {
      & $Step.Action | Out-Null
      Write-SetupEvent @{ event = "step"; index = $Index; status = "ok" }
    } catch {
      Write-SetupLog "failed: $($_.Exception.Message)"
      Write-SetupEvent @{ event = "step"; index = $Index; status = "fail"; exit = $ExitStepFailed }
      $Failed = $true
      if (!$Uninstall) { break }
    }
  }
  if ($Failed) { return $ExitStepFailed }
  if ($script:RestartRequired) { return $ExitRestartRequired }
  return 0
}

# Unelevated: run this script again as administrator and relay its progress.
function Invoke-Elevated {
  $Progress = [System.IO.Path]::GetTempFileName()
  $Arguments = @(
    "-NoProfile", "-ExecutionPolicy", "Bypass", "-File", "`"$PSCommandPath`"",
    "-Yes", "-ProgressPath", "`"$Progress`"", "-BundleDir", "`"$BundleDir`"",
    "-UserDataDir", "`"$UserDataDir`""
  )
  if ($Uninstall) { $Arguments += "-Uninstall" }
  if ($Purge) { $Arguments += "-Purge" }
  try {
    $Process = Start-Process -FilePath "powershell.exe" -ArgumentList $Arguments `
      -Verb RunAs -WindowStyle Hidden -PassThru
  } catch {
    # UAC declined.
    Remove-Item -LiteralPath $Progress -Force -ErrorAction SilentlyContinue
    if ($JsonProgress) { Write-StdoutLine (@{ event = "done"; exit = $ExitCancelled } | ConvertTo-Json -Compress) }
    else { Write-Error "Administrator rights are needed to set up OpenDS5." -ErrorAction Continue }
    return $ExitCancelled
  }
  $Relay = {
    $Lines = @(Get-Content -LiteralPath $Progress -Encoding UTF8 -ErrorAction SilentlyContinue)
    for (; $script:Relayed -lt $Lines.Count; ++$script:Relayed) {
      if ($JsonProgress) { Write-StdoutLine $Lines[$script:Relayed] }
    }
  }
  $script:Relayed = 0
  while (!$Process.HasExited) {
    & $Relay
    Start-Sleep -Milliseconds 250
  }
  & $Relay
  Remove-Item -LiteralPath $Progress -Force -ErrorAction SilentlyContinue
  $Process.WaitForExit()
  $Code = $Process.ExitCode
  if ($JsonProgress) { Write-StdoutLine (@{ event = "done"; exit = $Code } | ConvertTo-Json -Compress) }
  return $Code
}

if ($DryRun) {
  if ($JsonProgress) { Send-Plan } else { Write-Plan }
  exit 0
}

if (!$Yes) {
  Write-Plan
  $Reply = Read-Host "Continue? [y/N]"
  if ($Reply -notmatch "^(y|yes)$") {
    Write-Output "Aborted."
    exit 0
  }
}

if (!(Test-Administrator)) {
  exit (Invoke-Elevated)
}

Send-Plan
$Code = Invoke-Steps
if (!$ProgressPath -and $JsonProgress) {
  Write-SetupEvent @{ event = "done"; exit = $Code }
}
exit $Code
