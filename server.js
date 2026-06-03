const app = require('./app');
const db = require('./config/database');

const PORT = process.env.PORT || 3000;

// Test database connection, then start the server
async function startServer() {
    const connected = await db.testConnection();
    if (!connected) {
        console.error('Unable to connect to the database.');
        console.error('Check your .env DB_* settings and ensure MySQL is running.');
        process.exit(1);
    }

    app.listen(PORT, () => {
        console.log(`Server is running at http://localhost:${PORT}`);
        console.log('Environment:', process.env.NODE_ENV || 'development');
    });
}

startServer();
