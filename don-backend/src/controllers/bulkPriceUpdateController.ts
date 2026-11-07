import { Request, Response } from "express";
import { db } from "../config/db";
import { collection, documentId, snapshotData } from "../utils/firestore";

type PriceUpdate = {
  productId: number;
  sourcePrice: number;
};

const MARKUP_FACTOR = 1.4;
const MAX_SOURCE_PRICE = 99_999_999.99 / MARKUP_FACTOR;

export const bulkUpdateProductPrices = async (req: Request, res: Response) => {
  const updates: unknown = req.body?.updates;
  if (!Array.isArray(updates) || updates.length === 0 || updates.length > 500) {
    return res.status(400).json({
      message: "Provide between 1 and 500 product prices to update.",
    });
  }

  const validated: PriceUpdate[] = [];
  const ids = new Set<number>();
  for (const update of updates) {
    if (!update || typeof update !== "object") {
      return res.status(400).json({
        message: "Each update needs a valid product ID and positive source price.",
      });
    }
    const candidate = update as Record<string, unknown>;
    const productId = candidate.productId;
    const sourcePrice = candidate.sourcePrice;
    if (
      typeof productId !== "number" ||
      !Number.isInteger(productId) ||
      productId <= 0 ||
      typeof sourcePrice !== "number" ||
      !Number.isFinite(sourcePrice) ||
      sourcePrice <= 0 ||
      sourcePrice > MAX_SOURCE_PRICE
    ) {
      return res.status(400).json({
        message: "Each update needs a valid product ID and positive source price.",
      });
    }
    if (ids.has(productId)) {
      return res.status(400).json({ message: "A product can only be updated once per import." });
    }
    ids.add(productId);
    validated.push({ productId, sourcePrice });
  }

  try {
    const products = await db.runTransaction(async (transaction) => {
      const refs = validated.map((update) =>
        collection("products").doc(documentId(update.productId)),
      );
      const snapshots = await Promise.all(refs.map((ref) => transaction.get(ref)));
      const existing = snapshots.map(snapshotData);
      if (existing.some((product) => !product)) throw new Error("PRODUCTS_NOT_FOUND");

      const productNames = new Map(
        existing.map((product) => [Number(product!.id), String(product!.name)]),
      );
      for (const update of validated) {
        const name = productNames.get(update.productId);
        if (!name || !/ - (?:1kg|500g)$/i.test(name)) {
          throw new Error("INVALID_VARIANT");
        }
      }

      const updated = validated.map((update, index) => {
        const priceCents = Math.round(update.sourcePrice * MARKUP_FACTOR * 100);
        const price = (priceCents / 100).toFixed(2);
        transaction.update(refs[index]!, { price });
        return {
          productId: update.productId,
          name: productNames.get(update.productId),
          price,
        };
      });
      return updated;
    });
    return res.json({
      message: "Product prices updated.",
      updated: products.length,
      products,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "PRODUCTS_NOT_FOUND") {
      return res.status(400).json({
        message: "One or more selected products no longer exist. Refresh and retry.",
      });
    }
    if (error instanceof Error && error.message === "INVALID_VARIANT") {
      return res.status(400).json({
        message: "Price imports can only update 1kg and 500g product variants.",
      });
    }
    console.error("Bulk product price update error", error);
    return res.status(500).json({ message: "Unable to update product prices." });
  }
};
