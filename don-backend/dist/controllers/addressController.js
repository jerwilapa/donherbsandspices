"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setDefaultAddress = exports.saveAddress = exports.getSavedAddress = void 0;
const db_1 = require("../config/db");
const firestore_1 = require("../utils/firestore");
const addressResponse = (address) => ({
    id: address.id,
    userId: address.user_id,
    fullName: address.full_name,
    phone: address.phone,
    addressLine: address.address_line,
    province: address.province,
    municipality: address.municipality,
    barangay: address.barangay,
    postal: address.postal_code,
    country: address.country,
    isDefault: Boolean(address.is_default),
});
const getSavedAddress = async (req, res) => {
    const userId = req.user?.id;
    if (!userId)
        return res.status(401).json({ message: "Unauthorized" });
    try {
        const addresses = await (0, firestore_1.listDocuments)((0, firestore_1.collection)("user_addresses").where("user_id", "==", userId));
        addresses.sort((a, b) => Number(Boolean(b.is_default)) - Number(Boolean(a.is_default)) ||
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        return res.json(addresses.map(addressResponse));
    }
    catch (error) {
        console.error("Get saved address error", error);
        return res.status(500).json({ message: "Unable to retrieve addresses" });
    }
};
exports.getSavedAddress = getSavedAddress;
const saveAddress = async (req, res) => {
    const { fullName, phone, addressLine, province, municipality, barangay, postalCode, country, isDefault, } = req.body;
    const userId = req.user?.id;
    if (!userId)
        return res.status(401).json({ message: "Unauthorized" });
    if (typeof fullName !== "string" || !fullName.trim() ||
        typeof phone !== "string" || !phone.trim() ||
        typeof addressLine !== "string" || !addressLine.trim()) {
        return res.status(400).json({ message: "Name, phone, and address are required." });
    }
    try {
        const addressCounter = (0, firestore_1.collection)("_counters").doc("user_addresses");
        const addressesQuery = (0, firestore_1.collection)("user_addresses").where("user_id", "==", userId);
        const id = await db_1.db.runTransaction(async (transaction) => {
            const [counterSnapshot, addressSnapshot] = await Promise.all([
                transaction.get(addressCounter),
                isDefault ? transaction.get(addressesQuery) : Promise.resolve(null),
            ]);
            const nextId = Number(counterSnapshot.data()?.value || 0) + 1;
            if (addressSnapshot) {
                addressSnapshot.docs.forEach((snapshot) => transaction.update(snapshot.ref, { is_default: 0 }));
            }
            transaction.set(addressCounter, { value: nextId });
            transaction.create((0, firestore_1.collection)("user_addresses").doc((0, firestore_1.documentId)(nextId)), {
                id: nextId,
                user_id: userId,
                full_name: fullName.trim(),
                phone: phone.trim(),
                address_line: addressLine.trim(),
                province: province || "",
                municipality: municipality || "",
                barangay: barangay || "",
                postal_code: postalCode || "",
                country: country || "Philippines",
                is_default: isDefault ? 1 : 0,
                created_at: new Date(),
            });
            return nextId;
        });
        return res.json({ success: true, id });
    }
    catch (error) {
        console.error("Save address error", error);
        return res.status(500).json({ success: false, message: "Unable to save address" });
    }
};
exports.saveAddress = saveAddress;
const setDefaultAddress = async (req, res) => {
    const userId = req.user?.id;
    const { addressId } = req.body;
    if (!userId)
        return res.status(401).json({ message: "Unauthorized" });
    if (!Number.isInteger(Number(addressId)) || Number(addressId) <= 0) {
        return res.status(400).json({ message: "A valid address ID is required." });
    }
    try {
        await db_1.db.runTransaction(async (transaction) => {
            const addresses = await transaction.get((0, firestore_1.collection)("user_addresses").where("user_id", "==", userId));
            const selected = addresses.docs.find((snapshot) => Number(snapshot.data().id ?? snapshot.id) === Number(addressId));
            if (!selected)
                throw new Error("ADDRESS_NOT_FOUND");
            addresses.docs.forEach((snapshot) => transaction.update(snapshot.ref, {
                is_default: snapshot.id === selected.id ? 1 : 0,
            }));
        });
        return res.json({ success: true });
    }
    catch (error) {
        if (error instanceof Error && error.message === "ADDRESS_NOT_FOUND") {
            return res.status(404).json({ success: false, message: "Address not found" });
        }
        console.error("Set default address error", error);
        return res.status(500).json({ success: false, message: "Failed to set default" });
    }
};
exports.setDefaultAddress = setDefaultAddress;
//# sourceMappingURL=addressController.js.map