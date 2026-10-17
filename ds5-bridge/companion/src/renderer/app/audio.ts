import type {
  AudioReactiveHapticsAttack,
  AudioReactiveHapticsBassFocus,
  AudioReactiveHapticsMode,
  AudioReactiveHapticsRelease,
  AudioReactiveHapticsResponse,
  AudioReactiveHapticsSource
} from '../../shared/protocol';
import type { AudioHapticsSession, BridgeSnapshot } from '../../shared/types';
import testSpeakerToneUrl from '../assets/test-speaker-tone-silence-tail.mp3';
import {
  capControllerPowerSavingValue,
  CONTROLLER_POWER_SAVING_CAP_PERCENT,
  controllerPowerSavingActiveFromSnapshot
} from './common';
import type { SinkSelectableAudio } from './types';

export const HAPTICS_STEP = 20;
export const STANDARD_FEEDBACK_GAIN_PERCENT = 200;
export const BOOSTED_FEEDBACK_GAIN_PERCENT = 500;
export const SPEAKER_VOLUME_STEP = 10;
export const MIC_VOLUME_STEP = 10;
export const AUDIO_BUFFER_LENGTH_MIN = 16;
export const AUDIO_BUFFER_LENGTH_MAX = 128;
export const AUDIO_BUFFER_LENGTH_HIGH_STUTTER_MAX = 44;
export const AUDIO_BUFFER_LENGTH_RISKY_MAX = 63;
export const TEST_HAPTICS_LOCK_MS = 1100;
export const TEST_SPEAKER_LOCK_MS = 900;
export const TEST_MIC_LISTEN_MS = 5000;
export const TEST_SPEAKER_VOLUME_SETTLE_MS = 90;
export const TEST_SPEAKER_ENDPOINT_ATTEMPTS = 12;
export const TEST_SPEAKER_ENDPOINT_RETRY_MS = 150;
export const TEST_SPEAKER_ENDPOINT_REFRESH_MS = 1500;
export const TEST_SPEAKER_ENDPOINT_VERIFY_MS = 100;
export const TEST_SPEAKER_PREROLL_MS = 220;
export const HAPTICS_PRESETS: Array<[string, number]> = [
  ['Low', 50],
  ['Medium', 100],
  ['High', 150]
];
export const SPEAKER_VOLUME_PRESETS: Array<[string, number]> = [
  ['Low', 30],
  ['Medium', 70],
  ['High', 100]
];
export const MIC_VOLUME_PRESETS: Array<[string, number]> = [
  ['Low', 30],
  ['Medium', 70],
  ['High', 100]
];
export const STANDARD_HAPTICS_SLIDER_TICKS = Array.from({ length: 11 }, (_, index) => index * 20);
export const BRIDGE_AUDIO_OUTPUT_RE = /ds5|dualsense|dual sense|wireless controller|bridge/i;
export const BRIDGE_AUDIO_INPUT_RE = /ds5|dualsense|dual sense|wireless controller|bridge/i;
export const BRIDGE_AUDIO_ENDPOINT_UNAVAILABLE = 'DualSense audio endpoint unavailable';
export const BRIDGE_MIC_ENDPOINT_UNAVAILABLE = 'DualSense microphone unavailable';
export const SPEAKER_GAIN_OPTIONS: Array<[string, number]> = [
  ['1', 1],
  ['2', 2],
  ['3', 3],
  ['4', 4],
  ['5', 5],
  ['6', 6],
  ['7', 7]
];
export const AUDIO_REACTIVE_HAPTICS_MODE_OPTIONS: Array<[string, AudioReactiveHapticsMode]> = [
  ['Mix', 'mix'],
  ['Replace', 'replace']
];
export const AUDIO_REACTIVE_HAPTICS_BASS_FOCUS_OPTIONS: Array<[string, AudioReactiveHapticsBassFocus]> = [
  ['80 Hz', 'deep'],
  ['160 Hz', 'balanced'],
  ['240 Hz', 'punchy'],
  ['400 Hz', 'wide']
];
export const AUDIO_REACTIVE_HAPTICS_RESPONSE_OPTIONS: Array<[string, AudioReactiveHapticsResponse]> = [
  ['Subtle', 'subtle'],
  ['Dynamic', 'balanced'],
  ['Aggressive', 'strong']
];
export const AUDIO_REACTIVE_HAPTICS_ATTACK_OPTIONS: Array<[string, AudioReactiveHapticsAttack]> = [
  ['Slow Ramp', 'soft'],
  ['Medium Ramp', 'balanced'],
  ['Fast Ramp', 'fast'],
  ['Instant Ramp', 'sharp']
];
export const AUDIO_REACTIVE_HAPTICS_RELEASE_OPTIONS: Array<[string, AudioReactiveHapticsRelease]> = [
  ['Fast Fade', 'tight'],
  ['Medium Fade', 'balanced'],
  ['Slow Fade', 'smooth'],
  ['Long Fade', 'long']
];
export const AUDIO_REACTIVE_HAPTICS_FIELD_TOOLTIPS = {
  bassFocus: 'Applies a low-pass filter that chooses which part of the low-end audio becomes vibration.',
  response: 'Controls how strongly haptics react to audio, especially louder peaks.',
  attack: 'Controls how quickly the haptics ramp when a sound rises or spikes.',
  release: 'Controls how quickly the haptics fade when a sound drops.'
} as const;

export function snapHapticsValue(value: number, max = STANDARD_FEEDBACK_GAIN_PERCENT): number {
  return Math.max(0, Math.min(max, Math.round(value / HAPTICS_STEP) * HAPTICS_STEP));
}

export function audioHapticsAppSource(source: AudioReactiveHapticsSource | null | undefined) {
  return source && typeof source === 'object' && source.kind === 'app-session' ? source : null;
}

export function audioHapticsSessionKey(session: AudioHapticsSession): string {
  if (session.processPath) {
    return `app-path:${session.processPath.toLowerCase()}`;
  }
  if (session.executableName) {
    return `app-exe:${session.executableName.toLowerCase()}`;
  }
  return `app-pid:${session.processId}`;
}

export function audioHapticsSourceKey(source: AudioReactiveHapticsSource | null | undefined): string {
  const appSource = audioHapticsAppSource(source);
  if (!appSource) {
    return 'system-audio';
  }
  if (appSource.processPath) {
    return `app-path:${appSource.processPath.toLowerCase()}`;
  }
  if (appSource.executableName) {
    return `app-exe:${appSource.executableName.toLowerCase()}`;
  }
  return `app-pid:${Math.max(0, Math.round(appSource.processId))}`;
}

export function audioHapticsSourceFromSession(session: AudioHapticsSession): AudioReactiveHapticsSource {
  return {
    kind: 'app-session',
    processId: session.processId,
    displayName: session.displayName,
    ...(session.executableName ? { executableName: session.executableName } : {}),
    ...(session.processPath ? { processPath: session.processPath } : {}),
    ...(session.sessionIdentifier ? { sessionIdentifier: session.sessionIdentifier } : {}),
    ...(session.sessionInstanceIdentifier ? { sessionInstanceIdentifier: session.sessionInstanceIdentifier } : {})
  };
}

export function audioHapticsSourceDisplayName(source: AudioReactiveHapticsSource | null | undefined): string {
  const appSource = audioHapticsAppSource(source);
  if (!appSource) {
    return 'System';
  }
  return appSource.displayName
    || appSource.executableName?.replace(/\.[^.]+$/, '')
    || 'Selected app';
}

export function snapSpeakerVolume(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value / SPEAKER_VOLUME_STEP) * SPEAKER_VOLUME_STEP));
}

export function snapMicVolume(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value / MIC_VOLUME_STEP) * MIC_VOLUME_STEP));
}

export function clampAudioBufferLength(value: number): number {
  if (!Number.isFinite(value)) {
    return 64;
  }
  return Math.max(AUDIO_BUFFER_LENGTH_MIN, Math.min(AUDIO_BUFFER_LENGTH_MAX, Math.round(value)));
}

export function audioBufferDelayMs(value: number): number {
  return clampAudioBufferLength(value) / 3;
}

export function audioBufferDelayLabel(value: number): string {
  return `${audioBufferDelayMs(value).toFixed(1)} ms`;
}

export function audioBufferPercent(value: number): number {
  return ((clampAudioBufferLength(value) - AUDIO_BUFFER_LENGTH_MIN) / (AUDIO_BUFFER_LENGTH_MAX - AUDIO_BUFFER_LENGTH_MIN)) * 100;
}

export function audioBufferZoneLabel(value: number): string {
  const bufferLength = clampAudioBufferLength(value);
  if (bufferLength <= AUDIO_BUFFER_LENGTH_HIGH_STUTTER_MAX) {
    return 'High stutter';
  }
  if (bufferLength <= AUDIO_BUFFER_LENGTH_RISKY_MAX) {
    return 'Risky';
  }
  return 'Safe';
}

export function audioBufferZoneTooltip(value: number): string {
  const bufferLength = clampAudioBufferLength(value);
  if (bufferLength <= AUDIO_BUFFER_LENGTH_HIGH_STUTTER_MAX) {
    return 'Danger: lowest haptic delay, but speaker audio is likely to stutter or underrun.';
  }
  if (bufferLength <= AUDIO_BUFFER_LENGTH_RISKY_MAX) {
    return 'Warning: lower haptic delay, with a minimal chance of speaker stutter under load.';
  }
  return 'Safe: more speaker buffer headroom, with higher DualSense haptic delay.';
}

export function audioBufferZoneTone(value: number): 'stutter' | 'risky' | 'safe' {
  const bufferLength = clampAudioBufferLength(value);
  if (bufferLength <= AUDIO_BUFFER_LENGTH_HIGH_STUTTER_MAX) {
    return 'stutter';
  }
  if (bufferLength <= AUDIO_BUFFER_LENGTH_RISKY_MAX) {
    return 'risky';
  }
  return 'safe';
}

export function feedbackSliderMaxFromSnapshot(snapshot: BridgeSnapshot | null | undefined): number {
  if (controllerPowerSavingActiveFromSnapshot(snapshot)) {
    return CONTROLLER_POWER_SAVING_CAP_PERCENT;
  }
  return snapshot?.settings.feedbackBoostEnabled ? BOOSTED_FEEDBACK_GAIN_PERCENT : STANDARD_FEEDBACK_GAIN_PERCENT;
}

export function feedbackSliderTicks(max: number): number[] {
  if (max === STANDARD_FEEDBACK_GAIN_PERCENT) {
    return STANDARD_HAPTICS_SLIDER_TICKS;
  }
  return Array.from({ length: 11 }, (_, index) => (max / 10) * index);
}

export function displayHapticsValue(snapshot: BridgeSnapshot): number {
  return capControllerPowerSavingValue(snapshot.settings.hapticsGainPercent, snapshot);
}

export function displayClassicRumbleValue(snapshot: BridgeSnapshot): number {
  return capControllerPowerSavingValue(snapshot.settings.classicRumbleGainPercent, snapshot);
}

// Under vdsd only Normal and Chord exist; other saved modes act as Normal.
export const MIC_PROCESSING_OPTIONS: Array<[string, number]> = [
  ['No Processing', 0],
  ['Noise', 1],
  ['Echo', 2],
  ['Noise + Echo', 3]
];

export const SPEAKER_BOOST_OPTIONS: Array<[string, number]> = Array.from(
  { length: 18 },
  (_, index) => [`${18 - index} dB`, 18 - index] as [string, number]
);

// Average speaker limiting (dB) above which Diagnostics suggests a lower boost.
export const SPEAKER_LIMITING_WARN_DB = 3;

export const MIC_SPEAKER_GAIN_OPTIONS: Array<[string, number]> = [
  ['Same', 0],
  ...SPEAKER_GAIN_OPTIONS
];

export function normalizeAudioDeviceLabel(label: string): string {
  return label
    .toLowerCase()
    .replace(/^\s*\d+\s*-\s*/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function isBridgeAudioLabel(label: string): boolean {
  return BRIDGE_AUDIO_OUTPUT_RE.test(normalizeAudioDeviceLabel(label));
}

export function bridgeAudioOutputScore(device: MediaDeviceInfo): number {
  const label = normalizeAudioDeviceLabel(device.label);
  let score = 1;
  if (label.includes('dualsense') || label.includes('dual sense')) score += 4;
  if (label.includes('wireless controller')) score += 3;
  if (label.includes('speaker') || label.includes('headphone') || label.includes('headset')) score += 2;
  if (label.includes('microphone') || label.includes('mic')) score -= 4;
  if (label.includes('ds5') || label.includes('bridge')) score += 1;
  return score;
}

export function bridgeAudioInputScore(device: MediaDeviceInfo): number {
  const label = normalizeAudioDeviceLabel(device.label);
  let score = 1;
  if (label.includes('dualsense') || label.includes('dual sense')) score += 4;
  if (label.includes('wireless controller')) score += 3;
  if (label.includes('microphone') || label.includes('mic')) score += 2;
  if (label.includes('speaker') || label.includes('headphone')) score -= 4;
  if (label.includes('ds5') || label.includes('bridge')) score += 1;
  return score;
}

export async function findBridgeAudioOutputIdOnce(): Promise<string | null> {
  if (!navigator.mediaDevices?.enumerateDevices) {
    return null;
  }

  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const outputs = devices.filter((device) => (
      device.kind === 'audiooutput'
      && isBridgeAudioLabel(device.label)
      && device.deviceId
      && device.deviceId !== 'default'
      && device.deviceId !== 'communications'
    ));
    outputs.sort((left, right) => bridgeAudioOutputScore(right) - bridgeAudioOutputScore(left));
    const output = outputs[0];
    return output?.deviceId ?? null;
  } catch {
    return null;
  }
}

export async function findBridgeAudioInputIdOnce(): Promise<string | null> {
  if (!navigator.mediaDevices?.enumerateDevices) {
    return null;
  }

  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const inputs = devices.filter((device) => (
      device.kind === 'audioinput'
      && BRIDGE_AUDIO_INPUT_RE.test(normalizeAudioDeviceLabel(device.label))
      && device.deviceId
      && device.deviceId !== 'default'
      && device.deviceId !== 'communications'
    ));
    inputs.sort((left, right) => bridgeAudioInputScore(right) - bridgeAudioInputScore(left));
    const input = inputs[0];
    return input?.deviceId ?? null;
  } catch {
    return null;
  }
}

export async function unlockMediaDeviceLabels(): Promise<boolean> {
  if (!navigator.mediaDevices?.getUserMedia) {
    return false;
  }

  let permissionStream: MediaStream | null = null;
  try {
    permissionStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    return true;
  } catch {
    return false;
  } finally {
    permissionStream?.getTracks().forEach((track) => track.stop());
  }
}

export async function findBridgeAudioInputId(): Promise<string | null> {
  let inputId = await findBridgeAudioInputIdOnce();
  if (inputId || !navigator.mediaDevices?.getUserMedia) {
    return inputId;
  }

  if (!await unlockMediaDeviceLabels()) {
    return null;
  }

  inputId = await findBridgeAudioInputIdOnce();
  return inputId;
}

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

export function writeAscii(view: DataView, offset: number, value: string): void {
  for (let index = 0; index < value.length; index += 1) {
    view.setUint8(offset + index, value.charCodeAt(index));
  }
}

export let speakerPrerollSilenceUrl: string | null = null;

export function getSpeakerPrerollSilenceUrl(): string {
  if (speakerPrerollSilenceUrl) {
    return speakerPrerollSilenceUrl;
  }

  const sampleRate = 48000;
  const channels = 2;
  const bytesPerSample = 2;
  const frames = Math.round((sampleRate * TEST_SPEAKER_PREROLL_MS) / 1000);
  const dataSize = frames * channels * bytesPerSample;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  writeAscii(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeAscii(view, 8, 'WAVE');
  writeAscii(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, channels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * channels * bytesPerSample, true);
  view.setUint16(32, channels * bytesPerSample, true);
  view.setUint16(34, bytesPerSample * 8, true);
  writeAscii(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  speakerPrerollSilenceUrl = URL.createObjectURL(new Blob([buffer], { type: 'audio/wav' }));
  return speakerPrerollSilenceUrl;
}

export async function findBridgeAudioOutputId(attempts = 1): Promise<string | null> {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const sinkId = await findBridgeAudioOutputIdOnce();
    if (sinkId) {
      return sinkId;
    }
    if (attempt + 1 < attempts) {
      await delay(TEST_SPEAKER_ENDPOINT_RETRY_MS);
    }
  }
  if (await unlockMediaDeviceLabels()) {
    for (let attempt = 0; attempt < attempts; attempt += 1) {
      const sinkId = await findBridgeAudioOutputIdOnce();
      if (sinkId) {
        return sinkId;
      }
      if (attempt + 1 < attempts) {
        await delay(TEST_SPEAKER_ENDPOINT_RETRY_MS);
      }
    }
  }
  return null;
}

export let speakerToneAudio: SinkSelectableAudio | null = null;
export let speakerToneSinkId: string | null = null;

export function resetSpeakerToneAudio(): void {
  if (speakerToneAudio) {
    try {
      speakerToneAudio.pause();
      speakerToneAudio.removeAttribute('src');
      speakerToneAudio.load();
    } catch {
      // Ignore teardown races while Windows is removing the audio endpoint.
    }
  }
  speakerToneAudio = null;
  speakerToneSinkId = null;
}

export async function playSpeakerAudioSource(sourceUrl: string): Promise<void> {
  const sinkId = await findBridgeAudioOutputId(TEST_SPEAKER_ENDPOINT_ATTEMPTS);
  if (!sinkId) {
    throw new Error(BRIDGE_AUDIO_ENDPOINT_UNAVAILABLE);
  }

  // Reuse the persistent Audio element if the endpoint hasn't changed.
  // This keeps the WASAPI session alive so the firmware audio pipeline stays warm.
  if (!speakerToneAudio || speakerToneSinkId !== sinkId) {
    const audio = new Audio() as SinkSelectableAudio;
    audio.volume = 1;
    if (!audio.setSinkId) {
      throw new Error(BRIDGE_AUDIO_ENDPOINT_UNAVAILABLE);
    }
    try {
      await audio.setSinkId(sinkId);
    } catch {
      throw new Error(BRIDGE_AUDIO_ENDPOINT_UNAVAILABLE);
    }
    if (audio.sinkId !== undefined && audio.sinkId !== sinkId) {
      throw new Error(BRIDGE_AUDIO_ENDPOINT_UNAVAILABLE);
    }
    speakerToneAudio = audio;
    speakerToneSinkId = sinkId;
  }

  const audio = speakerToneAudio;
  audio.src = sourceUrl;
  audio.currentTime = 0;

  await new Promise<void>((resolve, reject) => {
    let settled = false;
    const mediaDevices = navigator.mediaDevices;
    const fail = (error: Error) => {
      if (settled) {
        return;
      }
      settled = true;
      cleanup();
      reject(error);
    };
    const finish = () => {
      if (settled) {
        return;
      }
      settled = true;
      cleanup();
      resolve();
    };
    const verifySink = () => {
      void (async () => {
        const currentSinkId = await findBridgeAudioOutputIdOnce();
        if (
          currentSinkId !== sinkId
          || (audio.sinkId !== undefined && audio.sinkId !== sinkId)
        ) {
          resetSpeakerToneAudio();
          fail(new Error(BRIDGE_AUDIO_ENDPOINT_UNAVAILABLE));
        }
      })();
    };
    const verifyTimer = window.setInterval(verifySink, TEST_SPEAKER_ENDPOINT_VERIFY_MS);
    function cleanup() {
      window.clearInterval(verifyTimer);
      audio.removeEventListener('ended', finish);
      audio.removeEventListener('error', onAudioError);
      mediaDevices?.removeEventListener?.('devicechange', verifySink);
    }
    function onAudioError() {
      fail(new Error('Speaker test audio playback failed.'));
    }

    audio.addEventListener('ended', finish, { once: true });
    audio.addEventListener('error', onAudioError, { once: true });
    mediaDevices?.addEventListener?.('devicechange', verifySink);
    audio.play().then(verifySink).catch((error: unknown) => {
      fail(error instanceof Error ? error : new Error('Speaker test audio playback failed.'));
    });
  });
}

export async function playSpeakerToneFile(): Promise<void> {
  await playSpeakerAudioSource(getSpeakerPrerollSilenceUrl());
  await delay(25);
  await playSpeakerAudioSource(testSpeakerToneUrl);
}

export let micListenAudio: HTMLAudioElement | null = null;
export let micListenStream: MediaStream | null = null;
export let micListenTimer: number | null = null;
export let micListenResolve: (() => void) | null = null;

export function stopMicLiveListen(): void {
  if (micListenTimer !== null) {
    window.clearTimeout(micListenTimer);
  }
  micListenTimer = null;
  if (micListenAudio) {
    try {
      micListenAudio.pause();
      micListenAudio.srcObject = null;
    } catch {
      // Ignore teardown races while the mic endpoint is closing.
    }
  }
  micListenAudio = null;
  micListenStream?.getTracks().forEach((track) => track.stop());
  micListenStream = null;
  const resolve = micListenResolve;
  micListenResolve = null;
  resolve?.();
}

export async function openBridgeMicStream(): Promise<MediaStream> {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error(BRIDGE_MIC_ENDPOINT_UNAVAILABLE);
  }

  const inputId = await findBridgeAudioInputId();
  if (!inputId) {
    throw new Error(BRIDGE_MIC_ENDPOINT_UNAVAILABLE);
  }

  return navigator.mediaDevices.getUserMedia({
    audio: {
      deviceId: { exact: inputId },
      echoCancellation: false,
      noiseSuppression: false,
      autoGainControl: false
    },
    video: false
  });
}

export async function playMicLiveListen(durationMs: number): Promise<void> {
  stopMicLiveListen();
  const stream = await openBridgeMicStream();
  const audio = new Audio();
  audio.srcObject = stream;
  audio.volume = 1;
  micListenAudio = audio;
  micListenStream = stream;

  try {
    await audio.play();
  } catch (error) {
    stopMicLiveListen();
    throw error;
  }

  await new Promise<void>((resolve) => {
    micListenResolve = resolve;
    micListenTimer = window.setTimeout(stopMicLiveListen, durationMs);
  });
}
