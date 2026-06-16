const db = require('../config/database');

class MaintenanceLog {
    static getAll() {
        return db.query(`
            SELECT ml.*, ia.product_name AS asset_name, ia.label_code,
                   u.name AS technician_name
            FROM maintenance_logs ml
            JOIN inventory_assets ia ON ml.inventory_assets_id = ia.id
            JOIN users u ON ml.users_id = u.id
            ORDER BY ml.maintenance_date DESC, ml.id DESC
        `);
    }

    static async findById(id) {
        const rows = await db.query(`
            SELECT ml.*, ia.product_name AS asset_name, ia.label_code, ia.condition AS current_condition,
                   u.name AS technician_name, r.room_name
            FROM maintenance_logs ml
            JOIN inventory_assets ia ON ml.inventory_assets_id = ia.id
            JOIN rooms r ON ia.rooms_id = r.id
            JOIN users u ON ml.users_id = u.id
            WHERE ml.id = ?
        `, [id]);
        return rows[0] || null;
    }

    static getBhpUsage(logId) {
        return db.query(`
            SELECT mbu.*, bs.product_name, bs.unit
            FROM maintenance_bhp_usage mbu
            JOIN bhp_stocks bs ON mbu.bhp_stocks_id = bs.id
            WHERE mbu.maintenance_logs_id = ?
        `, [logId]);
    }

    // Transaction: create log + BHP usage entries + decrement stocks + bhp_stock_log entries
    static async create(data, bhpUsages, userId) {
        const conn = await db.getConnection();
        try {
            await conn.beginTransaction();

            const [logResult] = await conn.query(`
                INSERT INTO maintenance_logs
                    (maintenance_date, description, condition_before, condition_after, inventory_assets_id, users_id)
                VALUES (?, ?, ?, ?, ?, ?)
            `, [data.maintenance_date, data.description, data.condition_before, data.condition_after,
            data.inventory_assets_id, userId]);
            const logId = logResult.insertId;

            await conn.query('UPDATE inventory_assets SET `condition` = ? WHERE id = ?',
                [data.condition_after, data.inventory_assets_id]);

            for (const usage of bhpUsages) {
                if (!usage.bhp_stocks_id || !usage.total_used || usage.total_used < 1) continue;

                const [[stock]] = await conn.query(
                    'SELECT current_stock FROM bhp_stocks WHERE id = ? FOR UPDATE', [usage.bhp_stocks_id]);
                if (!stock || stock.current_stock < usage.total_used) {
                    throw new Error(`Stok tidak cukup untuk BHP id ${usage.bhp_stocks_id}`);
                }

                await conn.query(
                    'INSERT INTO maintenance_bhp_usage (total_used, maintenance_logs_id, bhp_stocks_id) VALUES (?, ?, ?)',
                    [usage.total_used, logId, usage.bhp_stocks_id]);

                await conn.query(
                    'UPDATE bhp_stocks SET current_stock = current_stock - ? WHERE id = ?',
                    [usage.total_used, usage.bhp_stocks_id]);

                await conn.query(`
                    INSERT INTO bhp_stock_log (status, total, description, users_id, bhp_stocks_id, maintenance_logs_id)
                    VALUES ('out', ?, ?, ?, ?, ?)
                `, [usage.total_used,
                `Digunakan untuk maintenance aset ID ${data.inventory_assets_id}`,
                    userId, usage.bhp_stocks_id, logId]);
            }

            await conn.commit();
            return logId;
        } catch (e) {
            await conn.rollback();
            throw e;
        } finally {
            conn.release();
        }
    }
}

module.exports = MaintenanceLog;
