const db = require('../config/database');

class Room {
    // Get all rooms
    static async getAll() {
        try {
            const query = `
                SELECT r.*, 
                       creator.name as creator_name,
                       updater.name as updater_name
                FROM rooms r
                LEFT JOIN users creator ON r.created_by = creator.id
                LEFT JOIN users updater ON r.updated_by = updater.id
                ORDER BY r.created_at DESC
            `;
            const rooms = await db.query(query);
            return rooms;
        } catch (error) {
            console.error('Error getting rooms:', error);
            throw error;
        }
    }

    // Get room by ID
    static async findById(id) {
        try {
            const query = `
                SELECT r.*, 
                       creator.name as creator_name,
                       updater.name as updater_name
                FROM rooms r
                LEFT JOIN users creator ON r.created_by = creator.id
                LEFT JOIN users updater ON r.updated_by = updater.id
                WHERE r.id = ?
            `;
            const rooms = await db.query(query, [id]);
            return rooms[0] || null;
        } catch (error) {
            console.error('Error finding room by ID:', error);
            throw error;
        }
    }

    // Get room by code
    static async findByCode(roomCode) {
        try {
            const query = 'SELECT * FROM rooms WHERE room_code = ?';
            const rooms = await db.query(query, [roomCode]);
            return rooms[0] || null;
        } catch (error) {
            console.error('Error finding room by code:', error);
            throw error;
        }
    }

    // Create new room
    static async create(roomData) {
        try {
            const { room_code, room_name, capacity, description, created_by } = roomData;
            const query = `
                INSERT INTO rooms (room_code, room_name, capacity, description, created_by, updated_by, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
            `;
            const result = await db.query(query, [room_code, room_name, capacity, description, created_by, created_by]);
            return result.insertId;
        } catch (error) {
            console.error('Error creating room:', error);
            throw error;
        }
    }

    // Update room
    static async update(id, roomData) {
        try {
            const { room_code, room_name, capacity, description, updated_by } = roomData;
            const query = `
                UPDATE rooms 
                SET room_code = ?, room_name = ?, capacity = ?, description = ?, updated_by = ?, updated_at = NOW()
                WHERE id = ?
            `;
            await db.query(query, [room_code, room_name, capacity, description, updated_by, id]);
            return true;
        } catch (error) {
            console.error('Error updating room:', error);
            throw error;
        }
    }

    // Delete room
    static async delete(id) {
        try {
            const query = 'DELETE FROM rooms WHERE id = ?';
            await db.query(query, [id]);
            return true;
        } catch (error) {
            console.error('Error deleting room:', error);
            throw error;
        }
    }

    // Get room statistics
    static async getStatistics(id) {
        try {
            const query = `
                SELECT 
                    (SELECT COUNT(*) FROM bhp_stocks WHERE rooms_id = ?) as total_bhp,
                    (SELECT COUNT(*) FROM inventory_assets WHERE rooms_id = ?) as total_assets
            `;
            const stats = await db.query(query, [id, id]);
            return stats[0];
        } catch (error) {
            console.error('Error getting room statistics:', error);
            throw error;
        }
    }
}

module.exports = Room;