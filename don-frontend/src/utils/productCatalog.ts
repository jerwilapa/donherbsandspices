export type CatalogProductVariant = {
    id: number;
    name: string;
    price: number | string;
    stock: number;
    image: string;
    category_id: number | null;
};

export type CatalogProduct = {
    name: string;
    variants: { product: CatalogProductVariant; size: string }[];
};

const packSizePattern = / - (1kg|500g)$/i;

export const groupCatalogProducts = (
    products: CatalogProductVariant[],
): CatalogProduct[] => {
    const groups = new Map<string, CatalogProduct>();

    for (const product of products) {
        const match = product.name.match(packSizePattern);
        const name = match
            ? product.name.slice(0, match.index)
            : product.name;
        const size = match?.[1] || "Standard";
        const key = `${product.category_id ?? ""}:${name.toLocaleLowerCase()}`;
        const group = groups.get(key) || { name, variants: [] };

        group.variants.push({ product, size });
        groups.set(key, group);
    }

    return Array.from(groups.values()).map((group) => ({
        ...group,
        variants: group.variants.sort((a, b) => {
            const order = ["1kg", "500g", "Standard"];
            return order.indexOf(a.size) - order.indexOf(b.size);
        }),
    }));
};
