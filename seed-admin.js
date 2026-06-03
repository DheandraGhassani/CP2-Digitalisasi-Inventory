// One-off seed: create a default admin user. Run: node seed-admin.js
const bcrypt = require('bcryptjs');
const db = require('./config/database');

const ADMIN = { name: 'Administrator', email: 'admin@lab.test', password: 'admin123', roles_id: 1 };

(async () => {
    try {
        const existing = await db.query('SELECT id FROM users WHERE email = ?', [ADMIN.email]);
        if (existing.length) {
            console.log(`User ${ADMIN.email} already exists (id ${existing[0].id}). Skipping.`);
        } else {
            const hash = await bcrypt.hash(ADMIN.password, 10);
            const res = await db.query(
                'INSERT INTO users (name, email, password, roles_id, is_active) VALUES (?, ?, ?, ?, 1)',
                [ADMIN.name, ADMIN.email, hash, ADMIN.roles_id]
            );
            console.log(`Created admin (id ${res.insertId}) — login: ${ADMIN.email} / ${ADMIN.password}`);
        }
    } catch (e) {
        console.error('Seed failed:', e.message);
        process.exitCode = 1;
    } finally {
        await db.pool.end();
    }
})();
