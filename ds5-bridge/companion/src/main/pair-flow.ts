import type { VdsBluetoothMode, VdsStatus } from '../shared/vds';
import type { PairingResult } from './controller-pairing';

export type PairFlowStage = 'to-normal' | 'restoring' | 'attaching';

const SETTLE_TIMEOUT_MS = 20_000;
const SETTLE_POLL_MS = 500;

/**
 * The pairing steps from the README, done for you: in OpenDS5 mode vdsd owns
 * controller Bluetooth, so switch to Normal mode, pair through BlueZ, switch
 * back (also after a failure or cancel), then attach the new controller.
 */
export async function pairNewController(deps: {
  status(): Promise<VdsStatus>;
  setMode(mode: VdsBluetoothMode): Promise<VdsStatus>;
  pair(): Promise<PairingResult>;
  attach(address: string): Promise<VdsStatus>;
  progress(stage: PairFlowStage): void;
  sleep?(ms: number): Promise<void>;
}): Promise<{ result: PairingResult; status: VdsStatus | null }> {
  const sleep = deps.sleep ?? ((ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms)));
  const settle = async () => {
    for (let waited = 0; waited < SETTLE_TIMEOUT_MS; waited += SETTLE_POLL_MS) {
      const status = await deps.status();
      if (!status.bluetooth?.switching) return status;
      await sleep(SETTLE_POLL_MS);
    }
    return deps.status();
  };

  const before = await deps.status();
  const switchBack = before.bluetooth?.mode === 'vds';
  if (switchBack) {
    deps.progress('to-normal');
    await deps.setMode('normal');
    await settle();
  }
  let result: PairingResult;
  try {
    result = await deps.pair();
  } finally {
    if (switchBack) {
      deps.progress('restoring');
      await deps.setMode('vds');
      await settle();
    }
  }
  if (!result.ok) {
    return { result, status: await deps.status() };
  }
  deps.progress('attaching');
  return { result, status: await deps.attach(result.address) };
}
