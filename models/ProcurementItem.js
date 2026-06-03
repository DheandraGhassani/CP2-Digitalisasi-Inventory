const db = require('../config/database');

class ProcurementItem {
    static async getByDraft(draftId) {
        return db.query(`
            SELECT i.*,
                   a.label_code  AS replaced_label,
                   a.product_name AS replaced_name
            FROM procurement_items i
            LEFT JOIN inventory_assets a ON i.replaces_asset_id = a.id
            WHERE i.procurement_drafts_id = ?
            ORDER BY i.id
        `, [draftId]);
    }

    static async findById(id) {
        const rows = await db.query('SELECT * FROM procurement_items WHERE id = ?', [id]);
        return rows[0] || null;
    }

    static async create(d) {
        const res = await db.query(`
            INSERT INTO procurement_items
                (product_type, product_name, price, quantity, purchase_link, procurement_drafts_id, replaces_asset_id)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
            d.product_type, d.product_name, d.price, d.quantity,
            d.purchase_link || null, d.procurement_drafts_id, d.replaces_asset_id || null
        ]);
        return res.insertId;
    }

    static async update(id, d) {
        await db.query(`
            UPDATE procurement_items
            SET product_type = ?, product_name = ?, price = ?, quantity = ?, purchase_link = ?, replaces_asset_id = ?
            WHERE id = ?
        `, [
            d.product_type, d.product_name, d.price, d.quantity,
            d.purchase_link || null, d.replaces_asset_id || null, id
        ]);
        return true;
    }

    static async delete(id) {
        await db.query('DELETE FROM procurement_items WHERE id = ?', [id]);
        return true;
    }

    // Kaprodi approves/rejects a single item
    static async updateApproval(id, status) {
        await db.query('UPDATE procurement_items SET approval_status = ? WHERE id = ?', [status, id]);
        return true;
    }

    // Approved items from finalized drafts — the staff_admin receiving queue
    static async getApprovedForReceiving() {
        return db.query(`
            SELECT i.*, d.year, d.id AS draft_id,
                (SELECT COALESCE(SUM(total_received), 0) FROM receipt WHERE procurement_items_id = i.id) AS received_qty,
                (SELECT COUNT(*) FROM inventory_assets WHERE procurement_items_id = i.id) AS asset_count
            FROM procurement_items i
            JOIN procurement_drafts d ON i.procurement_drafts_id = d.id
            WHERE d.status = 'finalized' AND i.approval_status = 'approved'
            ORDER BY d.year DESC, i.id
        `);
    }

    // Item + its draft context (status/year)
    static async findWithContext(id) {
        const rows = await db.query(`
            SELECT i.*, d.status AS draft_status, d.year
            FROM procurement_items i
            JOIN procurement_drafts d ON i.procurement_drafts_id = d.id
            WHERE i.id = ?
        `, [id]);
        return rows[0] || null;
    }
}

module.exports = ProcurementItem;
