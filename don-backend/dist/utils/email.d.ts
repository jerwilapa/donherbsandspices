type OrderItem = {
    name?: string;
    quantity?: number;
    price?: number;
};
type OrderEmailPayload = {
    recipientEmail: string;
    customerName?: string;
    orderId: number;
    total?: number;
    deliveryMethod?: string | null;
    items: OrderItem[];
};
export declare const sendOrderPlacedEmail: (payload: OrderEmailPayload) => Promise<{
    ok: boolean;
    reason: string;
    error?: never;
} | {
    ok: boolean;
    reason?: never;
    error?: never;
} | {
    ok: boolean;
    reason: string;
    error: unknown;
}>;
export {};
//# sourceMappingURL=email.d.ts.map