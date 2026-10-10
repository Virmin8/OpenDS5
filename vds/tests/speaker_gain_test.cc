// SPDX-License-Identifier: MIT
#include <array>
#include <cassert>
#include <cstdint>
#include <vector>

#include "../src/vds_protocol.hh"

int main() {
  vds::DsOutputState state;
  vds::DsCompanionOverrides overrides;
  assert(overrides.speaker_gain_level == 2);
  overrides.speaker_gain_level = 6;
  const auto idle_byte37 = state.state()[37];
  state.set_companion_overrides(overrides);
  // Gain is only applied while the speaker stream is active.
  assert(state.state()[37] == idle_byte37);
  state.set_audio_out_stream_active(true);

  assert(state.state()[37] == 6);
  assert(state.state()[7] == 0x30);

  std::array<std::int8_t, vds::kHapticsSampleSize> haptics{};
  std::array<std::uint8_t, vds::kSpeakerOpusSize> speaker{};
  vds::HapticsPacketBuilder builder;
  const auto packet = builder.build_packet(haptics, speaker, state.state());

  assert(packet[4] == 0xfe);
  assert(packet[13 + 7] == 0x30);
  assert((packet[13 + 37] & 0x07) == 6);
  assert((packet[13] & 0x40) == 0);
  assert((packet[13 + 1] & 0x01) == 0);
  assert(packet[13 + 6] == 0);
  assert(packet[13 + 8] == 0);
  assert(packet[13 + 5] == 0x64);

  // Companion speaker volume must survive into the 0x36 packet.
  overrides.speaker_volume_percent = 50;
  state.set_companion_overrides(overrides);
  const auto scaled = builder.build_packet(haptics, speaker, state.state());
  assert(scaled[13 + 5] == state.state()[5]);
  assert(scaled[13 + 5] < 0x64);

  // Audio packets must never write power-save/mic-mute state.
  vds::DsState muted = state.state();
  muted[1] |= 0x02;
  muted[9] = 0x10 | 0x01;
  const auto mic = builder.build_packet(haptics, speaker, muted);
  assert((mic[13 + 1] & 0x02) == 0);
  assert(mic[13 + 9] == 0);

  // An audio packet must not count as delivering a mic mute/unmute change.
  vds::DsState unmuted = muted;
  unmuted[9] = 0x01;
  const auto delivered = vds::state_after_audio_packet(muted, unmuted);
  assert(delivered != unmuted);
  assert(delivered[9] == 0x11);
  assert(vds::state_after_audio_packet(unmuted, unmuted) == unmuted);

  vds::PcmAudioExtractor extractor{vds::kSpeakerInputFrames};
  const std::vector<std::uint8_t> pcm(
      vds::kSpeakerInputFrames * VDS_AUDIO_CHANNELS * sizeof(std::int16_t),
      0);
  assert(extractor.push_usb_audio(pcm).size() == 1);
}
