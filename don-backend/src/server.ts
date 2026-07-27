import dotenv from "dotenv";
import path from "path";
import app from "./app";

for (const envPath of [
  path.resolve(process.cwd(), ".env"),
  path.resolve(process.cwd(), "src", ".env"),
]) {
  dotenv.config({ path: envPath });
}

const PORT = 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
