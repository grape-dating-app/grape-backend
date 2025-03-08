const { pool } = require('../config/db');

// Create a new match between two users
const createMatch = async (req, res) => {
    try {
        const { user1_id, user2_id } = req.body;
        
        // Validate input
        if (!user1_id || !user2_id) {
            return res.status(400).json({ error: 'Both user IDs are required' });
        }

        // Check if users exist
        const userCheckQuery = 'SELECT id FROM users WHERE id IN ($1, $2)';
        const userCheck = await pool.query(userCheckQuery, [user1_id, user2_id]);
        
        if (userCheck.rows.length !== 2) {
            return res.status(404).json({ error: 'One or both users not found' });
        }

        // Create match
        const createMatchQuery = `
            INSERT INTO matches (user1_id, user2_id)
            VALUES ($1, $2)
            RETURNING *
        `;
        
        const result = await pool.query(createMatchQuery, [user1_id, user2_id]);
        res.status(201).json(result.rows[0]);
    } catch (error) {
        if (error.constraint === 'matches_user1_id_user2_id_key') {
            return res.status(400).json({ error: 'Match already exists between these users' });
        }
        console.error('Error creating match:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get all matches for a user
const getUserMatches = async (req, res) => {
    try {
        const userId = req.params.userId;
        
        // First check if the user exists and get available columns
        const userCheckQuery = 'SELECT * FROM users WHERE id = $1';
        const userCheck = await pool.query(userCheckQuery, [userId]);
        
        if (userCheck.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Determine which column to use for user identification
        const userColumns = Object.keys(userCheck.rows[0]);
        let userIdentifierColumn = 'name'; // default to name
        if (userColumns.includes('name')) {
            userIdentifierColumn = 'name';
        } else if (userColumns.includes('full_name')) {
            userIdentifierColumn = 'full_name';
        } else if (userColumns.includes('email')) {
            userIdentifierColumn = 'email';
        }
        
        const matchesQuery = `
            SELECT 
                m.*,
                CASE 
                    WHEN m.user1_id = $1 THEN u2.${userIdentifierColumn}
                    ELSE u1.${userIdentifierColumn}
                END as matched_user_identifier
            FROM matches m
            JOIN users u1 ON m.user1_id = u1.id
            JOIN users u2 ON m.user2_id = u2.id
            WHERE (m.user1_id = $1 OR m.user2_id = $1)
            AND m.is_active = true
        `;
        
        const result = await pool.query(matchesQuery, [userId]);
        res.json(result.rows);
    } catch (error) {
        console.error('Error getting matches:', error.message);
        console.error('Error details:', {
            code: error.code,
            detail: error.detail,
            table: error.table,
            constraint: error.constraint,
            stack: error.stack
        });
        res.status(500).json({ 
            error: 'Internal server error',
            details: error.message
        });
    }
};

// Unmatch users (soft delete)
const unmatchUsers = async (req, res) => {
    try {
        const { user1_id, user2_id } = req.params;
        
        const unmatchQuery = `
            UPDATE matches 
            SET is_active = false 
            WHERE (user1_id = $1 AND user2_id = $2)
                OR (user1_id = $2 AND user2_id = $1)
            RETURNING *
        `;
        
        const result = await pool.query(unmatchQuery, [user1_id, user2_id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Match not found' });
        }
        
        res.json({ message: 'Successfully unmatched', match: result.rows[0] });
    } catch (error) {
        console.error('Error unmatching users:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = {
    createMatch,
    getUserMatches,
    unmatchUsers
}; 