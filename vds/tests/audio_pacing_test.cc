// SPDX-License-Identifier: MIT
#include <cassert>
#include <cstddef>
#include <cstdint>

#include "../src/vds_protocol.hh"

namespace {

// One haptics packet per 32 frames at 3 kHz.
constexpr std::int64_t kIntervalUs = 10667;

void queue_trimmer() {
  vds::AudioQueueTrimmer trimmer;

  // Depth never falls to the target over a whole window: trim once at its end.
  for (std::size_t i = 0; i + 1 < vds::AudioQueueTrimmer::kWindowPackets; ++i) {
    assert(!trimmer.should_trim(4));
  }
  assert(trimmer.should_trim(3));

  // One packet at the target depth keeps the window from trimming.
  for (std::size_t i = 0; i + 1 < vds::AudioQueueTrimmer::kWindowPackets; ++i) {
    assert(!trimmer.should_trim(i == 50 ? 2 : 4));
  }
  assert(!trimmer.should_trim(4));

  // A reset starts a fresh window.
  for (std::size_t i = 0; i < 10; ++i) {
    assert(!trimmer.should_trim(2));
  }
  trimmer.reset();
  for (std::size_t i = 0; i + 1 < vds::AudioQueueTrimmer::kWindowPackets; ++i) {
    assert(!trimmer.should_trim(3));
  }
  assert(trimmer.should_trim(3));
}

void buffer_tuner() {
  using Tuner = vds::HapticsBufferTuner;

  // Clamped to the supported range.
  assert(Tuner(8).buffer_length() == Tuner::kMinLength);
  assert(Tuner(255).buffer_length() == Tuner::kMaxLength);

  // A clean link drops to the floor right away: 10.7 ms + 2 ms needs 39
  // samples, below the 40 floor.
  Tuner tuner(64);
  for (int i = 0; i < 3; ++i) {
    tuner.on_send(kIntervalUs);
  }
  assert(tuner.buffer_length() == Tuner::kMinLength);

  // One or two 16 ms spikes in the window are allowed to be late.
  assert(tuner.on_send(16000) == Tuner::kMinLength);
  assert(tuner.on_send(kIntervalUs) == Tuner::kMinLength);
  assert(tuner.on_send(16000) == Tuner::kMinLength);

  // The third raises it on that packet: 16 ms + 2 ms = 54 samples.
  assert(tuner.on_send(16000) == 54);

  // It stays up while the spikes are in the window...
  for (std::size_t i = 0; i + 5 < Tuner::kWindowPackets; ++i) {
    assert(tuner.on_send(kIntervalUs) == 54);
  }
  // ...and drops on the packet that ages the first spike out.
  std::size_t packets = 0;
  while (tuner.buffer_length() != Tuner::kMinLength) {
    tuner.on_send(kIntervalUs);
    assert(++packets <= 10);
  }

  // Never above the maximum.
  for (int i = 0; i < 3; ++i) {
    tuner.on_send(200000);
  }
  assert(tuner.buffer_length() == Tuner::kMaxLength);
}

} // namespace

int main() {
  queue_trimmer();
  buffer_tuner();
  return 0;
}
