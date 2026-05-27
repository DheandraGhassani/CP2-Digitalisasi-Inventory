const Room = require('../models/Room');

// List all rooms
const listRooms = async (req, res) => {
    try {
        const rooms = await Room.getAll();
        res.render('rooms/list', {
            title: 'Manage Rooms',
            rooms,
            user: req.session.user
        });
    } catch (error) {
        console.error('Error listing rooms:', error);
        res.status(500).render('error', {
            title: 'Error',
            message: 'Failed to load rooms'
        });
    }
};

// Show create room form
const showCreateForm = (req, res) => {
    res.render('rooms/form', {
        title: 'Create New Room',
        room: null,
        errors: null
    });
};

// Create room
const createRoom = async (req, res) => {
    try {
        const { room_code, room_name, capacity, description } = req.body;
        
        // Check if room code exists
        const existingRoom = await Room.findByCode(room_code);
        if (existingRoom) {
            return res.render('rooms/form', {
                title: 'Create New Room',
                room: null,
                errors: { room_code: 'Room code already exists' }
            });
        }
        
        await Room.create({
            room_code,
            room_name,
            capacity,
            description,
            created_by: req.session.user.id
        });
        
        res.redirect('/rooms?success=Room created successfully');
    } catch (error) {
        console.error('Error creating room:', error);
        res.status(500).render('error', {
            title: 'Error',
            message: 'Failed to create room'
        });
    }
};

// Show edit room form
const showEditForm = async (req, res) => {
    try {
        const room = await Room.findById(req.params.id);
        if (!room) {
            return res.status(404).render('error', {
                title: 'Not Found',
                message: 'Room not found'
            });
        }
        
        res.render('rooms/form', {
            title: 'Edit Room',
            room,
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

// Update room
const updateRoom = async (req, res) => {
    try {
        const { room_code, room_name, capacity, description } = req.body;
        await Room.update(req.params.id, {
            room_code,
            room_name,
            capacity,
            description,
            updated_by: req.session.user.id
        });
        
        res.redirect('/rooms?success=Room updated successfully');
    } catch (error) {
        console.error('Error updating room:', error);
        res.status(500).render('error', {
            title: 'Error',
            message: 'Failed to update room'
        });
    }
};

// Delete room
const deleteRoom = async (req, res) => {
    try {
        await Room.delete(req.params.id);
        res.redirect('/rooms?success=Room deleted successfully');
    } catch (error) {
        console.error('Error deleting room:', error);
        res.status(500).render('error', {
            title: 'Error',
            message: 'Failed to delete room'
        });
    }
};

module.exports = {
    listRooms,
    showCreateForm,
    createRoom,
    showEditForm,
    updateRoom,
    deleteRoom
};