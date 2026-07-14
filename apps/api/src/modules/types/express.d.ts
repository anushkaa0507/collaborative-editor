import { Role } from "../generated/prisma";

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      documentRole?: Role | "OWNER";
    }
  }
}

export {};