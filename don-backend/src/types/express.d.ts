declare global {
  namespace Express {
    interface AuthenticatedUser {
      id: number;
      email: string;
      role: "admin" | "customer";
    }

    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export {};
