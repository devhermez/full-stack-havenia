import type { Jwtuser } from "../auth/middleware";

declare global {
  namespace Express {
    interface Request {
      user?: Jwtuser;
    }
  }
}
export {};
