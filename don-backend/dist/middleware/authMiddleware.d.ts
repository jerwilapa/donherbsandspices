import { Response, NextFunction } from "express";
export declare const verifyToken: (req: any, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export declare const verifyAdmin: (req: any, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
//# sourceMappingURL=authMiddleware.d.ts.map