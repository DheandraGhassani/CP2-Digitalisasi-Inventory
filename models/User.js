const db = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
    // Find user by email
    static async findByEmail(email) {
        try {
            const query = `
                SELECT u.*, r.role_name as role_name 
                FROM users u
                LEFT JOIN roles r ON u.roles_id = r.id
                WHERE u.email = ? AND u.is_active = 1
            `;
            const users = await db.query(query, [email]);
            return users[0] || null;
        } catch (error) {
            console.error('Error finding user by email:', error);
            throw error;
        }
    }

    // Find user by ID
    static async findById(id) {
        try {
            const query = `
                SELECT u.id, u.name, u.email, u.profile_photo, u.is_active,
                       u.created_at, u.updated_at, u.roles_id, r.role_name
                FROM users u
                LEFT JOIN roles r ON u.roles_id = r.id
                WHERE u.id = ?
            `;
            const users = await db.query(query, [id]);
            return users[0] || null;
        } catch (error) {
            console.error('Error finding user by ID:', error);
            throw error;
        }
    }

    // Create new user
    static async create(userData) {
        try {
            const { name, email, password, roles_id, profile_photo = null } = userData;
            const hashedPassword = await bcrypt.hash(password, 10);

            const query = `
                INSERT INTO users (name, email, password, roles_id, profile_photo, is_active, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, 1, NOW(), NOW())
            `;
            const result = await db.query(query, [name, email, hashedPassword, roles_id, profile_photo]);
            return result.insertId;
        } catch (error) {
            console.error('Error creating user:', error);
            throw error;
        }
    }

    // Update user
    static async update(id, userData) {
        try {
            const { name, email, roles_id, profile_photo } = userData;
            const query = `
                UPDATE users
                SET name = ?, email = ?, roles_id = ?, profile_photo = ?, updated_at = NOW()
                WHERE id = ?
            `;
            await db.query(query, [name, email, roles_id, profile_photo, id]);
            return true;
        } catch (error) {
            console.error('Error updating user:', error);
            throw error;
        }
    }

    // Update password
    static async updatePassword(id, newPassword) {
        try {
            const hashedPassword = await bcrypt.hash(newPassword, 10);
            const query = 'UPDATE users SET password = ?, updated_at = NOW() WHERE id = ?';
            await db.query(query, [hashedPassword, id]);
            return true;
        } catch (error) {
            console.error('Error updating password:', error);
            throw error;
        }
    }

    // Delete user (soft delete)
    static async delete(id) {
        try {
            const query = 'UPDATE users SET is_active = 0, updated_at = NOW() WHERE id = ?';
            await db.query(query, [id]);
            return true;
        } catch (error) {
            console.error('Error deleting user:', error);
            throw error;
        }
    }

    // Get all users with pagination
    static async getAll(limit = 10, offset = 0, role = null) {
        try {
            let query = `
                SELECT u.id, u.name, u.email, u.profile_photo, u.is_active,
                       u.created_at, u.updated_at, u.roles_id, r.role_name
                FROM users u
                LEFT JOIN roles r ON u.roles_id = r.id
                WHERE u.is_active = 1
            `;
            const params = [];

            if (role) {
                query += ' AND u.roles_id = ?';
                params.push(role);
            }

            query += ' ORDER BY u.created_at DESC LIMIT ? OFFSET ?';
            params.push(limit, offset);

            const users = await db.query(query, params);

            // Get total count
            let countQuery = 'SELECT COUNT(*) as total FROM users WHERE is_active = 1';
            if (role) {
                countQuery += ' AND roles_id = ?';
            }
            const countResult = await db.query(countQuery, role ? [role] : []);

            return {
                users,
                total: countResult[0].total,
                limit,
                offset
            };
        } catch (error) {
            console.error('Error getting users:', error);
            throw error;
        }
    }

    // Verify password
    static async verifyPassword(plainPassword, hashedPassword) {
        return await bcrypt.compare(plainPassword, hashedPassword);
    }

    // Get users by role
    static async getByRole(roleId) {
        try {
            const query = `
                SELECT u.id, u.name, u.email, u.profile_photo
                FROM users u
                WHERE u.roles_id = ? AND u.is_active = 1
                ORDER BY u.name
            `;
            const users = await db.query(query, [roleId]);
            return users;
        } catch (error) {
            console.error('Error getting users by role:', error);
            throw error;
        }
    }
}

module.exports = User;