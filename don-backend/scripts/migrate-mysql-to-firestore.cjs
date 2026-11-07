require("dotenv").config();

const crypto = require("node:crypto");
const fs = require("node:fs");
const mysql = require("mysql2/promise");
const { applicationDefault, cert, getApps, initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

const tables = [
  "users",
  "categories",
  "products",
  "cart",
  "cart_items",
  "favorites",
  "user_addresses",
  "order_status",
  "orders",
  "order_addresses",
  "order_items",
];
const idFieldByTable = { order_addresses: "order_id" };

const emailIndexId = (email) =>
  crypto.createHash("sha256").update(email.trim().toLowerCase()).digest("hex");

const requireEnv = (name, fallbackName) => {
  const value = process.env[name] || (fallbackName && process.env[fallbackName]);
  if (!value) throw new Error(`${name} must be configured.`);
  return value;
};

const createFirestore = () => {
  const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (credentialsPath) {
    let credentialStats;
    try {
      credentialStats = fs.statSync(credentialsPath);
    } catch {
      throw new Error(
        `GOOGLE_APPLICATION_CREDENTIALS points to a file that does not exist: ${credentialsPath}. ` +
          "Download a Firebase service-account JSON key and update this path, or unset the variable and configure Google ADC.",
      );
    }
    if (!credentialStats.isFile()) {
      throw new Error(
        `GOOGLE_APPLICATION_CREDENTIALS must point to a service-account JSON file, not a directory: ${credentialsPath}`,
      );
    }
  }

  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
    ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
    : null;
  const projectId = process.env.FIREBASE_PROJECT_ID || serviceAccount?.project_id;
  if (!projectId) throw new Error("FIREBASE_PROJECT_ID is required.");
  if (!serviceAccount && !credentialsPath && !process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    console.warn(
      "No service-account file was specified. Firebase will use Google Application Default Credentials.",
    );
  }
  const app =
    getApps()[0] ||
    initializeApp({
      projectId,
      credential: serviceAccount ? cert(serviceAccount) : applicationDefault(),
    });
  return getFirestore(app);
};

const main = async () => {
  const dryRun = process.env.FIRESTORE_MIGRATION_DRY_RUN !== "false";
  if (!dryRun && process.env.FIRESTORE_MIGRATION_CONFIRM !== "YES") {
    throw new Error(
      "Set FIRESTORE_MIGRATION_CONFIRM=YES only after backing up MySQL and checking the Firestore target project.",
    );
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const firestore = dryRun ? null : createFirestore();
  const sql = await mysql.createConnection({
    host: requireEnv("SOURCE_DB_HOST", "DB_HOST"),
    port: Number(process.env.SOURCE_DB_PORT || process.env.DB_PORT || 3306),
    user: requireEnv("SOURCE_DB_USER", "DB_USER"),
    password: requireEnv("SOURCE_DB_PASSWORD", "DB_PASSWORD"),
    database: requireEnv("SOURCE_DB_NAME", "DB_NAME"),
    dateStrings: false,
  });
  const maxIds = {};
  const seenEmails = new Map();
  let totalRows = 0;

  try {
    if (!dryRun) console.log(`Target Firebase project: ${projectId || "from service account"}`);
    for (const table of tables) {
      await sql.query(`SELECT 1 FROM \`${table}\` LIMIT 0`);
    }
    const [duplicateEmails] = await sql.query(
      "SELECT LOWER(TRIM(email)) AS normalized_email FROM users GROUP BY LOWER(TRIM(email)) HAVING COUNT(*) > 1 LIMIT 1",
    );
    if (duplicateEmails.length) {
      throw new Error(
        `MySQL contains duplicate normalized account emails: ${duplicateEmails[0].normalized_email}`,
      );
    }

    for (const table of tables) {
      let offset = 0;
      let tableRows = 0;
      while (true) {
        const pageSize = table === "users" ? 200 : 400;
        const [rows] = await sql.query(`SELECT * FROM \`${table}\` LIMIT ? OFFSET ?`, [pageSize, offset]);
        if (rows.length === 0) break;
        const batch = firestore?.batch();
        for (const row of rows) {
          const idField = idFieldByTable[table] || "id";
          const legacyId = row[idField];
          if (legacyId === undefined || legacyId === null) {
            throw new Error(`Missing ${idField} while migrating ${table}.`);
          }
          const data = { ...row };
          let documentKey = String(legacyId);
          if (table === "users" && typeof row.email === "string") {
            const email = row.email.trim().toLowerCase();
            if (seenEmails.has(email) && seenEmails.get(email) !== row.id) {
              throw new Error(`Duplicate user email in MySQL: ${email}`);
            }
            seenEmails.set(email, row.id);
            data.email = email;
            batch?.set(firestore.collection("userEmailIndex").doc(emailIndexId(email)), {
                user_id: row.id,
              });
          }
          if (table === "favorites") {
            documentKey = `${row.user_id}_${row.product_id}`;
          }

          batch?.set(firestore.collection(table).doc(documentKey), data);
          if (Number.isSafeInteger(Number(legacyId))) {
            maxIds[table] = Math.max(maxIds[table] || 0, Number(legacyId));
          }
        }

        if (batch) await batch.commit();
        tableRows += rows.length;
        totalRows += rows.length;
        offset += rows.length;
      }
      console.log(`${dryRun ? "Would migrate" : "Migrated"} ${tableRows} rows from ${table}`);
    }

    if (firestore) {
      for (const [collection, value] of Object.entries(maxIds)) {
        const counterRef = firestore.collection("_counters").doc(collection);
        await firestore.runTransaction(async (transaction) => {
          const snapshot = await transaction.get(counterRef);
          transaction.set(counterRef, {
            value: Math.max(Number(snapshot.data()?.value || 0), value),
          });
        });
      }
    }

    console.log(
      `${dryRun ? "Dry run complete" : "Migration complete"}: ${totalRows} rows across ${tables.length} collections.`,
    );
    if (dryRun) {
      console.log("Set FIRESTORE_MIGRATION_DRY_RUN=false and FIRESTORE_MIGRATION_CONFIRM=YES to write.");
    }
  } finally {
    await sql.end();
  }
};

main().catch((error) => {
  console.error("MySQL to Firestore migration failed:", error);
  process.exitCode = 1;
});
