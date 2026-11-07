import { Request, Response } from "express";
export declare const addToCart: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getCart: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateCartItem: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const removeCartItem: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getCartCount: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=cartController.d.ts.map