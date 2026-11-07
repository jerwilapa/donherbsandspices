import jwt from "jsonwebtoken";
export const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32 || /^(replace|change|your)[-_ ]/i.test(secret)) {
    throw new Error("JWT_SECRET must be configured with at least 32 characters.");
  }
  return secret;
};

export const generateToken = (user: {
  id: number;
  email: string;
  role: "admin" | "customer";
}) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    getJwtSecret(),
    { expiresIn: "1d" },
  );
};
