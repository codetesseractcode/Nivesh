export class RefundPaymentCommand {
  constructor(
    public readonly paymentId: string,
    public readonly userId: string,
    public readonly isPartial: boolean = false,
  ) {}
}
