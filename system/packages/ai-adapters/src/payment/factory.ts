export interface PaymentAdapter {
  readonly name: string;
  readonly isMock: boolean;
  createCheckout(opts: { sku: string; amount: number; userId: string }): Promise<{ url: string; orderId: string }>;
}

class MockPaymentAdapter implements PaymentAdapter {
  readonly name = 'mock-paddle';
  readonly isMock = true;
  async createCheckout(opts: { sku: string; amount: number; userId: string }) {
    const orderId = `mock_${Date.now()}_${opts.userId.slice(0, 6)}`;
    return { url: `http://localhost:3100/payment/mock-success?order=${orderId}`, orderId };
  }
}

export function createPaymentAdapter(env: Record<string, string | undefined>): PaymentAdapter {
  if (env.PADDLE_API_KEY) {
    // TODO(zhiyu, 2026-04): 接入 Paddle Billing v1。
    return new MockPaymentAdapter();
  }
  return new MockPaymentAdapter();
}
