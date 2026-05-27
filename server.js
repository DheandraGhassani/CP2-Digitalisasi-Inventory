const app = require('./app');
const db = require('./config/database');

const PORT = process.env.PORT || 8000;

// Test database connection
async function startServer() {
    try {
        const connection = await db.authenticate();
        console.log('Database connection established successfully.');
        connection.release();

        app.listen(PORT, () => {
            console.log(`Server is running at http://localhost:${PORT}`);
            console.log('Environment:', `${process.env.NODE_ENV || 'development'}`);
        });
    } catch (error) {
        console.error('Unable to connect to the database:', error);
        console.error('Please check your database configuration and ensure the database server is running.');
        process.exit(1);
    };
};

startServer();