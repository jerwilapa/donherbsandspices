import type {
  CollectionReference,
  DocumentData,
  DocumentSnapshot,
  Query,
} from "firebase-admin/firestore";
import { db } from "../config/db";

export const documentId = (id: string | number) => String(id);

export const collection = (name: string): CollectionReference =>
  db.collection(name);

export const snapshotData = <T extends DocumentData>(
  snapshot: DocumentSnapshot<T>,
): (T & { id: string | number }) | null => {
  if (!snapshot.exists) return null;
  const data = snapshot.data();
  if (!data) return null;
  return {
    ...(toClientValue(data) as T),
    id: data.id ?? (Number.isSafeInteger(Number(snapshot.id)) ? Number(snapshot.id) : snapshot.id),
  } as T & { id: string | number };
};

export const listDocuments = async <T extends DocumentData>(
  query: Query<T>,
): Promise<Array<T & { id: string | number }>> => {
  const result = await query.get();
  return result.docs.map((snapshot) => snapshotData(snapshot) as T & { id: string | number });
};

export const getDocument = async <T extends DocumentData>(
  name: string,
  id: string | number,
): Promise<(T & { id: string | number }) | null> =>
  snapshotData(await collection(name).doc(documentId(id)).get()) as
    | (T & { id: string | number })
    | null;

export const allocateId = async (name: string): Promise<number> => {
  const counter = db.collection("_counters").doc(name);
  return db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(counter);
    const next = Number(snapshot.data()?.value || 0) + 1;
    transaction.set(counter, { value: next }, { merge: true });
    return next;
  });
};

export const toClientValue = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(toClientValue);
  if (value && typeof value === "object") {
    const candidate = value as { toDate?: () => Date };
    if (typeof candidate.toDate === "function") return candidate.toDate();
    return Object.fromEntries(
      Object.entries(value).map(([key, child]) => [key, toClientValue(child)]),
    );
  }
  return value;
};
