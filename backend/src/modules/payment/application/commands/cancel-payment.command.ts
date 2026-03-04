export class CancelPaymentCommand {
  constructor(
    public readonly paymentId: string,
    public readonly userId: string,
  ) {}
}
