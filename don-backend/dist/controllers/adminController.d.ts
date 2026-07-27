import { Request, Response } from "express";
export declare const getOrdersAdmin: (req: Request, res: Response) => Promise<void>;
export declare const updateOrderStatus: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getProductsAdmin: (req: Request, res: Response) => Promise<void>;
export declare const createProduct: (req: any, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const updateProduct: (req: any, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const deleteProduct: (req: Request, res: Response) => Promise<void>;
export declare const getCategoriesAdmin: (req: Request, res: Response) => Promise<void>;
export declare const createCategory: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const updateCategory: (req: Request, res: Response) => Promise<void>;
export declare const deleteCategory: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=adminController.d.ts.map