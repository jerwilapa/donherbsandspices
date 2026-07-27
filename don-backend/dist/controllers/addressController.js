"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setDefaultAddress = exports.saveAddress = exports.getSavedAddress = void 0;
const db_1 = require("../config/db");
const getSavedAddress = async (req, res) => {
    const { userId } = req.params;
    const [rows] = await db_1.db.query(`SELECT * FROM user_addresses WHERE user_id = ? ORDER BY is_default DESC, created_at DESC`, [userId]);
    const formatted = rows.map((r) => ({
        id: r.id,
        userId: r.user_id,
        fullName: r.full_name,
        phone: r.phone,
        addressLine: r.address_line,
        province: r.province,
        municipality: r.municipality,
        barangay: r.barangay,
        postal: r.postal_code,
        country: r.country,
        isDefault: Boolean(r.is_default),
    }));
    return res.json(formatted);
};
exports.getSavedAddress = getSavedAddress;
const saveAddress = async (req, res) => {
    const { userId, fullName, phone, addressLine, province, municipality, barangay, postalCode, country, isDefault, } = req.body;
    if (isDefault) {
        await db_1.db.query(`UPDATE user_addresses SET is_default = FALSE WHERE user_id = ?`, [userId]);
    }
    await db_1.db.query(`INSERT INTO user_addresses
  (user_id, full_name, phone, address_line, province, municipality, barangay, postal_code, country, is_default)
  VALUES (?,?,?,?,?,?,?,?,?,?)`, [
        userId,
        fullName,
        phone,
        addressLine,
        province,
        municipality,
        barangay,
        postalCode,
        country,
        isDefault ? 1 : 0,
    ]);
    res.json({ success: true });
};
exports.saveAddress = saveAddress;
const setDefaultAddress = async (req, res) => {
    const { userId, addressId } = req.body;
    const conn = await db_1.db.getConnection();
    try {
        await conn.beginTransaction();
        await conn.query(`UPDATE user_addresses SET is_default = 0 WHERE user_id = ?`, [userId]);
        await conn.query(`UPDATE user_addresses SET is_default = 1 WHERE id = ? AND user_id = ?`, [addressId, userId]);
        await conn.commit();
        res.json({ success: true });
    }
    catch (err) {
        await conn.rollback();
        res.status(500).json({ success: false, message: "Failed to set default" });
    }
    finally {
        conn.release();
    }
};
exports.setDefaultAddress = setDefaultAddress;
//# sourceMappingURL=addressController.js.map