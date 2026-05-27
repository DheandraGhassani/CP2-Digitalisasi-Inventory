const mysql = require('mysql2/promise');
require('dotenv').config();

async function test() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });
        console.log('✅ Database connected!');
        const [result] = await connection.query('SELECT COUNT(*) as count FROM rooms');
        console.log(`📊 Users count: ${result[0].count}`);
        await connection.end();
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}
test();