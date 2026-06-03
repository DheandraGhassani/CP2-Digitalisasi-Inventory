// Seed: one user per role + sample rooms. Idempotent. Run: node seed.js
const bcrypt = require('bcryptjs');
const db = require('./config/database');

const USERS = [
    { name: 'Administrator', email: 'admin@lab.test', password: 'admin123', role: 'admin' },
    { name: 'Kepala Laboratorium', email: 'kalab@lab.test', password: 'kalab123', role: 'kalab' },
    { name: 'Ketua Program Studi', email: 'kaprodi@lab.test', password: 'kaprodi123', role: 'kaprodi' },
    { name: 'Staf Administrasi', email: 'stafadmin@lab.test', password: 'staf123', role: 'staff_admin' },
    { name: 'Staf Laboratorium', email: 'staflab@lab.test', password: 'staf123', role: 'staff_lab' }
];

const ROOMS = [
    { room_code: 'LAB-RPL', room_name: 'Lab Rekayasa Perangkat Lunak', capacity: 30 },
    { room_code: 'LAB-JAR', room_name: 'Lab Jaringan', capacity: 30 },
    { room_code: 'LAB-MM', room_name: 'Lab Multimedia', capacity: 25 }
];

(async () => {
    try {
        // Map role_name -> id
        const roles = await db.query('SELECT id, role_name FROM roles');
        const roleId = Object.fromEntries(roles.map(r => [r.role_name, r.id]));

        let adminId = null;
        for (const u of USERS) {
            const existing = await db.query('SELECT id FROM users WHERE email = ?', [u.email]);
            let id;
            if (existing.length) {
                id = existing[0].id;
                console.log(`user exists: ${u.email} (id ${id})`);
            } else {
                const hash = await bcrypt.hash(u.password, 10);
                const res = await db.query(
                    'INSERT INTO users (name, email, password, roles_id, is_active) VALUES (?, ?, ?, ?, 1)',
                    [u.name, u.email, hash, roleId[u.role]]
                );
                id = res.insertId;
                console.log(`created user: ${u.email} / ${u.password} (${u.role})`);
            }
            if (u.role === 'admin') adminId = id;
        }

        for (const r of ROOMS) {
            const existing = await db.query('SELECT id FROM rooms WHERE room_code = ?', [r.room_code]);
            if (existing.length) {
                console.log(`room exists: ${r.room_code}`);
            } else {
                await db.query(
                    'INSERT INTO rooms (room_code, room_name, capacity, created_by, updated_by) VALUES (?, ?, ?, ?, ?)',
                    [r.room_code, r.room_name, r.capacity, adminId, adminId]
                );
                console.log(`created room: ${r.room_code}`);
            }
        }

        console.log('\nSeed done. Logins: admin@lab.test/admin123, kalab@lab.test/kalab123, kaprodi@lab.test/kaprodi123, stafadmin@lab.test/staf123, staflab@lab.test/staf123');
    } catch (e) {
        console.error('Seed failed:', e.message);
        process.exitCode = 1;
    } finally {
        await db.pool.end();
    }
})();
