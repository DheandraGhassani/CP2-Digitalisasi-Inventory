const db = require('../config/database');

class BhpStock {
    static getAll() {
        return db.query(`
            SELECT b.*, r.room_name, r.room_code
            FROM bhp_stocks b
            LEFT JOIN rooms r ON b.rooms_id = r.id
            ORDER BY b.product_name
        `);
    }

    static async findById(id) {
        const rows = await db.query(`
            SELECT b.*, r.room_name, r.room_code
            FROM bhp_stocks b
            LEFT JOIN rooms r ON b.rooms_id = r.id
            WHERE b.id = ?
        `, [id]);
        return rows[0] || null;
    }

    static async create(d) {
        const res = await db.query(`
            INSERT INTO bhp_stocks (product_name, unit, current_stock, minimum_stock, unit_price, rooms_id)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [d.product_name, d.unit, d.current_stock || 0, d.minimum_stock || 0, d.unit_price || null, d.rooms_id]);
        return res.insertId;
    }

    static async update(id, d) {
        await db.query(`
            UPDATE bhp_stocks SET product_name = ?, unit = ?, minimum_stock = ?, unit_price = ?, rooms_id = ?
            WHERE id = ?
        `, [d.product_name, d.unit, d.minimum_stock || 0, d.unit_price || null, d.rooms_id, id]);
    }

    static async delete(id) {
        await db.query('DELETE FROM bhp_stocks WHERE id = ?', [id]);
    }

    static async addStockIn(id, qty, userId, description) {
        const conn = await db.getConnection();
        try {
            await conn.beginTransaction();
            await conn.query('UPDATE bhp_stocks SET current_stock = current_stock + ? WHERE id = ?', [qty, id]);
            await conn.query(`
                INSERT INTO bhp_stock_log (status, total, description, users_id, bhp_stocks_id)
                VALUES ('in', ?, ?, ?, ?)
            `, [qty, description || 'Stok masuk', userId, id]);
            await conn.commit();
        } catch (e) {
            await conn.rollback();
            throw e;
        } finally {
            conn.release();
        }
    }

    static getLog(bhpStockId) {
        return db.query(`
            SELECT l.*, u.name AS user_name
            FROM bhp_stock_log l
            LEFT JOIN users u ON l.users_id = u.id
            WHERE l.bhp_stocks_id = ?
            ORDER BY l.id DESC
        `, [bhpStockId]);
    }
}

module.exports = BhpStock;
