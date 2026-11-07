import dotenv from "dotenv";
import fs from "fs";
import { applicationDefault, cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

dotenv.config();

const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
let serviceAccount: Record<string, unknown> | undefined;

if (serviceAccountJson) {
  try {
    serviceAccount = JSON.parse(serviceAccountJson) as Record<string, unknown>;
  } catch {
    throw new Error("FIREBASE_SERVICE_ACCOUNT must contain valid JSON.");
  }
}

const projectId =
  process.env.FIREBASE_PROJECT_ID ||
  (typeof serviceAccount?.project_id === "string" ? serviceAccount.project_id : undefined);

if (!projectId) {
  throw new Error("FIREBASE_PROJECT_ID or a project_id in FIREBASE_SERVICE_ACCOUNT is required.");
}

const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
if (credentialsPath && !serviceAccount) {
  try {
    if (!fs.statSync(credentialsPath).isFile()) {
      throw new Error("not a file");
    }
  } catch {
    throw new Error(
      `GOOGLE_APPLICATION_CREDENTIALS must point to an existing service-account JSON file: ${credentialsPath}`,
    );
  }
}

const app =
  getApps()[0] ||
  initializeApp({
    projectId,
    credential: serviceAccount ? cert(serviceAccount as Parameters<typeof cert>[0]) : applicationDefault(),
  });

export const db = getFirestore(app);
db.settings({ ignoreUndefinedProperties: true });
