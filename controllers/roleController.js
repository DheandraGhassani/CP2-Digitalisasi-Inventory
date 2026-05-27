const Role = require('../models/Role');

// List all roles
const listRoles = async (req, res) => {
    try {
        const roles = await Role.getAll();
        res.render('roles/list', {
            title: 'Manage Roles',
            roles,
            user: req.session.user
        });
    } catch (error) {
        console.error('Error listing roles:', error);
        res.status(500).render('error', {
            title: 'Error',
            message: 'Failed to load roles'
        });
    }
};

// Show create role form
const showCreateForm = (req, res) => {
    res.render('roles/form', {
        title: 'Create New Role',
        role: null,
        errors: null
    });
};

// Create role
const createRole = async (req, res) => {
    try {
        const { role_name } = req.body;
        
        // Check if role exists
        const existingRole = await Role.findByName(role_name);
        if (existingRole) {
            return res.render('roles/form', {
                title: 'Create New Role',
                role: null,
                errors: { role_name: 'Role name already exists' }
            });
        }
        
        await Role.create(role_name);
        res.redirect('/roles?success=Role created successfully');
    } catch (error) {
        console.error('Error creating role:', error);
        res.status(500).render('error', {
            title: 'Error',
            message: 'Failed to create role'
        });
    }
};

// Show edit role form
const showEditForm = async (req, res) => {
    try {
        const role = await Role.findById(req.params.id);
        if (!role) {
            return res.status(404).render('error', {
                title: 'Not Found',
                message: 'Role not found'
            });
        }
        
        res.render('roles/form', {
            title: 'Edit Role',
            role,
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

// Update role
const updateRole = async (req, res) => {
    try {
        const { role_name } = req.body;
        await Role.update(req.params.id, role_name);
        res.redirect('/roles?success=Role updated successfully');
    } catch (error) {
        console.error('Error updating role:', error);
        res.status(500).render('error', {
            title: 'Error',
            message: 'Failed to update role'
        });
    }
};

// Delete role
const deleteRole = async (req, res) => {
    try {
        await Role.delete(req.params.id);
        res.redirect('/roles?success=Role deleted successfully');
    } catch (error) {
        console.error('Error deleting role:', error);
        res.status(500).render('error', {
            title: 'Error',
            message: error.message || 'Failed to delete role'
        });
    }
};

module.exports = {
    listRoles,
    showCreateForm,
    createRole,
    showEditForm,
    updateRole,
    deleteRole
};