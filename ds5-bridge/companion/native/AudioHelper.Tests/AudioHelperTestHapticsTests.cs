using System.Buffers.Binary;
using NAudio.Wave;
using Xunit;

public sealed class AudioHelperTestHapticsTests
{
    [Fact]
    public void BuildTestPcmPlaysTheLinuxTwoPartPatternOnTheHapticsChannels()
    {
        var format = new WaveFormat(48000, 16, 4);

        var pcm = AudioHelperTestHaptics.BuildTestPcm(format, 100);

        Assert.Equal(76800 * format.BlockAlign, pcm.Length); // 1.6 s
        // The speaker channels stay silent.
        Assert.All(Enumerable.Range(0, 76800), frame =>
        {
            Assert.Equal(0, ReadChannel(pcm, format, frame, 0));
            Assert.Equal(0, ReadChannel(pcm, format, frame, 1));
        });
        // Part one: the 40 Hz swell peaks mid-way (t = 0.35 s, 40 Hz crest at +1/160 s).
        Assert.True(ReadChannel(pcm, format, 16800 + 300, 2) > 10000);
        Assert.Equal(ReadChannel(pcm, format, 16800 + 300, 2), ReadChannel(pcm, format, 16800 + 300, 3));
        // The gap between the parts is silent.
        Assert.Equal(0, ReadChannel(pcm, format, 36000, 2));
        // Part two: the 80 Hz pulse train starts at 0.8 s and repeats every 0.25 s.
        Assert.True(Math.Abs((int)ReadChannel(pcm, format, 38400 + 150, 2)) > 10000);
        Assert.True(Math.Abs((int)ReadChannel(pcm, format, 50400 + 150, 2)) > 10000);
    }

    [Fact]
    public void BuildTestPcmClampsZeroGainToSilentHaptics()
    {
        var format = new WaveFormat(48000, 16, 4);

        var pcm = AudioHelperTestHaptics.BuildTestPcm(format, 0);

        Assert.All(pcm, sample => Assert.Equal(0, sample));
    }

    [Fact]
    public void BuildTestFramesWritesCompactBridgeHapticsWithNeutralTail()
    {
        var frames = AudioHelperTestHaptics.BuildTestFrames(100);

        Assert.Equal(44, frames.Length);
        Assert.All(frames, frame => Assert.Equal(AudioConstants.CompactFrameBytes, frame.Length));
        Assert.All(frames[0].Take(64), sample => Assert.Equal(0, sample));
        Assert.True((sbyte)frames[3][0] < 0);
        Assert.True((sbyte)frames[3][1] > 0);
        Assert.True((sbyte)frames[4][0] > 0);
        Assert.True((sbyte)frames[4][1] < 0);
        Assert.All(frames[3].Skip(64), sample => Assert.Equal(0, sample));
        Assert.All(frames[^1].Take(64), sample => Assert.Equal(0, sample));
    }

    [Fact]
    public void BuildTestFramesClampsZeroGainToSilentHaptics()
    {
        var frames = AudioHelperTestHaptics.BuildTestFrames(0);

        Assert.All(frames.SelectMany(frame => frame), sample => Assert.Equal(0, sample));
    }

    private static short ReadChannel(byte[] pcm, WaveFormat format, int frame, int channel)
    {
        var offset = frame * format.BlockAlign + channel * (format.BitsPerSample / 8);
        return BinaryPrimitives.ReadInt16LittleEndian(pcm.AsSpan(offset, 2));
    }
}
