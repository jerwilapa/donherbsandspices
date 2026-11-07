import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { getJwtSecret } from "../utils/jwt";

export const verifyToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: "No token provided" });
  }

  const token = authHeader.match(/^Bearer\s+(\S+)$/i)?.[1];
  if (!token) {
    return res.status(401).json({ message: "A valid bearer token is required" });
  }

  try {
    const decoded = jwt.verify(token, getJwtSecret());
    if (
      typeof decoded === "string" ||
      typeof decoded.id !== "number" ||
      !Number.isInteger(decoded.id) ||
      (decoded.role !== "admin" && decoded.role !== "customer") ||
      typeof decoded.email !== "string"
    ) {
      return res.status(403).json({ message: "Invalid token" });
    }
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    };
    next();
  } catch {
    return res.status(403).json({ message: "Invalid token" });
  }
};

export const verifyAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }

  next();
};
