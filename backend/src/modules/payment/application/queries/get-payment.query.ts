export class GetPaymentQuery {
  constructor(
    public readonly paymentId: string,
    public readonly userId: string,
  ) {}
}
