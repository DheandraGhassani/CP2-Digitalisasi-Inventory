const db = require('../config/database');

class ProcurementDraft {
    // Drafts belonging to a specific kalab, with item count + total cost
    static async getAllByUser(userId) {
        return db.query(`
            SELECT d.*,
                (SELECT COUNT(*) FROM procurement_items i WHERE i.procurement_drafts_id = d.id) AS item_count,
                (SELECT COALESCE(SUM(i.price * i.quantity), 0) FROM procurement_items i WHERE i.procurement_drafts_id = d.id) AS total_cost
            FROM procurement_drafts d
            WHERE d.users_id = ?
            ORDER BY d.year DESC, d.id DESC
        `, [userId]);
    }

    // All drafts (used by kaprodi later)
    static async getAll() {
        return db.query(`
            SELECT d.*, u.name AS creator_name,
                (SELECT COUNT(*) FROM procurement_items i WHERE i.procurement_drafts_id = d.id) AS item_count
            FROM procurement_drafts d
            LEFT JOIN users u ON d.users_id = u.id
            ORDER BY d.year DESC, d.id DESC
        `);
    }

    // Drafts submitted for kaprodi review (locked / reviewed / finalized)
    static async getForReview() {
        return db.query(`
            SELECT d.*, u.name AS creator_name,
                (SELECT COUNT(*) FROM procurement_items i WHERE i.procurement_drafts_id = d.id) AS item_count,
                (SELECT COUNT(*) FROM procurement_items i WHERE i.procurement_drafts_id = d.id AND i.approval_status = 'pending') AS pending_count,
                (SELECT COALESCE(SUM(i.price * i.quantity), 0) FROM procurement_items i WHERE i.procurement_drafts_id = d.id) AS total_cost
            FROM procurement_drafts d
            LEFT JOIN users u ON d.users_id = u.id
            WHERE d.status IN ('locked', 'reviewed', 'finalized')
            ORDER BY FIELD(d.status, 'locked', 'reviewed', 'finalized'), d.year DESC, d.id DESC
        `);
    }

    static async findById(id) {
        const rows = await db.query(`
            SELECT d.*, u.name AS creator_name, rv.name AS reviewer_name
            FROM procurement_drafts d
            LEFT JOIN users u ON d.users_id = u.id
            LEFT JOIN users rv ON d.reviewed_by = rv.id
            WHERE d.id = ?
        `, [id]);
        return rows[0] || null;
    }

    static async create({ year, users_id }) {
        const res = await db.query(
            'INSERT INTO procurement_drafts (year, status, users_id) VALUES (?, ?, ?)',
            [year, 'draft', users_id]
        );
        return res.insertId;
    }

    static async updateStatus(id, status, reviewed_by = null) {
        if (reviewed_by !== null) {
            await db.query('UPDATE procurement_drafts SET status = ?, reviewed_by = ? WHERE id = ?', [status, reviewed_by, id]);
        } else {
            await db.query('UPDATE procurement_drafts SET status = ? WHERE id = ?', [status, id]);
        }
        return true;
    }

    // Delete draft + its items (FK is NO ACTION, so remove children first)
    static async delete(id) {
        await db.query('DELETE FROM procurement_items WHERE procurement_drafts_id = ?', [id]);
        await db.query('DELETE FROM procurement_drafts WHERE id = ?', [id]);
        return true;
    }
}

module.exports = ProcurementDraft;
