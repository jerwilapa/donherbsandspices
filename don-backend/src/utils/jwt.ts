import jwt from "jsonwebtoken";

const SECRET = "your_secret_key_here"; // move to env later

export const generateToken = (user: any) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    SECRET,
    { expiresIn: "1d" },
  );
};
