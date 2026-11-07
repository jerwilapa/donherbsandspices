import { Request, Response } from "express";
import { db } from "../config/db";
import { allocateId, collection, documentId, listDocuments, snapshotData } from "../utils/firestore";
import { resolveProductImage } from "../utils/productImage";

const getUserCart = async (userId: number) => {
  const carts = await listDocuments(
    collection("cart").where("user_id", "==", userId).limit(1),
  );
  return carts[0] || null;
};

export const addToCart = async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const { productId, quantity = 1 } = req.body;
  if (!userId) return res.status(401).json({ message: "Unauthorized" });
  if (
    !Number.isInteger(Number(productId)) ||
    Number(productId) <= 0 ||
    !Number.isInteger(quantity) ||
    quantity <= 0
  ) {
    return res.status(400).json({ message: "Product and positive quantity are required." });
  }

  try {
    const productRef = collection("products").doc(documentId(productId));
    await db.runTransaction(async (transaction) => {
      const productSnapshot = await transaction.get(productRef);
      const product = snapshotData(productSnapshot);
      if (!product) throw new Error("PRODUCT_NOT_FOUND");

      const cartQuery = collection("cart").where("user_id", "==", userId).limit(1);
      const cartQuerySnapshot = await transaction.get(cartQuery);
      let cart = cartQuerySnapshot.docs[0]
        ? snapshotData(cartQuerySnapshot.docs[0])
        : null;
      let cartRef = cartQuerySnapshot.docs[0]?.ref;
      let newCartId = 0;
      if (!cart) {
        const counterRef = collection("_counters").doc("cart");
        const counterSnapshot = await transaction.get(counterRef);
        newCartId = Number(counterSnapshot.data()?.value || 0) + 1;
        cartRef = collection("cart").doc(documentId(newCartId));
        cart = { id: newCartId, user_id: userId, created_at: new Date() };
      }

      const cartId = Number(cart.id);
      const itemQuery = collection("cart_items").where("cart_id", "==", cartId);
      const itemSnapshot = await transaction.get(itemQuery);
      const existingSnapshot = itemSnapshot.docs.find(
        (snapshot) => Number(snapshot.data().product_id) === Number(productId),
      );
      const existing = existingSnapshot ? snapshotData(existingSnapshot) : null;
      const newQuantity = Number(existing?.quantity || 0) + quantity;
      if (newQuantity > Number(product.stock)) throw new Error("STOCK_LIMIT");

      let newItemId = 0;
      let itemRef = existingSnapshot?.ref;
      if (!existing) {
        const counterRef = collection("_counters").doc("cart_items");
        const counterSnapshot = await transaction.get(counterRef);
        newItemId = Number(counterSnapshot.data()?.value || 0) + 1;
        itemRef = collection("cart_items").doc(documentId(newItemId));
      }

      if (!cartQuerySnapshot.docs.length) {
        transaction.set(collection("_counters").doc("cart"), { value: newCartId });
        transaction.create(cartRef!, cart);
      }
      if (!existing) {
        transaction.set(collection("_counters").doc("cart_items"), { value: newItemId });
        transaction.create(itemRef!, {
          id: newItemId,
          cart_id: cartId,
          product_id: Number(productId),
          quantity,
        });
      } else {
        transaction.update(itemRef!, { quantity: newQuantity });
      }
    });
    return res.json({ message: "Added to cart" });
  } catch (error) {
    if (error instanceof Error && error.message === "PRODUCT_NOT_FOUND") {
      return res.status(404).json({ message: "Product not found" });
    }
    if (error instanceof Error && error.message === "STOCK_LIMIT") {
      return res.status(400).json({ message: "Cannot add more than available stock" });
    }
    console.error("Add to cart error", error);
    return res.status(500).json({ message: "Unable to update cart" });
  }
};

export const getCart = async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ message: "Unauthorized" });
  try {
    const cart = await getUserCart(userId);
    if (!cart) return res.json([]);
    const items = await listDocuments(
      collection("cart_items").where("cart_id", "==", Number(cart.id)),
    );
    if (!items.length) return res.json([]);
    const productSnapshots = await db.getAll(
      ...items.map((item) => collection("products").doc(documentId(item.product_id))),
    );
    const products = new Map(
      productSnapshots
        .map((snapshot) => snapshotData(snapshot))
        .filter((product): product is NonNullable<typeof product> => product !== null)
        .map((product) => [Number(product.id), product]),
    );
    return res.json(
      items.flatMap((item) => {
        const product = products.get(Number(item.product_id));
        return product
          ? [{
              id: item.id,
              product_id: item.product_id,
              quantity: item.quantity,
              name: product.name,
              price: product.price,
              image: resolveProductImage(product.name, product.image),
              stock: product.stock,
            }]
          : [];
      }),
    );
  } catch (error) {
    console.error("Get cart error", error);
    return res.status(500).json({ message: "Unable to retrieve cart" });
  }
};

export const updateCartItem = async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const id = typeof req.params.id === "string" ? req.params.id : "";
  const { quantity } = req.body;
  if (!userId) return res.status(401).json({ message: "Unauthorized" });
  if (!Number.isInteger(Number(id)) || Number(id) <= 0 ||
      !Number.isInteger(quantity) || quantity <= 0) {
    return res.status(400).json({ message: "A positive whole-number quantity is required." });
  }

  try {
    const itemRef = collection("cart_items").doc(documentId(id));
    await db.runTransaction(async (transaction) => {
      const itemSnapshot = await transaction.get(itemRef);
      const item = snapshotData(itemSnapshot);
      if (!item) throw new Error("CART_ITEM_NOT_FOUND");
      const cartRef = collection("cart").doc(documentId(item.cart_id));
      const productRef = collection("products").doc(documentId(item.product_id));
      const [cartSnapshot, productSnapshot] = await Promise.all([
        transaction.get(cartRef),
        transaction.get(productRef),
      ]);
      const cart = snapshotData(cartSnapshot);
      const product = snapshotData(productSnapshot);
      if (!cart || Number(cart.user_id) !== userId) throw new Error("CART_ITEM_NOT_FOUND");
      if (!product) throw new Error("PRODUCT_NOT_FOUND");
      if (quantity > Number(product.stock)) throw new Error("STOCK_LIMIT");
      transaction.update(itemRef, { quantity });
    });
    return res.json({ message: "Cart updated" });
  } catch (error) {
    if (error instanceof Error && error.message === "CART_ITEM_NOT_FOUND") {
      return res.status(404).json({ message: "Cart item not found" });
    }
    if (error instanceof Error && error.message === "STOCK_LIMIT") {
      return res.status(400).json({ message: "Quantity exceeds available stock" });
    }
    console.error("Update cart item error", error);
    return res.status(500).json({ message: "Unable to update cart item" });
  }
};

export const removeCartItem = async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const id = typeof req.params.id === "string" ? req.params.id : "";
  if (!userId) return res.status(401).json({ message: "Unauthorized" });
  try {
    const itemRef = collection("cart_items").doc(documentId(id));
    await db.runTransaction(async (transaction) => {
      const itemSnapshot = await transaction.get(itemRef);
      const item = snapshotData(itemSnapshot);
      if (!item) return;
      const cartSnapshot = await transaction.get(
        collection("cart").doc(documentId(item.cart_id)),
      );
      const cart = snapshotData(cartSnapshot);
      if (!cart || Number(cart.user_id) !== userId) throw new Error("CART_ITEM_NOT_FOUND");
      transaction.delete(itemRef);
    });
    return res.json({ message: "Item removed" });
  } catch (error) {
    if (error instanceof Error && error.message === "CART_ITEM_NOT_FOUND") {
      return res.status(404).json({ message: "Cart item not found" });
    }
    console.error("Remove cart item error", error);
    return res.status(500).json({ message: "Unable to remove cart item" });
  }
};

export const getCartCount = async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ message: "Unauthorized" });
  try {
    const cart = await getUserCart(userId);
    if (!cart) return res.json({ count: 0 });
    const items = await listDocuments(
      collection("cart_items").where("cart_id", "==", Number(cart.id)),
    );
    return res.json({
      count: items.reduce((total, item) => total + Number(item.quantity || 0), 0),
    });
  } catch (error) {
    console.error("Get cart count error", error);
    return res.status(500).json({ message: "Unable to retrieve cart count" });
  }
};
