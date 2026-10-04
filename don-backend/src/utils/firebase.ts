import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";
import { db } from "../config/db";

const getServiceAccount = () => {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch (error) {
    console.warn("Firebase service account is not valid JSON.", error);
    return null;
  }
};

const ensureFirebaseApp = () => {
  if (getApps().length > 0) return;

  const serviceAccount = getServiceAccount();
  const hasProjectConfig = !!(
    process.env.FIREBASE_PROJECT_ID ||
    process.env.GOOGLE_APPLICATION_CREDENTIALS
  );

  if (serviceAccount) {
    initializeApp({
      credential: cert(serviceAccount),
    });
    return;
  }

  if (hasProjectConfig) {
    initializeApp();
    return;
  }

  console.warn(
    "Firebase Admin is not configured. Set FIREBASE_SERVICE_ACCOUNT or GOOGLE_APPLICATION_CREDENTIALS.",
  );
};

const normalizePayload = (data?: Record<string, string | number | boolean>) => {
  if (!data) return undefined;

  return Object.fromEntries(
    Object.entries(data).map(([key, value]) => [key, String(value)]),
  );
};

export const sendFirebaseNotificationToToken = async ({
  token,
  title,
  body,
  data,
}: {
  token?: string | null;
  title: string;
  body: string;
  data?: Record<string, string | number | boolean>;
}) => {
  if (!token) {
    return { ok: false, reason: "missing-token" };
  }

  ensureFirebaseApp();

  if (getApps().length === 0) {
    return { ok: false, reason: "firebase-not-configured" };
  }

  try {
    const message: any = {
      token,
      notification: {
        title,
        body,
      },
      android: {
        priority: "high",
      },
      apns: {
        headers: {
          "apns-priority": "10",
        },
      },
    };

    const normalizedData = normalizePayload(data);
    if (normalizedData) {
      message.data = normalizedData;
    }

    await getMessaging().send(message);

    return { ok: true };
  } catch (error) {
    console.error("Firebase push notification failed", error);
    return { ok: false, reason: "send-failed", error };
  }
};

export const notifyUserById = async ({
  userId,
  title,
  body,
  data,
}: {
  userId: number;
  title: string;
  body: string;
  data?: Record<string, string | number | boolean>;
}) => {
  try {
    const [rows]: any = await db.query(
      "SELECT fcm_token FROM users WHERE id = ?",
      [userId],
    );

    const token = rows?.[0]?.fcm_token;
    const payload: {
      token: string | null;
      title: string;
      body: string;
      data?: Record<string, string | number | boolean>;
    } = {
      token: token ?? null,
      title,
      body,
    };

    if (data !== undefined) {
      payload.data = data;
    }

    return sendFirebaseNotificationToToken(payload);
  } catch (error) {
    console.error("Unable to fetch user FCM token", error);
    return { ok: false, reason: "token-fetch-failed", error };
  }
};
