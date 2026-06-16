const BhpStock = require('../models/BhpStock');
const Room = require('../models/Room');

const list = async (req, res) => {
    try {
        const stocks = await BhpStock.getAll();
        res.render('bhp/list', {
            title: 'Stok BHP',
            stocks,
            success: req.query.success || null,
            user: req.session.user
        });
    } catch (err) {
        console.error('bhp list:', err);
        res.status(500).render('error', { title: 'Error', message: 'Gagal memuat stok BHP.' });
    }
};

const showNew = async (req, res) => {
    try {
        const rooms = await Room.getAll();
        res.render('bhp/form', { title: 'Tambah BHP', stock: null, rooms, errors: null });
    } catch (err) {
        res.status(500).render('error', { title: 'Error', message: 'Gagal memuat form.' });
    }
};

const create = async (req, res) => {
    let rooms;
    try {
        rooms = await Room.getAll();
        const { product_name, unit, current_stock, minimum_stock, unit_price, rooms_id } = req.body;
        const errors = {};
        if (!product_name) errors.product_name = 'Wajib diisi';
        if (!unit) errors.unit = 'Wajib diisi';
        if (!rooms_id) errors.rooms_id = 'Wajib dipilih';
        if (Object.keys(errors).length) {
            return res.render('bhp/form', { title: 'Tambah BHP', stock: req.body, rooms, errors });
        }
        const id = await BhpStock.create({
            product_name, unit,
            current_stock: parseInt(current_stock, 10) || 0,
            minimum_stock: parseInt(minimum_stock, 10) || 0,
            unit_price: unit_price || null,
            rooms_id
        });
        res.redirect('/bhp/' + id + '?success=' + encodeURIComponent('BHP berhasil ditambahkan'));
    } catch (err) {
        console.error('bhp create:', err);
        res.render('bhp/form', {
            title: 'Tambah BHP', stock: req.body, rooms: rooms || [],
            errors: { general: 'Gagal menyimpan: ' + err.message }
        });
    }
};

const showDetail = async (req, res) => {
    try {
        const stock = await BhpStock.findById(req.params.id);
        if (!stock) {
            return res.status(404).render('error', { title: 'Tidak Ditemukan', message: 'BHP tidak ditemukan.', backUrl: '/bhp' });
        }
        const logs = await BhpStock.getLog(stock.id);
        res.render('bhp/detail', {
            title: stock.product_name,
            stock,
            logs,
            success: req.query.success || null,
            user: req.session.user
        });
    } catch (err) {
        console.error('bhp detail:', err);
        res.status(500).render('error', { title: 'Error', message: 'Gagal memuat detail BHP.' });
    }
};

const showEdit = async (req, res) => {
    try {
        const stock = await BhpStock.findById(req.params.id);
        if (!stock) {
            return res.status(404).render('error', { title: 'Tidak Ditemukan', message: 'BHP tidak ditemukan.', backUrl: '/bhp' });
        }
        const rooms = await Room.getAll();
        res.render('bhp/form', { title: 'Edit BHP', stock, rooms, errors: null });
    } catch (err) {
        res.status(500).render('error', { title: 'Error', message: 'Gagal memuat form edit.' });
    }
};

const update = async (req, res) => {
    let rooms;
    try {
        const stock = await BhpStock.findById(req.params.id);
        if (!stock) {
            return res.status(404).render('error', { title: 'Tidak Ditemukan', message: 'BHP tidak ditemukan.', backUrl: '/bhp' });
        }
        rooms = await Room.getAll();
        const { product_name, unit, minimum_stock, unit_price, rooms_id } = req.body;
        const errors = {};
        if (!product_name) errors.product_name = 'Wajib diisi';
        if (!unit) errors.unit = 'Wajib diisi';
        if (!rooms_id) errors.rooms_id = 'Wajib dipilih';
        if (Object.keys(errors).length) {
            return res.render('bhp/form', { title: 'Edit BHP', stock: { ...stock, ...req.body }, rooms, errors });
        }
        await BhpStock.update(req.params.id, {
            product_name, unit,
            minimum_stock: parseInt(minimum_stock, 10) || 0,
            unit_price: unit_price || null,
            rooms_id
        });
        res.redirect('/bhp/' + req.params.id + '?success=' + encodeURIComponent('BHP berhasil diperbarui'));
    } catch (err) {
        console.error('bhp update:', err);
        res.status(500).render('error', { title: 'Error', message: 'Gagal memperbarui BHP.' });
    }
};

const remove = async (req, res) => {
    try {
        await BhpStock.delete(req.params.id);
        res.redirect('/bhp?success=' + encodeURIComponent('BHP berhasil dihapus'));
    } catch (err) {
        console.error('bhp delete:', err);
        res.redirect('/bhp?success=' + encodeURIComponent('Gagal menghapus: ' + err.message));
    }
};

const addStockIn = async (req, res) => {
    try {
        const stock = await BhpStock.findById(req.params.id);
        if (!stock) {
            return res.status(404).render('error', { title: 'Tidak Ditemukan', message: 'BHP tidak ditemukan.', backUrl: '/bhp' });
        }
        const qty = parseInt(req.body.qty, 10);
        if (!qty || qty < 1) {
            return res.redirect('/bhp/' + req.params.id + '?success=' + encodeURIComponent('Gagal: jumlah tidak valid'));
        }
        await BhpStock.addStockIn(req.params.id, qty, req.session.user.id, req.body.description || 'Stok masuk');
        res.redirect('/bhp/' + req.params.id + '?success=' + encodeURIComponent('Stok berhasil ditambahkan'));
    } catch (err) {
        console.error('bhp addStockIn:', err);
        res.redirect('/bhp/' + req.params.id + '?success=' + encodeURIComponent('Gagal: ' + err.message));
    }
};

module.exports = { list, showNew, create, showDetail, showEdit, update, remove, addStockIn };
