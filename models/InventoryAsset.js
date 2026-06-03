const db = require('../config/database');

class InventoryAsset {
    static getAll() {
        return db.query(`
            SELECT a.*, r.room_name, r.room_code
            FROM inventory_assets a
            LEFT JOIN rooms r ON a.rooms_id = r.id
            ORDER BY a.id DESC
        `);
    }

    static getByItem(itemId) {
        return db.query(`
            SELECT a.*, r.room_code, r.room_name
            FROM inventory_assets a
            LEFT JOIN rooms r ON a.rooms_id = r.id
            WHERE a.procurement_items_id = ?
            ORDER BY a.id
        `, [itemId]);
    }

    static async countByItem(itemId) {
        const r = await db.query('SELECT COUNT(*) AS c FROM inventory_assets WHERE procurement_items_id = ?', [itemId]);
        return Number(r[0].c);
    }

    static async findById(id) {
        const rows = await db.query(`
            SELECT a.*, r.room_code, r.room_name
            FROM inventory_assets a
            LEFT JOIN rooms r ON a.rooms_id = r.id
            WHERE a.id = ?
        `, [id]);
        return rows[0] || null;
    }

    static async labelExists(code) {
        const rows = await db.query('SELECT id FROM inventory_assets WHERE label_code = ?', [code]);
        return rows.length > 0;
    }

    static async create(d) {
        const res = await db.query(`
            INSERT INTO inventory_assets
                (product_name, label_code, qr_code_path, \`condition\`, date_acquired, price, procurement_items_id, rooms_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            d.product_name, d.label_code, d.qr_code_path || null, d.condition || 'good',
            d.date_acquired || null, d.price || null, d.procurement_items_id, d.rooms_id
        ]);
        return res.insertId;
    }

    // Update condition (used by maintenance in Fase 5)
    static async updateCondition(id, condition) {
        await db.query('UPDATE inventory_assets SET `condition` = ? WHERE id = ?', [condition, id]);
        return true;
    }
}

module.exports = InventoryAsset;
