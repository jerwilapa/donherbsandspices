import { Request, Response } from "express";
/**
 * Persist an order and its items.
 * Tables assumed to exist:
 *  - orders(id, user_id, total, status, delivery_method, created_at)
 *  - order_items(id, order_id, product_id, quantity, price)
 */
export declare const placeOrder: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getOrders: (req: any, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=orderController.d.ts.map