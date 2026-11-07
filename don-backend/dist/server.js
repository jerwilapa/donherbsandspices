"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const app_1 = __importDefault(require("./app"));
const jwt_1 = require("./utils/jwt");
for (const envPath of [
    path_1.default.resolve(process.cwd(), ".env"),
    path_1.default.resolve(process.cwd(), "src", ".env"),
]) {
    dotenv_1.default.config({ path: envPath });
}
(0, jwt_1.getJwtSecret)();
const port = Number(process.env.PORT || 5000);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("PORT must be an integer between 1 and 65535.");
}
app_1.default.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
//# sourceMappingURL=server.js.map