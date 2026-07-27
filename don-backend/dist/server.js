"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const app_1 = __importDefault(require("./app"));
for (const envPath of [
    path_1.default.resolve(process.cwd(), ".env"),
    path_1.default.resolve(process.cwd(), "src", ".env"),
]) {
    dotenv_1.default.config({ path: envPath });
}
const PORT = 5000;
app_1.default.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
//# sourceMappingURL=server.js.map