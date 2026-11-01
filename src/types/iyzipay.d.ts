declare module "iyzipay" {
  type Callback = (error: unknown, result: unknown) => void;
  export default class Iyzipay {
    constructor(config: { uri: string; apiKey: string; secretKey: string });
    checkoutFormInitialize: {
      create(request: Record<string, unknown>, callback: Callback): void;
    };
    checkoutForm: {
      retrieve(
        request: { locale: string; conversationId: string; token: string },
        callback: Callback,
      ): void;
    };
  }
}
