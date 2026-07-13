export interface AuthenticatedRequest extends Express.Request {
  userId?: string;
}