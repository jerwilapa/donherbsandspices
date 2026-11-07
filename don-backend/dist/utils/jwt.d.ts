export declare const getJwtSecret: () => string;
export declare const generateToken: (user: {
    id: number;
    email: string;
    role: "admin" | "customer";
}) => string;
//# sourceMappingURL=jwt.d.ts.map