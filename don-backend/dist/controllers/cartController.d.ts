import { Request, Response } from "express";
export declare const addToCart: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getCart: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const updateCartItem: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const removeCartItem: (req: Request, res: Response) => Promise<void>;
export declare const getCartCount: (req: any, res: any) => Promise<void>;
//# sourceMappingURL=cartController.d.ts.map