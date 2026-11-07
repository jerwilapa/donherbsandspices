import { Request, Response } from "express";
export declare const getOrdersAdmin: (_req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getAdminOrderDetails: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateOrderStatus: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getProductsAdmin: (_req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const createProduct: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateProduct: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const deleteProduct: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getCategoriesAdmin: (_req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const createCategory: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateCategory: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const deleteCategory: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getAdminCustomers: (_req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=adminController.d.ts.map