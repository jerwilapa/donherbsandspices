import dotenv from "dotenv";
import path from "path";
import app from "./app";
import { getJwtSecret } from "./utils/jwt";

for (const envPath of [
  path.resolve(process.cwd(), ".env"),
  path.resolve(process.cwd(), "src", ".env"),
]) {
  dotenv.config({ path: envPath });
}

getJwtSecret();

const port = Number(process.env.PORT || 5000);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("PORT must be an integer between 1 and 65535.");
}

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
