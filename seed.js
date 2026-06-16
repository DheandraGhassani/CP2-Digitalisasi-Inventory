// Seed: demo data lengkap untuk semua role. Idempotent. Run: node seed.js
const bcrypt = require('bcryptjs');
const db = require('./config/database');

// ── USERS ────────────────────────────────────────────────────────────────────
const USERS = [
    { name: 'Administrator', email: 'admin@lab.test', password: 'password123', role: 'admin' },
    { name: 'Budi Santoso', email: 'kalab@lab.test', password: 'password123', role: 'kalab' },
    { name: 'Dr. Siti Rahayu', email: 'kaprodi@lab.test', password: 'password123', role: 'kaprodi' },
    { name: 'Andi Firmansyah', email: 'stafadmin@lab.test', password: 'password123', role: 'staff_admin' },
    { name: 'Reza Pratama', email: 'staflab@lab.test', password: 'password123', role: 'staff_lab' }
];

// ── ROOMS ─────────────────────────────────────────────────────────────────────
const ROOMS = [
    { room_code: 'LAB-RPL', room_name: 'Lab Rekayasa Perangkat Lunak', capacity: 30 },
    { room_code: 'LAB-JAR', room_name: 'Lab Jaringan Komputer', capacity: 30 },
    { room_code: 'LAB-MM', room_name: 'Lab Multimedia', capacity: 25 }
];

// ── Helpers ───────────────────────────────────────────────────────────────────
async function getOrInsert(table, checkSql, checkParams, insertSql, insertParams, label) {
    const existing = await db.query(checkSql, checkParams);
    if (existing.length) {
        console.log(`  skip (exists): ${label}`);
        return existing[0].id;
    }
    const res = await db.query(insertSql, insertParams);
    console.log(`  created: ${label}`);
    return res.insertId;
}

(async () => {
    try {
        // ── 1. Roles ──────────────────────────────────────────────────────────
        const roles = await db.query('SELECT id, role_name FROM roles');
        const roleId = Object.fromEntries(roles.map(r => [r.role_name, r.id]));

        // ── 2. Users ──────────────────────────────────────────────────────────
        console.log('\n[Users]');
        const uid = {};
        for (const u of USERS) {
            const existing = await db.query('SELECT id FROM users WHERE email = ?', [u.email]);
            if (existing.length) {
                uid[u.role] = existing[0].id;
                console.log(`  skip (exists): ${u.email}`);
            } else {
                const hash = await bcrypt.hash(u.password, 10);
                const res = await db.query(
                    'INSERT INTO users (name, email, password, roles_id, is_active) VALUES (?, ?, ?, ?, 1)',
                    [u.name, u.email, hash, roleId[u.role]]
                );
                uid[u.role] = res.insertId;
                console.log(`  created: ${u.email} / ${u.password}`);
            }
        }

        // ── 3. Rooms ──────────────────────────────────────────────────────────
        console.log('\n[Rooms]');
        const rid = {};
        for (const r of ROOMS) {
            rid[r.room_code] = await getOrInsert(
                'rooms',
                'SELECT id FROM rooms WHERE room_code = ?', [r.room_code],
                'INSERT INTO rooms (room_code, room_name, capacity, created_by, updated_by) VALUES (?, ?, ?, ?, ?)',
                [r.room_code, r.room_name, r.capacity, uid.admin, uid.admin],
                r.room_code
            );
        }

        // ── 4. Procurement Draft 2024 (finalized — alur lengkap) ──────────────
        console.log('\n[Draft 2024 — finalized]');
        const d24id = await getOrInsert(
            'procurement_drafts',
            'SELECT id FROM procurement_drafts WHERE year = 2024 AND users_id = ?', [uid.kalab],
            'INSERT INTO procurement_drafts (year, status, users_id, reviewed_by) VALUES (2024, "finalized", ?, ?)',
            [uid.kalab, uid.kaprodi],
            'Draft 2024'
        );

        // Items draft 2024
        console.log('\n[Items Draft 2024]');
        const i24 = {};

        i24.komputer = await getOrInsert('procurement_items',
            'SELECT id FROM procurement_items WHERE procurement_drafts_id = ? AND product_name = ?',
            [d24id, 'Komputer Desktop Dell OptiPlex'],
            `INSERT INTO procurement_items
                (product_type, product_name, price, quantity, purchase_link, approval_status, procurement_drafts_id)
             VALUES ('inventaris', 'Komputer Desktop Dell OptiPlex', 8500000, 3,
                     'https://dell.com/optiplex', 'approved', ?)`,
            [d24id], 'Komputer Desktop Dell OptiPlex'
        );

        i24.printer = await getOrInsert('procurement_items',
            'SELECT id FROM procurement_items WHERE procurement_drafts_id = ? AND product_name = ?',
            [d24id, 'Printer HP LaserJet Pro'],
            `INSERT INTO procurement_items
                (product_type, product_name, price, quantity, purchase_link, approval_status, procurement_drafts_id)
             VALUES ('inventaris', 'Printer HP LaserJet Pro', 2300000, 1,
                     'https://hp.com/laserjet', 'approved', ?)`,
            [d24id], 'Printer HP LaserJet Pro'
        );

        i24.tinta = await getOrInsert('procurement_items',
            'SELECT id FROM procurement_items WHERE procurement_drafts_id = ? AND product_name = ?',
            [d24id, 'Tinta Printer HP (Cartridge)'],
            `INSERT INTO procurement_items
                (product_type, product_name, price, quantity, purchase_link, approval_status, procurement_drafts_id)
             VALUES ('bhp', 'Tinta Printer HP (Cartridge)', 150000, 10,
                     'https://hp.com/cartridge', 'approved', ?)`,
            [d24id], 'Tinta Printer HP (Cartridge)'
        );

        i24.switch = await getOrInsert('procurement_items',
            'SELECT id FROM procurement_items WHERE procurement_drafts_id = ? AND product_name = ?',
            [d24id, 'Switch Cisco 24-Port'],
            `INSERT INTO procurement_items
                (product_type, product_name, price, quantity, purchase_link, approval_status, procurement_drafts_id)
             VALUES ('inventaris', 'Switch Cisco 24-Port', 1800000, 2,
                     'https://cisco.com/switch', 'rejected', ?)`,
            [d24id], 'Switch Cisco 24-Port (rejected)'
        );

        i24.kertas = await getOrInsert('procurement_items',
            'SELECT id FROM procurement_items WHERE procurement_drafts_id = ? AND product_name = ?',
            [d24id, 'Kertas HVS A4 80gr (Rim)'],
            `INSERT INTO procurement_items
                (product_type, product_name, price, quantity, purchase_link, approval_status, procurement_drafts_id)
             VALUES ('bhp', 'Kertas HVS A4 80gr (Rim)', 55000, 50,
                     'https://shopee.co.id/kertas-hvs', 'approved', ?)`,
            [d24id], 'Kertas HVS A4 80gr (Rim)'
        );

        // ── 5. Receipts untuk item approved draft 2024 ────────────────────────
        console.log('\n[Receipts Draft 2024]');

        // Komputer: 2 tahap (2 + 1)
        await getOrInsert('receipt',
            'SELECT id FROM receipt WHERE procurement_items_id = ? AND receipt_date = ?',
            [i24.komputer, '2024-12-10'],
            'INSERT INTO receipt (receipt_date, total_received, description, procurement_items_id, users_id) VALUES (?, 2, "Pengiriman pertama", ?, ?)',
            ['2024-12-10', i24.komputer, uid.staff_admin], 'Receipt Komputer batch-1'
        );
        await getOrInsert('receipt',
            'SELECT id FROM receipt WHERE procurement_items_id = ? AND receipt_date = ?',
            [i24.komputer, '2024-12-20'],
            'INSERT INTO receipt (receipt_date, total_received, description, procurement_items_id, users_id) VALUES (?, 1, "Pengiriman kedua", ?, ?)',
            ['2024-12-20', i24.komputer, uid.staff_admin], 'Receipt Komputer batch-2'
        );

        // Printer: 1 tahap
        await getOrInsert('receipt',
            'SELECT id FROM receipt WHERE procurement_items_id = ? AND receipt_date = ?',
            [i24.printer, '2024-12-10'],
            'INSERT INTO receipt (receipt_date, total_received, description, procurement_items_id, users_id) VALUES (?, 1, "Diterima lengkap", ?, ?)',
            ['2024-12-10', i24.printer, uid.staff_admin], 'Receipt Printer'
        );

        // Tinta: 1 tahap (semua)
        await getOrInsert('receipt',
            'SELECT id FROM receipt WHERE procurement_items_id = ? AND receipt_date = ?',
            [i24.tinta, '2024-12-15'],
            'INSERT INTO receipt (receipt_date, total_received, description, procurement_items_id, users_id) VALUES (?, 10, "10 cartridge diterima", ?, ?)',
            ['2024-12-15', i24.tinta, uid.staff_admin], 'Receipt Tinta'
        );

        // Kertas: parsial (30 dari 50)
        await getOrInsert('receipt',
            'SELECT id FROM receipt WHERE procurement_items_id = ? AND receipt_date = ?',
            [i24.kertas, '2024-12-15'],
            'INSERT INTO receipt (receipt_date, total_received, description, procurement_items_id, users_id) VALUES (?, 30, "30 rim diterima, sisa 20 menyusul", ?, ?)',
            ['2024-12-15', i24.kertas, uid.staff_admin], 'Receipt Kertas (parsial)'
        );

        // ── 6. Inventory Assets ───────────────────────────────────────────────
        console.log('\n[Inventory Assets]');
        const aid = {};

        aid.komp1 = await getOrInsert('inventory_assets',
            'SELECT id FROM inventory_assets WHERE label_code = ?', ['INV-2024-001'],
            `INSERT INTO inventory_assets
                (product_name, label_code, \`condition\`, date_acquired, price, procurement_items_id, rooms_id)
             VALUES ('Komputer Desktop Dell OptiPlex', 'INV-2024-001', 'good', '2024-12-10', 8500000, ?, ?)`,
            [i24.komputer, rid['LAB-RPL']], 'INV-2024-001'
        );

        aid.komp2 = await getOrInsert('inventory_assets',
            'SELECT id FROM inventory_assets WHERE label_code = ?', ['INV-2024-002'],
            `INSERT INTO inventory_assets
                (product_name, label_code, \`condition\`, date_acquired, price, procurement_items_id, rooms_id)
             VALUES ('Komputer Desktop Dell OptiPlex', 'INV-2024-002', 'minor_damage', '2024-12-10', 8500000, ?, ?)`,
            [i24.komputer, rid['LAB-RPL']], 'INV-2024-002 (minor_damage)'
        );

        aid.komp3 = await getOrInsert('inventory_assets',
            'SELECT id FROM inventory_assets WHERE label_code = ?', ['INV-2024-003'],
            `INSERT INTO inventory_assets
                (product_name, label_code, \`condition\`, date_acquired, price, procurement_items_id, rooms_id)
             VALUES ('Komputer Desktop Dell OptiPlex', 'INV-2024-003', 'good', '2024-12-20', 8500000, ?, ?)`,
            [i24.komputer, rid['LAB-MM']], 'INV-2024-003'
        );

        aid.printer = await getOrInsert('inventory_assets',
            'SELECT id FROM inventory_assets WHERE label_code = ?', ['INV-2024-004'],
            `INSERT INTO inventory_assets
                (product_name, label_code, \`condition\`, date_acquired, price, procurement_items_id, rooms_id)
             VALUES ('Printer HP LaserJet Pro', 'INV-2024-004', 'good', '2024-12-10', 2300000, ?, ?)`,
            [i24.printer, rid['LAB-RPL']], 'INV-2024-004'
        );

        // ── 7. Procurement Draft 2025 (locked — menunggu review kaprodi) ───────
        console.log('\n[Draft 2025 — locked]');
        const d25id = await getOrInsert(
            'procurement_drafts',
            'SELECT id FROM procurement_drafts WHERE year = 2025 AND users_id = ?', [uid.kalab],
            'INSERT INTO procurement_drafts (year, status, users_id) VALUES (2025, "locked", ?)',
            [uid.kalab], 'Draft 2025'
        );

        console.log('\n[Items Draft 2025]');
        await getOrInsert('procurement_items',
            'SELECT id FROM procurement_items WHERE procurement_drafts_id = ? AND product_name = ?',
            [d25id, 'Laptop Asus VivoBook 14'],
            `INSERT INTO procurement_items
                (product_type, product_name, price, quantity, purchase_link, approval_status, replaces_asset_id, procurement_drafts_id)
             VALUES ('inventaris', 'Laptop Asus VivoBook 14', 9500000, 5,
                     'https://asus.com/vivobook', 'pending', ?, ?)`,
            [aid.komp2, d25id], 'Laptop Asus VivoBook 14 (mengganti INV-2024-002)'
        );

        await getOrInsert('procurement_items',
            'SELECT id FROM procurement_items WHERE procurement_drafts_id = ? AND product_name = ?',
            [d25id, 'Proyektor Epson EB-X51'],
            `INSERT INTO procurement_items
                (product_type, product_name, price, quantity, purchase_link, approval_status, procurement_drafts_id)
             VALUES ('inventaris', 'Proyektor Epson EB-X51', 4200000, 2,
                     'https://epson.com/eb-x51', 'pending', ?)`,
            [d25id], 'Proyektor Epson EB-X51'
        );

        await getOrInsert('procurement_items',
            'SELECT id FROM procurement_items WHERE procurement_drafts_id = ? AND product_name = ?',
            [d25id, 'Alkohol Isopropil 70% 1L'],
            `INSERT INTO procurement_items
                (product_type, product_name, price, quantity, purchase_link, approval_status, procurement_drafts_id)
             VALUES ('bhp', 'Alkohol Isopropil 70% 1L', 45000, 20,
                     'https://tokopedia.com/alkohol70', 'pending', ?)`,
            [d25id], 'Alkohol Isopropil 70%'
        );

        // ── 8. Draft 2026 (draft — kalab masih bisa edit) ────────────────────
        console.log('\n[Draft 2026 — draft]');
        const d26id = await getOrInsert(
            'procurement_drafts',
            'SELECT id FROM procurement_drafts WHERE year = 2026 AND users_id = ?', [uid.kalab],
            'INSERT INTO procurement_drafts (year, status, users_id) VALUES (2026, "draft", ?)',
            [uid.kalab], 'Draft 2026'
        );

        console.log('\n[Items Draft 2026]');
        await getOrInsert('procurement_items',
            'SELECT id FROM procurement_items WHERE procurement_drafts_id = ? AND product_name = ?',
            [d26id, 'UPS APC 1500VA'],
            `INSERT INTO procurement_items
                (product_type, product_name, price, quantity, purchase_link, approval_status, procurement_drafts_id)
             VALUES ('inventaris', 'UPS APC 1500VA', 3200000, 4,
                     'https://apc.com/ups1500', 'pending', ?)`,
            [d26id], 'UPS APC 1500VA'
        );

        await getOrInsert('procurement_items',
            'SELECT id FROM procurement_items WHERE procurement_drafts_id = ? AND product_name = ?',
            [d26id, 'Cairan Pembersih LCD'],
            `INSERT INTO procurement_items
                (product_type, product_name, price, quantity, purchase_link, approval_status, procurement_drafts_id)
             VALUES ('bhp', 'Cairan Pembersih LCD', 35000, 12,
                     'https://shopee.co.id/lcd-cleaner', 'pending', ?)`,
            [d26id], 'Cairan Pembersih LCD'
        );

        // ── 9. BHP Stocks ─────────────────────────────────────────────────────
        console.log('\n[BHP Stocks]');
        const bhpId = {};

        bhpId.tinta = await getOrInsert('bhp_stocks',
            'SELECT id FROM bhp_stocks WHERE product_name = ? AND rooms_id = ?',
            ['Tinta Printer HP (Cartridge)', rid['LAB-RPL']],
            'INSERT INTO bhp_stocks (product_name, unit, current_stock, minimum_stock, unit_price, rooms_id) VALUES (?, "cartridge", 8, 3, 150000, ?)',
            ['Tinta Printer HP (Cartridge)', rid['LAB-RPL']], 'Tinta Printer HP'
        );

        bhpId.kertas = await getOrInsert('bhp_stocks',
            'SELECT id FROM bhp_stocks WHERE product_name = ? AND rooms_id = ?',
            ['Kertas HVS A4 80gr', rid['LAB-RPL']],
            'INSERT INTO bhp_stocks (product_name, unit, current_stock, minimum_stock, unit_price, rooms_id) VALUES (?, "rim", 25, 10, 55000, ?)',
            ['Kertas HVS A4 80gr', rid['LAB-RPL']], 'Kertas HVS A4'
        );

        bhpId.alkohol = await getOrInsert('bhp_stocks',
            'SELECT id FROM bhp_stocks WHERE product_name = ? AND rooms_id = ?',
            ['Alkohol Isopropil 70%', rid['LAB-JAR']],
            'INSERT INTO bhp_stocks (product_name, unit, current_stock, minimum_stock, unit_price, rooms_id) VALUES (?, "botol", 2, 5, 45000, ?)',
            ['Alkohol Isopropil 70%', rid['LAB-JAR']], 'Alkohol 70% (stok rendah)'
        );

        bhpId.lap = await getOrInsert('bhp_stocks',
            'SELECT id FROM bhp_stocks WHERE product_name = ? AND rooms_id = ?',
            ['Lap Microfiber', rid['LAB-MM']],
            'INSERT INTO bhp_stocks (product_name, unit, current_stock, minimum_stock, unit_price, rooms_id) VALUES (?, "lembar", 12, 5, 25000, ?)',
            ['Lap Microfiber', rid['LAB-MM']], 'Lap Microfiber'
        );

        bhpId.cairan = await getOrInsert('bhp_stocks',
            'SELECT id FROM bhp_stocks WHERE product_name = ? AND rooms_id = ?',
            ['Cairan Pembersih LCD', rid['LAB-MM']],
            'INSERT INTO bhp_stocks (product_name, unit, current_stock, minimum_stock, unit_price, rooms_id) VALUES (?, "botol", 0, 3, 35000, ?)',
            ['Cairan Pembersih LCD', rid['LAB-MM']], 'Cairan Pembersih LCD (habis)'
        );

        // ── 10. BHP Stock Log — masuk (stok awal) ────────────────────────────
        console.log('\n[BHP Stock Log — masuk]');
        const stockInData = [
            { bhp: bhpId.tinta, total: 10, desc: 'Stok awal dari penerimaan pengadaan 2024', date: '2024-12-16' },
            { bhp: bhpId.kertas, total: 30, desc: 'Stok awal dari penerimaan pengadaan 2024', date: '2024-12-16' },
            { bhp: bhpId.alkohol, total: 5, desc: 'Stok awal laboratorium', date: '2025-01-02' },
            { bhp: bhpId.lap, total: 15, desc: 'Stok awal laboratorium', date: '2025-01-02' },
            { bhp: bhpId.cairan, total: 3, desc: 'Stok awal laboratorium', date: '2025-01-02' },
        ];
        for (const s of stockInData) {
            const ex = await db.query(
                'SELECT id FROM bhp_stock_log WHERE bhp_stocks_id = ? AND status = "in" AND description = ?',
                [s.bhp, s.desc]
            );
            if (!ex.length) {
                await db.query(
                    'INSERT INTO bhp_stock_log (status, total, description, users_id, bhp_stocks_id) VALUES ("in", ?, ?, ?, ?)',
                    [s.total, s.desc, uid.staff_lab, s.bhp]
                );
                console.log(`  created: stock-in bhp_id=${s.bhp}`);
            } else {
                console.log(`  skip (exists): stock-in bhp_id=${s.bhp}`);
            }
        }

        // ── 11. Maintenance Logs ──────────────────────────────────────────────
        console.log('\n[Maintenance Logs]');

        const maintenanceData = [
            {
                date: '2025-01-15',
                asset_id: aid.komp2,
                desc: 'Pembersihan komponen internal, cek suhu prosesor. Ditemukan kerusakan pada kipas pendingin.',
                cond_before: 'good',
                cond_after: 'minor_damage',
                bhp: [
                    { id: bhpId.lap, qty: 2, desc_out: 'Pembersihan casing dan layar' },
                    { id: bhpId.alkohol, qty: 1, desc_out: 'Pembersih komponen elektronik' },
                ]
            },
            {
                date: '2025-03-10',
                asset_id: aid.printer,
                desc: 'Perawatan rutin: bersihkan drum dan roller, isi tinta, uji cetak.',
                cond_before: 'good',
                cond_after: 'good',
                bhp: [
                    { id: bhpId.tinta, qty: 2, desc_out: 'Penggantian cartridge tinta' },
                    { id: bhpId.kertas, qty: 5, desc_out: 'Kertas uji cetak maintenance' },
                ]
            },
            {
                date: '2025-05-20',
                asset_id: aid.komp1,
                desc: 'Perawatan preventif: bersihkan debu internal, periksa koneksi kabel, update driver.',
                cond_before: 'good',
                cond_after: 'good',
                bhp: [
                    { id: bhpId.lap, qty: 1, desc_out: 'Pembersihan layar dan keyboard' },
                    { id: bhpId.alkohol, qty: 2, desc_out: 'Disinfeksi komponen' },
                    { id: bhpId.cairan, qty: 3, desc_out: 'Pembersihan layar monitor' },
                ]
            }
        ];

        for (const m of maintenanceData) {
            const ex = await db.query(
                'SELECT id FROM maintenance_logs WHERE inventory_assets_id = ? AND maintenance_date = ?',
                [m.asset_id, m.date]
            );
            if (ex.length) {
                console.log(`  skip (exists): maintenance ${m.date} asset_id=${m.asset_id}`);
                continue;
            }

            // Insert log
            const logRes = await db.query(
                `INSERT INTO maintenance_logs
                    (maintenance_date, description, condition_before, condition_after, inventory_assets_id, users_id)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [m.date, m.desc, m.cond_before, m.cond_after, m.asset_id, uid.staff_lab]
            );
            const logId = logRes.insertId;

            // Update asset condition
            await db.query('UPDATE inventory_assets SET `condition` = ? WHERE id = ?', [m.cond_after, m.asset_id]);

            // BHP usage
            for (const u of m.bhp) {
                await db.query(
                    'INSERT INTO maintenance_bhp_usage (total_used, maintenance_logs_id, bhp_stocks_id) VALUES (?, ?, ?)',
                    [u.qty, logId, u.id]
                );
                await db.query(
                    'UPDATE bhp_stocks SET current_stock = current_stock - ? WHERE id = ?',
                    [u.qty, u.id]
                );
                await db.query(
                    'INSERT INTO bhp_stock_log (status, total, description, users_id, bhp_stocks_id, maintenance_logs_id) VALUES ("out", ?, ?, ?, ?, ?)',
                    [u.qty, u.desc_out, uid.staff_lab, u.id, logId]
                );
            }
            console.log(`  created: maintenance ${m.date} asset_id=${m.asset_id} (${m.bhp.length} BHP dipakai)`);
        }

        // ── Ringkasan ─────────────────────────────────────────────────────────
        console.log(`  Seed selesai.  `);

    } catch (e) {
        console.error('\nSeed gagal:', e.message);
        console.error(e.stack);
        process.exitCode = 1;
    } finally {
        await db.pool.end();
    }
})();
