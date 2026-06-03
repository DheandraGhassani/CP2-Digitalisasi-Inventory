const db = require('../config/database');

class Receipt {
    static getByItem(itemId) {
        return db.query(`
            SELECT r.*, u.name AS receiver_name
            FROM receipt r
            LEFT JOIN users u ON r.users_id = u.id
            WHERE r.procurement_items_id = ?
            ORDER BY r.receipt_date, r.id
        `, [itemId]);
    }

    static async sumReceived(itemId) {
        const r = await db.query('SELECT COALESCE(SUM(total_received), 0) AS total FROM receipt WHERE procurement_items_id = ?', [itemId]);
        return Number(r[0].total);
    }

    static async create(d) {
        const res = await db.query(
            'INSERT INTO receipt (receipt_date, total_received, description, procurement_items_id, users_id) VALUES (?, ?, ?, ?, ?)',
            [d.receipt_date, d.total_received, d.description || null, d.procurement_items_id, d.users_id]
        );
        return res.insertId;
    }
}

module.exports = Receipt;
