const db = require('../config/database');

class Role {
    // Get all roles
    static async getAll() {
        try {
            const query = 'SELECT * FROM roles ORDER BY id';
            const roles = await db.query(query);
            return roles;
        } catch (error) {
            console.error('Error getting roles:', error);
            throw error;
        };
    };

    // Get role by ID
    static async findById(id) {
        try {
            const query = 'SELECT * FROM roles WHERE id = ?';
            const roles = await db.query(query, [id]);
            return roles[0] || null;
        } catch (error) {
            console.error('Error finding role by ID:', error);
            throw error;
        };
    };

    // Get role by name
    static async findByName(roleName) {
        try {
            const query = 'SELECT * FROM roles WHERE role_name = ?';
            const roles = await db.query(query, [roleName]);
            return roles[0] || null;
        } catch (error) {
            console.error('Error finding role by name:', error);
            throw error;
        };
    };

    // Create new role
    static async create(roleName) {
        try {
            const query = 'INSERT INTO roles (role_name, created_at, updated_at) VALUES (?, NOW(), NOW())';
            const result = await db.query(query, [roleName]);
            return result.insertId;
        } catch (error) {
            console.error('Error creating role:', error);
            throw error;
        };
    };

    // Update role
    static async update(id, roleName) {
        try {
            const query = 'UPDATE roles SET role_name = ?, updated_at = NOW() WHERE id = ?';
            await db.query(query, [roleName, id]);
            return true;
        } catch (error) {
            console.error('Error updating role:', error);
            throw error;
        };
    };

    // Delete role
    static async delete(id) {
        try {
            // Check if role is being used by any user
            const checkQuery = 'SELECT COUNT(*) as count FROM users WHERE roles_id = ?';
            const result = await db.query(checkQuery, [id]);
            if (result[0].count > 0) {
                throw new Error('Cannot delete role that is assigned to users');
            };
            
            const query = 'DELETE FROM roles WHERE id = ?';
            await db.query(query, [id]);
            return true;
        } catch (error) {
            console.error('Error deleting role:', error);
            throw error;
        };
    };
};

module.exports = Role;