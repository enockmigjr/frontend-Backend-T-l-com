const mockResetCsrfToken = jest.fn();

jest.mock('@/lib/api/client', () => ({ resetCsrfToken: mockResetCsrfToken }));

type MessageListener = (event: MessageEvent<unknown>) => void;

class FakeBroadcastChannel {
  static instances: FakeBroadcastChannel[] = [];
  readonly messages: unknown[] = [];
  private listener?: MessageListener;

  constructor(readonly name: string) {
    FakeBroadcastChannel.instances.push(this);
  }

  postMessage(value: unknown): void {
    this.messages.push(value);
  }

  addEventListener(_type: string, listener: MessageListener): void {
    this.listener = listener;
  }

  removeEventListener(): void {
    this.listener = undefined;
  }

  close(): void {}

  emit(value: unknown): void {
    this.listener?.(new MessageEvent('message', { data: value }));
  }
}

describe('canal de session', () => {
  beforeEach(() => {
    mockResetCsrfToken.mockClear();
    FakeBroadcastChannel.instances = [];
    Object.defineProperty(globalThis, 'BroadcastChannel', { configurable: true, value: FakeBroadcastChannel });
  });

  it('ne diffuse que le signal de session et réinitialise le CSRF local', async () => {
    const { publishSessionSignal } = await import('@/lib/auth/session-channel');

    publishSessionSignal('session-updated');

    expect(mockResetCsrfToken).toHaveBeenCalledTimes(1);
    expect(FakeBroadcastChannel.instances[0]?.messages).toEqual(['session-updated']);
  });

  it('ignore les messages non reconnus reçus depuis un autre onglet', async () => {
    const { subscribeSessionSignals } = await import('@/lib/auth/session-channel');
    const listener = jest.fn();
    const unsubscribe = subscribeSessionSignals(listener);
    const channel = FakeBroadcastChannel.instances[0];

    channel?.emit({ token: 'interdit' });
    channel?.emit('logout');

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith('logout');
    expect(mockResetCsrfToken).toHaveBeenCalledTimes(1);
    unsubscribe();
  });
});
