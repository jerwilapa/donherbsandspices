"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const fs_1 = __importDefault(require("fs"));
const app_1 = require("firebase-admin/app");
const firestore_1 = require("firebase-admin/firestore");
dotenv_1.default.config();
const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
let serviceAccount;
if (serviceAccountJson) {
    try {
        serviceAccount = JSON.parse(serviceAccountJson);
    }
    catch {
        throw new Error("FIREBASE_SERVICE_ACCOUNT must contain valid JSON.");
    }
}
const projectId = process.env.FIREBASE_PROJECT_ID ||
    (typeof serviceAccount?.project_id === "string" ? serviceAccount.project_id : undefined);
if (!projectId) {
    throw new Error("FIREBASE_PROJECT_ID or a project_id in FIREBASE_SERVICE_ACCOUNT is required.");
}
const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
if (credentialsPath && !serviceAccount) {
    try {
        if (!fs_1.default.statSync(credentialsPath).isFile()) {
            throw new Error("not a file");
        }
    }
    catch {
        throw new Error(`GOOGLE_APPLICATION_CREDENTIALS must point to an existing service-account JSON file: ${credentialsPath}`);
    }
}
const app = (0, app_1.getApps)()[0] ||
    (0, app_1.initializeApp)({
        projectId,
        credential: serviceAccount ? (0, app_1.cert)(serviceAccount) : (0, app_1.applicationDefault)(),
    });
exports.db = (0, firestore_1.getFirestore)(app);
exports.db.settings({ ignoreUndefinedProperties: true });
//# sourceMappingURL=db.js.map