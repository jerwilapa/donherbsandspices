import * as pdfjs from "pdfjs-dist";
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import * as XLSX from "@e965/xlsx";

pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

export type SourcePriceRow = {
    name: string;
    oneKg: number;
    fiveHundredG: number;
    row: number;
};

export type ParsedPriceList = {
    rows: SourcePriceRow[];
    warnings: string[];
};

const normalizeHeader = (value: unknown) =>
    String(value ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");

const parsePrice = (value: unknown): number | null => {
    if (typeof value === "number") {
        return Number.isFinite(value) && value > 0 ? value : null;
    }

    const text = String(value ?? "").trim();
    if (!text) return null;

    const amount = Number(text.replace(/[₱$,\s]/g, ""));
    return Number.isFinite(amount) && amount > 0 ? amount : null;
};

const findPriceColumns = (headers: unknown[]) => {
    const normalized = headers.map(normalizeHeader);
    const oneKg = normalized.findIndex(
        (value) => value.includes("1kg") || value.includes("1000g"),
    );
    const fiveHundredG = normalized.findIndex((value) =>
        value.includes("500g") || value.includes("500gram"),
    );

    return { oneKg, fiveHundredG };
};

const findNameColumn = (
    headers: unknown[],
    priceColumns: { oneKg: number; fiveHundredG: number },
) => {
    const explicit = headers.findIndex((header) =>
        /^(product|products|item|items|spice|spices|name)$/.test(
            normalizeHeader(header),
        ),
    );
    if (explicit >= 0) return explicit;

    const firstPrice = Math.min(priceColumns.oneKg, priceColumns.fiveHundredG);
    return headers.findIndex(
        (header, index) => index < firstPrice && String(header ?? "").trim(),
    );
};

const parseSpreadsheet = async (file: File): Promise<ParsedPriceList> => {
    const workbook = XLSX.read(await file.arrayBuffer(), {
        type: "array",
        cellDates: false,
        bookVBA: false,
    });
    const rows: SourcePriceRow[] = [];
    const warnings: string[] = [];
    let headerFound = false;

    for (const sheetName of workbook.SheetNames) {
        const sheet = workbook.Sheets[sheetName];
        const values = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
            header: 1,
            raw: true,
            defval: "",
        });
        const headerIndex = values.slice(0, 40).findIndex((row) => {
            const columns = findPriceColumns(row);
            return columns.oneKg >= 0 && columns.fiveHundredG >= 0;
        });
        if (headerIndex < 0) continue;

        const headers = values[headerIndex];
        const columns = findPriceColumns(headers);
        const nameColumn = findNameColumn(headers, columns);
        if (nameColumn < 0) {
            warnings.push(`${sheetName}: could not identify the product-name column.`);
            continue;
        }

        headerFound = true;
        for (let index = headerIndex + 1; index < values.length; index += 1) {
            const row = values[index];
            const name = String(row[nameColumn] ?? "").trim();
            if (!name) continue;

            const oneKg = parsePrice(row[columns.oneKg]);
            const fiveHundredG = parsePrice(row[columns.fiveHundredG]);
            if (oneKg === null || fiveHundredG === null) {
                warnings.push(`${sheetName}, row ${index + 1}: missing a valid 1kg or 500g price for "${name}".`);
                continue;
            }

            rows.push({ name, oneKg, fiveHundredG, row: index + 1 });
        }
    }

    if (!headerFound) {
        throw new Error("No sheet has both a 1kg and a 500g price column.");
    }

    return { rows, warnings };
};

type PositionedText = { text: string; x: number; y: number };
type TextLine = { y: number; items: PositionedText[] };

const groupTextLines = (items: PositionedText[]): TextLine[] => {
    const lines: TextLine[] = [];
    for (const item of items.sort((a, b) => a.y - b.y || a.x - b.x)) {
        let line = lines.find((candidate) => Math.abs(candidate.y - item.y) <= 3);
        if (!line) {
            line = { y: item.y, items: [] };
            lines.push(line);
        }
        line.items.push(item);
    }
    return lines;
};

const findHeaderColumn = (
    line: TextLine,
    predicate: (normalizedText: string) => boolean,
) =>
    line.items.find((item) => predicate(normalizeHeader(item.text)))?.x ?? null;

const parsePdf = async (file: File): Promise<ParsedPriceList> => {
    const loadingTask = pdfjs.getDocument({ data: await file.arrayBuffer() });
    const document = await loadingTask.promise;

    if (document.numPages > 100) {
        await loadingTask.destroy();
        throw new Error("PDFs must contain 100 pages or fewer.");
    }

    const rows: SourcePriceRow[] = [];
    const warnings: string[] = [];
    let headerFound = false;

    try {
        for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
            const page = await document.getPage(pageNumber);
            const content = await page.getTextContent();
            const items: PositionedText[] = content.items.flatMap((item) => {
                if (!("str" in item) || !item.str.trim()) return [];
                return [{ text: item.str.trim(), x: item.transform[4], y: item.transform[5] }];
            });
            const lines = groupTextLines(items);
            const header = lines.find((line) => {
                const normalized = line.items.map((item) => normalizeHeader(item.text));
                return normalized.some((value) => value.includes("1kg") || value.includes("1000g"))
                    && normalized.some((value) => value.includes("500g") || value.includes("500gram"));
            });
            if (!header) continue;

            const oneKgX = findHeaderColumn(
                header,
                (value) => value.includes("1kg") || value.includes("1000g"),
            );
            const fiveHundredGX = findHeaderColumn(
                header,
                (value) => value.includes("500g") || value.includes("500gram"),
            );
            if (oneKgX === null || fiveHundredGX === null) continue;

            const categoryX = findHeaderColumn(header, (value) => value === "category");
            const nameHeaderX = findHeaderColumn(
                header,
                (value) => ["spice", "spices", "product", "products", "item", "items", "name"].includes(value),
            );
            const nameMinX = nameHeaderX === null ? Number.NEGATIVE_INFINITY : nameHeaderX - 20;
            const nameMaxX = categoryX !== null
                ? categoryX - 5
                : Math.min(oneKgX, fiveHundredGX) - 30;
            const columnGap = Math.abs(oneKgX - fiveHundredGX);
            headerFound = true;

            for (const line of lines) {
                if (line.y >= header.y - 3) continue;
                const name = line.items
                    .filter((item) => item.x >= nameMinX && item.x < nameMaxX)
                    .map((item) => item.text)
                    .join(" ")
                    .replace(/\s+/g, " ")
                    .trim();
                if (!name) continue;

                let oneKg: number | null = null;
                let fiveHundredG: number | null = null;
                for (const item of line.items) {
                    const price = parsePrice(item.text);
                    if (price === null) continue;
                    if (Math.abs(item.x - oneKgX) <= columnGap * 0.6) oneKg = price;
                    if (Math.abs(item.x - fiveHundredGX) <= columnGap * 0.6) fiveHundredG = price;
                }

                if (oneKg === null || fiveHundredG === null) {
                    continue;
                }
                rows.push({ name, oneKg, fiveHundredG, row: pageNumber });
            }
        }
    } finally {
        await loadingTask.destroy();
    }

    if (!headerFound) {
        throw new Error("Could not find 1kg and 500g column headers in this PDF.");
    }
    if (rows.length === 0) {
        throw new Error("No product rows with readable 1kg and 500g prices were found in this PDF.");
    }

    return { rows, warnings };
};

export const parsePriceListFile = async (file: File): Promise<ParsedPriceList> => {
    if (file.size === 0) throw new Error("The selected file is empty.");
    if (file.size > 10 * 1024 * 1024) throw new Error("Files must be 10 MB or smaller.");

    const extension = file.name.split(".").pop()?.toLowerCase();
    if (extension === "pdf") return parsePdf(file);
    if (extension === "xlsx" || extension === "xls") return parseSpreadsheet(file);
    throw new Error("Choose an Excel (.xlsx, .xls) or PDF (.pdf) pricelist.");
};

export const normalizePriceListProductName = (name: string) =>
    name
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s*-\s*(?:1\s*kg|500\s*g)\s*$/i, "")
        .toLowerCase()
        .replace(/&/g, "and")
        .replace(/[^a-z0-9]/g, "");
