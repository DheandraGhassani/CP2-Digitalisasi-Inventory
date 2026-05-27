const User = require('../models/User');
const Role = require('../models/Role');

// List all users
const listUsers = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const offset = (page - 1) * limit;
        const role = req.query.role || null;
        
        const result = await User.getAll(limit, offset, role);
        const roles = await Role.getAll();
        
        res.render('users/list', {
            title: 'Manage Users',
            users: result.users,
            total: result.total,
            currentPage: page,
            totalPages: Math.ceil(result.total / limit),
            role,
            roles,
            user: req.session.user
        });
    } catch (error) {
        console.error('Error listing users:', error);
        res.status(500).render('error', {
            title: 'Error',
            message: 'Failed to load users'
        });
    }
};

// Show create user form
const showCreateForm = async (req, res) => {
    try {
        const roles = await Role.getAll();
        res.render('users/form', {
            title: 'Create New User',
            user: null,
            roles,
            errors: null
        });
    } catch (error) {
        console.error('Error showing create form:', error);
        res.status(500).render('error', {
            title: 'Error',
            message: 'Failed to load form'
        });
    }
};

// Create user
const createUser = async (req, res) => {
    try {
        const { name, email, password, role, roles_id } = req.body;
        
        // Check if email exists
        const existingUser = await User.findByEmail(email);
        if (existingUser) {
            const roles = await Role.getAll();
            return res.render('users/form', {
                title: 'Create New User',
                user: null,
                roles,
                errors: { email: 'Email already exists' }
            });
        }
        
        await User.create({ name, email, password, role, roles_id });
        res.redirect('/users?success=User created successfully');
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).render('error', {
            title: 'Error',
            message: 'Failed to create user'
        });
    }
};

// Show edit user form
const showEditForm = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).render('error', {
                title: 'Not Found',
                message: 'User not found'
            });
        }
        
        const roles = await Role.getAll();
        res.render('users/form', {
            title: 'Edit User',
            user,
            roles,
            errors: null
        });
    } catch (error) {
        console.error('Error showing edit form:', error);
        res.status(500).render('error', {
            title: 'Error',
            message: 'Failed to load form'
        });
    }
};

// Update user
const updateUser = async (req, res) => {
    try {
        const { name, email, role, roles_id } = req.body;
        await User.update(req.params.id, { name, email, role, roles_id, profile_photo: null });
        res.redirect('/users?success=User updated successfully');
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).render('error', {
            title: 'Error',
            message: 'Failed to update user'
        });
    }
};

// Delete user
const deleteUser = async (req, res) => {
    try {
        await User.delete(req.params.id);
        res.redirect('/users?success=User deleted successfully');
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).render('error', {
            title: 'Error',
            message: 'Failed to delete user'
        });
    }
};

module.exports = {
    listUsers,
    showCreateForm,
    createUser,
    showEditForm,
    updateUser,
    deleteUser
};