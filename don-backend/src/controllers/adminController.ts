import { Request, Response } from "express";
import { db } from "../config/db";
import { notifyUserById } from "../utils/firebase";

const resolveStatusValue = async (conn: any, statusCode: string) => {
  try {
    const [rows]: any = await conn.query(
      "SELECT id FROM order_status WHERE code = ? OR name = ? LIMIT 1",
      [statusCode, statusCode],
    );

    if (rows.length > 0) return rows[0].id;
  } catch (_err) {
    // ignore and fall back to literal
  }

  return statusCode;
};

export const getOrdersAdmin = async (req: Request, res: Response) => {
  try {
    const [rows]: any = await db.query(
            `SELECT o.id, o.user_id, u.fullname AS customer_name, u.email AS customer_email,
              o.total, o.delivery_method, o.created_at,
              MAX(COALESCE(os.name, o.status)) AS status,
              COUNT(oi.id) AS itemCount
         FROM orders o
         LEFT JOIN users u ON u.id = o.user_id
         LEFT JOIN order_status os ON os.id = o.status OR os.code = o.status OR os.name = o.status
         LEFT JOIN order_items oi ON oi.order_id = o.id
        GROUP BY o.id, o.user_id, u.fullname, u.email, o.total, o.delivery_method, o.created_at
        ORDER BY o.created_at DESC`,
    );

    res.json(rows);
  } catch (error) {
    console.error("Admin get orders error", error);
    res.status(500).json({ message: "Unable to fetch orders", error });
  }
};

export const getAdminOrderDetails = async (req: Request, res: Response) => {
  const { orderId } = req.params;

  try {
    const [orderRows]: any = await db.query(
      `SELECT o.id, o.user_id, u.fullname AS customer_name, u.email AS customer_email,
              o.total, o.delivery_method, o.created_at,
              COALESCE(
                (SELECT os.name FROM order_status os
                  WHERE os.id = o.status OR os.code = o.status OR os.name = o.status
                  LIMIT 1),
                o.status
              ) AS status,
              oa.full_name, oa.phone, oa.address_line, oa.province, oa.municipality,
              oa.barangay, oa.postal_code, oa.country
         FROM orders o
         JOIN users u ON u.id = o.user_id
         LEFT JOIN order_addresses oa ON oa.order_id = o.id
        WHERE o.id = ?
        LIMIT 1`,
      [orderId],
    );

    if (!orderRows.length) {
      return res.status(404).json({ message: "Order not found" });
    }

    const [items]: any = await db.query(
      `SELECT oi.id, oi.product_id,
              COALESCE(p.name, CONCAT('Product #', oi.product_id)) AS product_name,
              oi.quantity, oi.price
         FROM order_items oi
         LEFT JOIN products p ON p.id = oi.product_id
        WHERE oi.order_id = ?
        ORDER BY oi.id`,
      [orderId],
    );

    return res.json({ ...orderRows[0], items });
  } catch (error) {
    console.error("Admin get order details error", error);
    return res.status(500).json({ message: "Unable to fetch order details", error });
  }
};

export const updateOrderStatus = async (req: Request, res: Response) => {
  const { orderId } = req.params;
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({ message: "Status is required" });
  }

  try {
    // If order_status table exists, try to resolve provided status (name/code) to its id
    let statusToSet: any = status;
    try {
      const resolved = await resolveStatusValue(db, status);
      statusToSet = resolved;
    } catch (_e) {
      // ignore and use literal value
    }

    await db.query("UPDATE orders SET status = ? WHERE id = ?", [
      statusToSet,
      orderId,
    ]);

    try {
      const [orderRows]: any = await db.query(
        "SELECT user_id FROM orders WHERE id = ?",
        [orderId],
      );
      const userId = orderRows?.[0]?.user_id;

      if (userId) {
        await notifyUserById({
          userId,
          title: "Order status updated",
          body: `Your order #${orderId} is now ${status}.`,
          data: {
            type: "order_status",
            orderId: String(orderId),
            status: String(status),
          },
        });
      }
    } catch (notifyError) {
      console.error("Order status notification failed", notifyError);
    }

    res.json({ message: "Order status updated" });
  } catch (error) {
    console.error("Admin update order status error", error);
    res.status(500).json({ message: "Unable to update order status", error });
  }
};

export const getProductsAdmin = async (req: Request, res: Response) => {
  try {
    const [rows]: any = await db.query(
      "SELECT * FROM products ORDER BY id DESC",
    );
    res.json(rows);
  } catch (error) {
    console.error("Admin get products error", error);
    res.status(500).json({ message: "Unable to fetch products", error });
  }
};

export const createProduct = async (req: any, res: Response) => {
  const { name, price, stock, category_id } = req.body;

  if (!name || price === undefined) {
    return res.status(400).json({ message: "Name and price are required" });
  }

  try {
    if (
      category_id !== null &&
      category_id !== undefined &&
      category_id !== ""
    ) {
      const [categoryRows]: any = await db.query(
        "SELECT id FROM categories WHERE id = ?",
        [category_id],
      );

      if (categoryRows.length === 0) {
        return res.status(400).json({ message: "Category not found" });
      }
    }

    // ✅ FIX: get uploaded file
    const imageUrl = req.file ? `/uploads/products/${req.file.filename}` : "";

    const [result]: any = await db.query(
      "INSERT INTO products (name, price, stock, image, category_id) VALUES (?, ?, ?, ?, ?)",
      [name, price, stock || 0, imageUrl, category_id || null],
    );

    res.status(201).json({
      message: "Product created",
      id: result.insertId,
      image: imageUrl,
    });
  } catch (error) {
    console.error("Admin create product error", error);
    res.status(500).json({ message: "Unable to create product", error });
  }
};

export const updateProduct = async (req: any, res: Response) => {
  const { productId } = req.params;

  try {
    const { name, price, stock, category_id } = req.body;

    if (!name || price === undefined) {
      return res.status(400).json({ message: "Name and price are required" });
    }

    if (
      category_id !== null &&
      category_id !== undefined &&
      category_id !== ""
    ) {
      const [categoryRows]: any = await db.query(
        "SELECT id FROM categories WHERE id = ?",
        [category_id],
      );

      if (categoryRows.length === 0) {
        return res.status(400).json({ message: "Category not found" });
      }
    }

    // 🔥 FIX: always ensure safe image value
    let imageUrl = null;

    if (req.file) {
      imageUrl = `/uploads/products/${req.file.filename}`;
    }

    // fallback to existing image from DB
    if (!imageUrl) {
      const [rows]: any = await db.query(
        "SELECT image FROM products WHERE id = ?",
        [productId],
      );

      imageUrl = rows?.[0]?.image || "";
    }

    await db.query(
      `UPDATE products 
       SET name = ?, price = ?, stock = ?, image = ?, category_id = ? 
       WHERE id = ?`,
      [name, price, stock, imageUrl, category_id || null, productId],
    );

    res.json({ message: "Product updated" });
  } catch (error) {
    console.error("Admin update product error", error);
    res.status(500).json({ message: "Unable to update product", error });
  }
};

export const deleteProduct = async (req: Request, res: Response) => {
  const { productId } = req.params;

  try {
    // delete dependent rows first
    await db.query("DELETE FROM order_items WHERE product_id = ?", [productId]);

    await db.query("DELETE FROM products WHERE id = ?", [productId]);

    res.json({ message: "Product deleted" });
  } catch (error) {
    console.error("Admin delete product error", error);
    res.status(500).json({
      message: "Unable to delete product",
      error,
    });
  }
};

export const getCategoriesAdmin = async (req: Request, res: Response) => {
  try {
    const [rows]: any = await db.query(
      "SELECT * FROM categories ORDER BY id DESC",
    );
    res.json(rows);
  } catch (error) {
    console.error("Admin get categories error", error);
    res.status(500).json({ message: "Unable to fetch categories", error });
  }
};

export const createCategory = async (req: Request, res: Response) => {
  const { name, image } = req.body;

  if (!name) {
    return res.status(400).json({ message: "Name is required" });
  }

  try {
    const [result]: any = await db.query(
      "INSERT INTO categories (name, image) VALUES (?, ?)",
      [name, image || ""],
    );

    res.status(201).json({ message: "Category created", id: result.insertId });
  } catch (error) {
    console.error("Admin create category error", error);
    res.status(500).json({ message: "Unable to create category", error });
  }
};

export const updateCategory = async (req: Request, res: Response) => {
  const { categoryId } = req.params;
  const { name, image } = req.body;

  try {
    await db.query("UPDATE categories SET name = ?, image = ? WHERE id = ?", [
      name,
      image,
      categoryId,
    ]);

    res.json({ message: "Category updated" });
  } catch (error) {
    console.error("Admin update category error", error);
    res.status(500).json({ message: "Unable to update category", error });
  }
};

export const deleteCategory = async (req: Request, res: Response) => {
  const { categoryId } = req.params;

  try {
    await db.query("DELETE FROM categories WHERE id = ?", [categoryId]);
    res.json({ message: "Category deleted" });
  } catch (error) {
    console.error("Admin delete category error", error);
    res.status(500).json({ message: "Unable to delete category", error });
  }
};

export const getAdminCustomers = async (_req: Request, res: Response) => {
  try {
    const [rows]: any = await db.query(
      `SELECT u.id, u.fullname, u.email, u.created_at,
              COUNT(DISTINCT o.id) AS orderCount,
              COALESCE(SUM(o.total), 0) AS lifetimeValue
         FROM users u
         LEFT JOIN orders o ON o.user_id = u.id
        WHERE u.role = 'customer'
        GROUP BY u.id, u.fullname, u.email, u.created_at
        ORDER BY u.created_at DESC, u.id DESC`,
    );

    res.json(rows);
  } catch (error) {
    console.error("Admin get customers error", error);
    res.status(500).json({ message: "Unable to fetch customers", error });
  }
};
