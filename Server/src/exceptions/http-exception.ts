/**
 * A custom error class for handling expected HTTP errors (e.g., 404 Not Found, 400 Bad Request).
 * This allows us to throw controlled, status-aware errors from anywhere in the application.
 */
export class HttpException extends Error {
  public status: number;
  public message: string;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.message = message;
  }
}
