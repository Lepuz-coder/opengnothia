export class AIError extends Error {
  public readonly statusCode: number | undefined;
  public readonly rawBody: string | undefined;

  constructor(message: string, statusCode?: number, rawBody?: string) {
    super(message);
    this.name = "AIError";
    this.statusCode = statusCode;
    this.rawBody = rawBody;
  }
}
