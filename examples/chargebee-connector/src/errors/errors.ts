export class AppError extends Error {
  statusCode: number;
  tryLater?: boolean;
  details?: unknown;

  constructor({
    statusCode,
    message,
    tryLater,
    details,
  }: {
    statusCode: number;
    message: string;
    tryLater?: boolean;
    details?: unknown;
  }) {
    super();
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);

    this.statusCode = statusCode;
    this.tryLater = tryLater;
    this.message = message;
    this.details = details;
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super({
      statusCode: 400,
      message,
      tryLater: false,
    });
  }
}
