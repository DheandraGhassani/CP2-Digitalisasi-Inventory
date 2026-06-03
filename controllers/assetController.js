const ProcurementItem = require('../models/ProcurementItem');
const Receipt = require('../models/Receipt');
const InventoryAsset = require('../models/InventoryAsset');
const Room = require('../models/Room');

const CONDITIONS = ['good', 'minor_damage', 'major_damage', 'removed', 'replaced'];

// Load an item that is approved + from a finalized draft. Else error response, returns null.
async function loadReceivableItem(req, res) {
    const item = await ProcurementItem.findWithContext(req.params.id);
    if (!item) {
        res.status(404).render('error', { title: 'Tidak Ditemukan', message: 'Item tidak ditemukan.', backUrl: '/assets' });
        return null;
    }
    if (item.draft_status !== 'finalized' || item.approval_status !== 'approved') {
        res.status(400).render('error', { title: 'Belum Siap', message: 'Item ini belum disetujui/difinalisasi.', backUrl: '/assets' });
        return null;
    }
    return item;
}

// Receiving queue: approved items from finalized drafts
const listQueue = async (req, res) => {
    try {
        const items = await ProcurementItem.getApprovedForReceiving();
        res.render('assets/list', {
            title: 'Penerimaan Barang',
            items,
            success: req.query.success || null,
            user: req.session.user
        });
    } catch (err) {
        console.error('listQueue:', err);
        res.status(500).render('error', { title: 'Error', message: 'Gagal memuat antrian.' });
    }
};

// All registered inventory assets
const listAssets = async (req, res) => {
    try {
        const assets = await InventoryAsset.getAll();
        res.render('assets/inventory', {
            title: 'Daftar Inventaris',
            assets,
            success: req.query.success || null,
            user: req.session.user
        });
    } catch (err) {
        console.error('listAssets:', err);
        res.status(500).render('error', { title: 'Error', message: 'Gagal memuat inventaris.' });
    }
};

const showItem = async (req, res) => {
    try {
        const item = await loadReceivableItem(req, res);
        if (!item) return;
        const receipts = await Receipt.getByItem(item.id);
        const assets = await InventoryAsset.getByItem(item.id);
        const received = await Receipt.sumReceived(item.id);
        const rooms = await Room.getAll();
        res.render('assets/item', {
            title: `Proses: ${item.product_name}`,
            item,
            receipts,
            assets,
            received,
            remaining: item.quantity - received,
            rooms,
            conditions: CONDITIONS,
            errors: null,
            success: req.query.success || null,
            user: req.session.user
        });
    } catch (err) {
        console.error('showItem:', err);
        res.status(500).render('error', { title: 'Error', message: 'Gagal memuat item.' });
    }
};

const addReceipt = async (req, res) => {
    try {
        const item = await loadReceivableItem(req, res);
        if (!item) return;
        const receipt_date = req.body.receipt_date;
        const total_received = parseInt(req.body.total_received, 10);
        const received = await Receipt.sumReceived(item.id);

        if (!receipt_date || isNaN(total_received) || total_received < 1) {
            return res.redirect('/assets/items/' + item.id + '?success=' + encodeURIComponent('Gagal: tanggal & jumlah wajib.'));
        }
        if (received + total_received > item.quantity) {
            return res.redirect('/assets/items/' + item.id + '?success=' + encodeURIComponent(`Gagal: total terima melebihi qty (${item.quantity}).`));
        }
        await Receipt.create({
            receipt_date,
            total_received,
            description: req.body.description,
            procurement_items_id: item.id,
            users_id: req.session.user.id
        });
        res.redirect('/assets/items/' + item.id + '?success=Penerimaan dicatat');
    } catch (err) {
        console.error('addReceipt:', err);
        res.status(500).render('error', { title: 'Error', message: 'Gagal mencatat penerimaan.' });
    }
};

const addAsset = async (req, res) => {
    try {
        const item = await loadReceivableItem(req, res);
        if (!item) return;
        if (item.product_type !== 'inventaris') {
            return res.status(400).render('error', { title: 'Bukan Inventaris', message: 'Hanya item inventaris yang menjadi aset.', backUrl: '/assets/items/' + item.id });
        }

        const received = await Receipt.sumReceived(item.id);
        const assetCount = await InventoryAsset.countByItem(item.id);
        const label_code = (req.body.label_code || '').trim();
        const rooms_id = parseInt(req.body.rooms_id, 10);

        // Validation
        let errMsg = null;
        if (assetCount >= received) errMsg = 'Terima barang dulu sebelum membuat aset (aset tidak boleh melebihi jumlah diterima).';
        else if (!label_code) errMsg = 'Kode label wajib diisi.';
        else if (await InventoryAsset.labelExists(label_code)) errMsg = 'Kode label sudah dipakai.';
        else if (!rooms_id) errMsg = 'Ruangan wajib dipilih.';

        if (errMsg) {
            return res.redirect('/assets/items/' + item.id + '?success=' + encodeURIComponent('Gagal: ' + errMsg));
        }

        const condition = CONDITIONS.includes(req.body.condition) ? req.body.condition : 'good';
        const qr_code_path = req.file ? '/uploads/' + req.file.filename : null;

        await InventoryAsset.create({
            product_name: item.product_name,
            label_code,
            qr_code_path,
            condition,
            date_acquired: req.body.date_acquired || null,
            price: item.price,
            procurement_items_id: item.id,
            rooms_id
        });
        res.redirect('/assets/items/' + item.id + '?success=Aset inventaris dibuat');
    } catch (err) {
        console.error('addAsset:', err);
        res.status(500).render('error', { title: 'Error', message: 'Gagal membuat aset.' });
    }
};

module.exports = { listQueue, listAssets, showItem, addReceipt, addAsset };
