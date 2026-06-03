const ProcurementDraft = require('../models/ProcurementDraft');
const ProcurementItem = require('../models/ProcurementItem');

// Load a submitted draft (any owner — kaprodi reviews all). Returns null + error response if missing.
async function loadDraft(req, res) {
    const draft = await ProcurementDraft.findById(req.params.id);
    if (!draft) {
        res.status(404).render('error', { title: 'Tidak Ditemukan', message: 'Draf tidak ditemukan.', backUrl: '/review' });
        return null;
    }
    if (draft.status === 'draft') {
        res.status(400).render('error', { title: 'Belum Dikunci', message: 'Draf ini belum dikunci oleh kepala lab.', backUrl: '/review' });
        return null;
    }
    return draft;
}

// Decisions allowed while draft is locked or reviewed (not finalized)
function ensureReviewable(draft, res) {
    if (draft.status === 'finalized') {
        res.status(400).render('error', {
            title: 'Sudah Final',
            message: 'Draf sudah difinalisasi dan tidak dapat diubah.',
            backUrl: '/review/' + draft.id
        });
        return false;
    }
    return true;
}

const listReview = async (req, res) => {
    try {
        const drafts = await ProcurementDraft.getForReview();
        res.render('review/list', {
            title: 'Review Pengadaan',
            drafts,
            success: req.query.success || null,
            user: req.session.user
        });
    } catch (err) {
        console.error('listReview:', err);
        res.status(500).render('error', { title: 'Error', message: 'Gagal memuat daftar review.' });
    }
};

const showReview = async (req, res) => {
    try {
        const draft = await loadDraft(req, res);
        if (!draft) return;
        const items = await ProcurementItem.getByDraft(draft.id);
        res.render('review/detail', {
            title: `Review Pengadaan ${draft.year}`,
            draft,
            items,
            reviewable: draft.status !== 'finalized',
            pendingCount: items.filter(i => i.approval_status === 'pending').length,
            success: req.query.success || null,
            user: req.session.user
        });
    } catch (err) {
        console.error('showReview:', err);
        res.status(500).render('error', { title: 'Error', message: 'Gagal memuat draf.' });
    }
};

const decideItem = async (req, res) => {
    try {
        const draft = await loadDraft(req, res);
        if (!draft) return;
        if (!ensureReviewable(draft, res)) return;

        const decision = req.body.decision;
        if (!['approved', 'rejected', 'pending'].includes(decision)) {
            return res.status(400).render('error', { title: 'Input Salah', message: 'Keputusan tidak valid.', backUrl: '/review/' + draft.id });
        }
        const item = await ProcurementItem.findById(req.params.itemId);
        if (!item || item.procurement_drafts_id !== draft.id) {
            return res.status(404).render('error', { title: 'Tidak Ditemukan', message: 'Item tidak ditemukan.', backUrl: '/review/' + draft.id });
        }
        await ProcurementItem.updateApproval(item.id, decision);
        // First decision moves the draft from 'locked' to 'reviewed'
        if (draft.status === 'locked') {
            await ProcurementDraft.updateStatus(draft.id, 'reviewed');
        }
        res.redirect('/review/' + draft.id + '?success=Keputusan disimpan');
    } catch (err) {
        console.error('decideItem:', err);
        res.status(500).render('error', { title: 'Error', message: 'Gagal menyimpan keputusan.' });
    }
};

const finalize = async (req, res) => {
    try {
        const draft = await loadDraft(req, res);
        if (!draft) return;
        if (!ensureReviewable(draft, res)) return;

        const items = await ProcurementItem.getByDraft(draft.id);
        const pending = items.filter(i => i.approval_status === 'pending').length;
        if (pending > 0) {
            return res.status(400).render('error', {
                title: 'Masih Ada Pending',
                message: `Masih ada ${pending} item yang belum diputuskan (approve/reject). Putuskan semua dulu.`,
                backUrl: '/review/' + draft.id
            });
        }
        await ProcurementDraft.updateStatus(draft.id, 'finalized', req.session.user.id);
        res.redirect('/review/' + draft.id + '?success=Draf difinalisasi');
    } catch (err) {
        console.error('finalize:', err);
        res.status(500).render('error', { title: 'Error', message: 'Gagal finalisasi.' });
    }
};

module.exports = { listReview, showReview, decideItem, finalize };
