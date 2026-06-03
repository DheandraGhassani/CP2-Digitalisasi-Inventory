const express = require('express');
const session = require('express-session');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

// Initialize Express app
const app = express();

// View engine setup
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'your_secret_key',
    resave: false,
    saveUninitialized: true,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: parseInt(process.env.SESSION_EXPIRY) || 86400000
    }
}));

// Make user data available in templates
app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    res.locals.currentPath = req.path;
    next();
});

// Import routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const roomRoutes = require('./routes/roomRoutes');
const roleRoutes = require('./routes/roleRoutes');
const procurementRoutes = require('./routes/procurementRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const assetRoutes = require('./routes/assetRoutes');

// Use routes
app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/rooms', roomRoutes);
app.use('/roles', roleRoutes);
app.use('/procurement', procurementRoutes);
app.use('/review', reviewRoutes);
app.use('/assets', assetRoutes);

// Home route
app.get('/', (req, res) => {
    if (req.session.user) {
        return res.redirect('/auth/dashboard');
    } else {
        res.render('auth/login');
    }
});

// Dashboard dispatch (delegates to role-based handler under /auth)
app.get('/dashboard', (req, res) => {
    res.redirect('/auth/dashboard');
});

// Error handling
app.use((req, res, next) => {
    res.status(404).render('error', {
        title: '404 - Page Not Found',
        message: 'The page you are looking for does not exist.'
    });
});

app.use((err, req, res, next) => {
    console.error('❌ Error:', err.stack);
    res.status(500).render('error', {
        title: '500 - Server Error',
        message: 'Something went wrong on the server.'
    });
});

module.exports = app;