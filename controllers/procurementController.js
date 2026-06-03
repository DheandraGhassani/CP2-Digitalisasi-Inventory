const ProcurementDraft = require('../models/ProcurementDraft');
const ProcurementItem = require('../models/ProcurementItem');
const db = require('../config/database');

// Load a draft and verify the logged-in kalab owns it. Sends error response and
// returns null if not found / not owned.
async function loadOwnedDraft(req, res) {
    const draft = await ProcurementDraft.findById(req.params.id);
    if (!draft) {
        res.status(404).render('error', { title: 'Tidak Ditemukan', message: 'Draf pengadaan tidak ditemukan.', backUrl: '/procurement' });
        return null;
    }
    if (draft.users_id !== req.session.user.id) {
        res.status(403).render('error', { title: '403 - Ditolak', message: 'Ini bukan draf Anda.', backUrl: '/procurement' });
        return null;
    }
    return draft;
}

// Returns false (and renders error) when the draft is locked/finalized.
function ensureEditable(draft, res) {
    if (draft.status !== 'draft') {
        res.status(400).render('error', {
            title: 'Draf Terkunci',
            message: `Draf berstatus "${draft.status}" tidak dapat diubah.`,
            backUrl: '/procurement/' + draft.id
        });
        return false;
    }
    return true;
}

const listDrafts = async (req, res) => {
    try {
        const drafts = await ProcurementDraft.getAllByUser(req.session.user.id);
        res.render('procurement/list', {
            title: 'Draf Pengadaan',
            drafts,
            success: req.query.success || null,
            user: req.session.user
        });
    } catch (err) {
        console.error('listDrafts:', err);
        res.status(500).render('error', { title: 'Error', message: 'Gagal memuat draf.' });
    }
};

const showCreateForm = (req, res) => {
    res.render('procurement/form', { title: 'Buat Draf Pengadaan', errors: null, user: req.session.user });
};

const createDraft = async (req, res) => {
    try {
        const year = parseInt(req.body.year, 10);
        if (!year || year < 2000 || year > 2100) {
            return res.render('procurement/form', {
                title: 'Buat Draf Pengadaan',
                errors: { year: 'Tahun tidak valid (2000-2100).' },
                user: req.session.user
            });
        }
        const id = await ProcurementDraft.create({ year, users_id: req.session.user.id });
        res.redirect('/procurement/' + id);
    } catch (err) {
        // Duplicate (year, users_id) -> uq_draft_year_user
        if (err.code === 'ER_DUP_ENTRY') {
            return res.render('procurement/form', {
                title: 'Buat Draf Pengadaan',
                errors: { year: 'Anda sudah punya draf untuk tahun tersebut.' },
                user: req.session.user
            });
        }
        console.error('createDraft:', err);
        res.status(500).render('error', { title: 'Error', message: 'Gagal membuat draf.' });
    }
};

const showDraft = async (req, res) => {
    try {
        const draft = await loadOwnedDraft(req, res);
        if (!draft) return;
        const items = await ProcurementItem.getByDraft(draft.id);
        const assets = await db.query('SELECT id, product_name, label_code FROM inventory_assets ORDER BY product_name');
        res.render('procurement/detail', {
            title: `Draf Pengadaan ${draft.year}`,
            draft,
            items,
            assets,
            editable: draft.status === 'draft',
            success: req.query.success || null,
            user: req.session.user
        });
    } catch (err) {
        console.error('showDraft:', err);
        res.status(500).render('error', { title: 'Error', message: 'Gagal memuat draf.' });
    }
};

const showItemForm = async (req, res) => {
    try {
        const draft = await loadOwnedDraft(req, res);
        if (!draft) return;
        if (!ensureEditable(draft, res)) return;
        const assets = await db.query('SELECT id, product_name, label_code FROM inventory_assets ORDER BY product_name');
        res.render('procurement/item-form', { title: 'Tambah Item', draft, item: null, assets, errors: null, user: req.session.user });
    } catch (err) {
        console.error('showItemForm:', err);
        res.status(500).render('error', { title: 'Error', message: 'Gagal memuat form.' });
    }
};

function parseItem(body) {
    return {
        product_type: body.product_type,
        product_name: (body.product_name || '').trim(),
        price: parseFloat(body.price),
        quantity: parseInt(body.quantity, 10),
        purchase_link: body.purchase_link,
        replaces_asset_id: body.product_type === 'inventaris' ? (body.replaces_asset_id || null) : null
    };
}

function validateItem(d) {
    const errors = {};
    if (!['inventaris', 'bhp'].includes(d.product_type)) errors.product_type = 'Tipe tidak valid.';
    if (!d.product_name) errors.product_name = 'Nama barang wajib diisi.';
    if (isNaN(d.price) || d.price < 0) errors.price = 'Harga tidak valid.';
    if (isNaN(d.quantity) || d.quantity < 1) errors.quantity = 'Jumlah minimal 1.';
    return Object.keys(errors).length ? errors : null;
}

const createItem = async (req, res) => {
    try {
        const draft = await loadOwnedDraft(req, res);
        if (!draft) return;
        if (!ensureEditable(draft, res)) return;
        const data = parseItem(req.body);
        const errors = validateItem(data);
        if (errors) {
            const assets = await db.query('SELECT id, product_name, label_code FROM inventory_assets ORDER BY product_name');
            return res.render('procurement/item-form', { title: 'Tambah Item', draft, item: req.body, assets, errors, user: req.session.user });
        }
        await ProcurementItem.create({ ...data, procurement_drafts_id: draft.id });
        res.redirect('/procurement/' + draft.id + '?success=Item ditambahkan');
    } catch (err) {
        console.error('createItem:', err);
        res.status(500).render('error', { title: 'Error', message: 'Gagal menambah item.' });
    }
};

const showEditItemForm = async (req, res) => {
    try {
        const draft = await loadOwnedDraft(req, res);
        if (!draft) return;
        if (!ensureEditable(draft, res)) return;
        const item = await ProcurementItem.findById(req.params.itemId);
        if (!item || item.procurement_drafts_id !== draft.id) {
            return res.status(404).render('error', { title: 'Tidak Ditemukan', message: 'Item tidak ditemukan.', backUrl: '/procurement/' + draft.id });
        }
        const assets = await db.query('SELECT id, product_name, label_code FROM inventory_assets ORDER BY product_name');
        res.render('procurement/item-form', { title: 'Edit Item', draft, item, assets, errors: null, user: req.session.user });
    } catch (err) {
        console.error('showEditItemForm:', err);
        res.status(500).render('error', { title: 'Error', message: 'Gagal memuat form.' });
    }
};

const updateItem = async (req, res) => {
    try {
        const draft = await loadOwnedDraft(req, res);
        if (!draft) return;
        if (!ensureEditable(draft, res)) return;
        const item = await ProcurementItem.findById(req.params.itemId);
        if (!item || item.procurement_drafts_id !== draft.id) {
            return res.status(404).render('error', { title: 'Tidak Ditemukan', message: 'Item tidak ditemukan.', backUrl: '/procurement/' + draft.id });
        }
        const data = parseItem(req.body);
        const errors = validateItem(data);
        if (errors) {
            const assets = await db.query('SELECT id, product_name, label_code FROM inventory_assets ORDER BY product_name');
            return res.render('procurement/item-form', { title: 'Edit Item', draft, item: { ...req.body, id: item.id }, assets, errors, user: req.session.user });
        }
        await ProcurementItem.update(item.id, data);
        res.redirect('/procurement/' + draft.id + '?success=Item diperbarui');
    } catch (err) {
        console.error('updateItem:', err);
        res.status(500).render('error', { title: 'Error', message: 'Gagal memperbarui item.' });
    }
};

const deleteItem = async (req, res) => {
    try {
        const draft = await loadOwnedDraft(req, res);
        if (!draft) return;
        if (!ensureEditable(draft, res)) return;
        await ProcurementItem.delete(req.params.itemId);
        res.redirect('/procurement/' + draft.id + '?success=Item dihapus');
    } catch (err) {
        console.error('deleteItem:', err);
        res.status(500).render('error', { title: 'Error', message: 'Gagal menghapus item.' });
    }
};

const lockDraft = async (req, res) => {
    try {
        const draft = await loadOwnedDraft(req, res);
        if (!draft) return;
        if (draft.status !== 'draft') {
            return res.redirect('/procurement/' + draft.id);
        }
        await ProcurementDraft.updateStatus(draft.id, 'locked');
        res.redirect('/procurement/' + draft.id + '?success=Draf dikunci dan dikirim ke kaprodi');
    } catch (err) {
        console.error('lockDraft:', err);
        res.status(500).render('error', { title: 'Error', message: 'Gagal mengunci draf.' });
    }
};

const deleteDraft = async (req, res) => {
    try {
        const draft = await loadOwnedDraft(req, res);
        if (!draft) return;
        if (draft.status !== 'draft') {
            return res.status(400).render('error', { title: 'Tidak Bisa Dihapus', message: 'Hanya draf berstatus draft yang bisa dihapus.', backUrl: '/procurement/' + draft.id });
        }
        await ProcurementDraft.delete(draft.id);
        res.redirect('/procurement?success=Draf dihapus');
    } catch (err) {
        console.error('deleteDraft:', err);
        res.status(500).render('error', { title: 'Error', message: 'Gagal menghapus draf.' });
    }
};

module.exports = {
    listDrafts, showCreateForm, createDraft, showDraft,
    showItemForm, createItem, showEditItemForm, updateItem, deleteItem,
    lockDraft, deleteDraft
};
