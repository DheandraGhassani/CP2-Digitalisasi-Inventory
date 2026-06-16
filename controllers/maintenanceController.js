const MaintenanceLog = require('../models/MaintenanceLog');
const InventoryAsset = require('../models/InventoryAsset');
const BhpStock = require('../models/BhpStock');

const CONDITIONS = ['good', 'minor_damage', 'major_damage', 'removed', 'replaced'];

const list = async (req, res) => {
    try {
        const logs = await MaintenanceLog.getAll();
        res.render('maintenance/list', {
            title: 'Log Maintenance',
            logs,
            success: req.query.success || null,
            user: req.session.user
        });
    } catch (err) {
        console.error('maintenance list:', err);
        res.status(500).render('error', { title: 'Error', message: 'Gagal memuat log maintenance.' });
    }
};

const showNew = async (req, res) => {
    try {
        const assets = await InventoryAsset.getAll();
        const bhpStocks = await BhpStock.getAll();
        res.render('maintenance/form', {
            title: 'Tambah Log Maintenance',
            assets,
            bhpStocks,
            conditions: CONDITIONS,
            errors: null,
            formData: null,
            user: req.session.user
        });
    } catch (err) {
        console.error('maintenance showNew:', err);
        res.status(500).render('error', { title: 'Error', message: 'Gagal memuat form.' });
    }
};

const create = async (req, res) => {
    let assets, bhpStocks;
    try {
        const { maintenance_date, description, condition_before, condition_after, inventory_assets_id } = req.body;

        const errors = {};
        if (!maintenance_date) errors.maintenance_date = 'Tanggal wajib diisi';
        if (!description) errors.description = 'Deskripsi wajib diisi';
        if (!condition_before || !CONDITIONS.includes(condition_before)) errors.condition_before = 'Kondisi awal wajib dipilih';
        if (!condition_after || !CONDITIONS.includes(condition_after)) errors.condition_after = 'Kondisi akhir wajib dipilih';
        if (!inventory_assets_id) errors.inventory_assets_id = 'Aset wajib dipilih';

        if (Object.keys(errors).length) {
            assets = await InventoryAsset.getAll();
            bhpStocks = await BhpStock.getAll();
            return res.render('maintenance/form', {
                title: 'Tambah Log Maintenance', assets, bhpStocks, conditions: CONDITIONS,
                errors, formData: req.body, user: req.session.user
            });
        }

        const bhpIds = [].concat(req.body.bhp_stocks_id || []);
        const bhpQtys = [].concat(req.body.bhp_qty || []);
        const bhpUsages = bhpIds
            .map((id, i) => ({ bhp_stocks_id: parseInt(id, 10), total_used: parseInt(bhpQtys[i], 10) }))
            .filter(u => u.bhp_stocks_id && u.total_used > 0);

        const logId = await MaintenanceLog.create(
            {
                maintenance_date, description, condition_before, condition_after,
                inventory_assets_id: parseInt(inventory_assets_id, 10)
            },
            bhpUsages,
            req.session.user.id
        );
        res.redirect('/maintenance/' + logId + '?success=' + encodeURIComponent('Log maintenance berhasil dibuat'));
    } catch (err) {
        console.error('maintenance create:', err);
        try {
            assets = await InventoryAsset.getAll();
            bhpStocks = await BhpStock.getAll();
        } catch (_) {
            assets = []; bhpStocks = [];
        }
        res.render('maintenance/form', {
            title: 'Tambah Log Maintenance', assets, bhpStocks, conditions: CONDITIONS,
            errors: { general: err.message || 'Gagal menyimpan.' },
            formData: req.body, user: req.session.user
        });
    }
};

const showDetail = async (req, res) => {
    try {
        const log = await MaintenanceLog.findById(req.params.id);
        if (!log) {
            return res.status(404).render('error', { title: 'Tidak Ditemukan', message: 'Log tidak ditemukan.', backUrl: '/maintenance' });
        }
        const bhpUsages = await MaintenanceLog.getBhpUsage(log.id);
        res.render('maintenance/detail', {
            title: `Maintenance: ${log.asset_name}`,
            log,
            bhpUsages,
            success: req.query.success || null,
            user: req.session.user
        });
    } catch (err) {
        console.error('maintenance detail:', err);
        res.status(500).render('error', { title: 'Error', message: 'Gagal memuat detail.' });
    }
};

module.exports = { list, showNew, create, showDetail };
