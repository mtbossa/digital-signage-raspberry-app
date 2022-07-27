export class InternalError extends Error {
  constructor(
    public override message: string,
    protected code: number = 500,
    protected description?: string,
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}
