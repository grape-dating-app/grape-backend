const { pool } = require('../config/db');

// Like a user
const likeUser = async (req, res) => {
    try {
        const likerId = req.user.uid; // From JWT token
        const { likedId, isSuperLike = false } = req.body;

        if (!likedId) {
            return res.status(400).json({
                success: false,
                message: 'Liked user ID is required'
            });
        }

        // Check if users exist
        const userCheckQuery = 'SELECT id, first_name FROM users WHERE id IN ($1, $2)';
        const userCheck = await pool.query(userCheckQuery, [likerId, likedId]);

        if (userCheck.rows.length !== 2) {
            return res.status(404).json({
                success: false,
                message: 'One or both users not found'
            });
        }

        // Create the like
        const createLikeQuery = `
            INSERT INTO likes (liker_id, liked_id, is_super_like)
            VALUES ($1, $2, $3)
            RETURNING *
        `;

        const result = await pool.query(createLikeQuery, [likerId, likedId, isSuperLike]);

        // Check if there's a mutual like (match)
        const checkMutualLikeQuery = `
            SELECT * FROM likes 
            WHERE liker_id = $1 AND liked_id = $2
        `;
        const mutualLike = await pool.query(checkMutualLikeQuery, [likedId, likerId]);

        if (mutualLike.rows.length > 0) {
            // Create a match
            const createMatchQuery = `
                INSERT INTO matches (user1_id, user2_id)
                VALUES ($1, $2)
                RETURNING *
            `;
            await pool.query(createMatchQuery, [likerId, likedId]);

            return res.status(201).json({
                success: true,
                message: "It's a match!",
                data: {
                    like: result.rows[0],
                    isMatch: true
                }
            });
        }

        res.status(201).json({
            success: true,
            message: 'Like created successfully',
            data: {
                like: result.rows[0],
                isMatch: false
            }
        });
    } catch (error) {
        if (error.constraint === 'likes_liker_id_liked_id_key') {
            return res.status(400).json({
                success: false,
                message: 'You have already liked this user'
            });
        }
        console.error('Error creating like:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Get users who liked you
const getWhoLikedYou = async (req, res) => {
    try {
        const userId = req.user.uid;
        
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
        }

        const query = `
            SELECT 
                l.id as like_id,
                l.created_at as liked_at,
                l.is_super_like,
                u.id,
                u.first_name,
                u.last_name,
                u.pictures,
                u.job_title,
                u.workplace,
                u.education,
                u.pronouns,
                u.gender,
                u.hometown,
                u.education_level,
                u.religion,
                EXTRACT(YEAR FROM AGE(NOW(), u.dob)) as age,
                EXISTS (
                    SELECT 1 FROM matches m
                    WHERE (m.user1_id = l.liker_id AND m.user2_id = l.liked_id)
                    OR (m.user1_id = l.liked_id AND m.user2_id = l.liker_id)
                ) as is_match
            FROM likes l
            JOIN users u ON l.liker_id = u.id
            WHERE l.liked_id = $1
            ORDER BY l.created_at DESC
        `;

        const result = await pool.query(query, [userId]);

        const mappedResults = result.rows.map(user => ({
            like_id: user.like_id,
            liked_at: user.liked_at,
            is_super_like: user.is_super_like,
            is_match: user.is_match,
            id: user.id,
            first_name: user.first_name || '',
            last_name: user.last_name || '',
            pictures: user.pictures || [],
            age: user.age ? parseInt(user.age) : null,
            job_title: user.job_title || '',
            workplace: user.workplace || '',
            education: user.education || '',
            pronouns: user.pronouns || '',
            gender: user.gender || '',
            hometown: user.hometown || '',
            education_level: user.education_level || '',
            religion: user.religion || ''
        }));

        res.json({
            success: true,
            message: 'Retrieved users who liked you',
            data: mappedResults
        });
    } catch (error) {
        console.error('Error getting likes:', error);
        console.error('Error details:', {
            code: error.code,
            detail: error.detail,
            table: error.table,
            constraint: error.constraint,
            column: error.column,
            dataType: error.dataType,
            schema: error.schema,
            stack: error.stack
        });
        res.status(500).json({
            success: false,
            message: 'Failed to get users who liked you',
            error: error.message
        });
    }
};

// Accept a like (create a match)
const acceptLike = async (req, res) => {
    try {
        const userId = req.user.uid; // Current user (the one who was liked)
        const { likerId } = req.params; // ID of the user who sent the like

        // First verify that the like exists
        const checkLikeQuery = `
            SELECT * FROM likes 
            WHERE liker_id = $1 AND liked_id = $2
        `;
        const likeExists = await pool.query(checkLikeQuery, [likerId, userId]);

        if (likeExists.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Like not found'
            });
        }

        // Check if match already exists
        const checkMatchQuery = `
            SELECT * FROM matches 
            WHERE (user1_id = $1 AND user2_id = $2)
            OR (user1_id = $2 AND user2_id = $1)
        `;
        const matchExists = await pool.query(checkMatchQuery, [userId, likerId]);

        if (matchExists.rows.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Match already exists'
            });
        }

        // Create a match
        const createMatchQuery = `
            INSERT INTO matches (user1_id, user2_id)
            VALUES ($1, $2)
            RETURNING *
        `;
        const match = await pool.query(createMatchQuery, [userId, likerId]);

        // Get the user details of who you matched with
        const userQuery = `
            SELECT id, first_name, last_name, pictures
            FROM users
            WHERE id = $1
        `;
        const matchedUser = await pool.query(userQuery, [likerId]);

        res.status(201).json({
            success: true,
            message: "It's a match!",
            data: {
                match: match.rows[0],
                user: matchedUser.rows[0]
            }
        });
    } catch (error) {
        console.error('Error accepting like:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to accept like'
        });
    }
};

// Reject a like (delete the like)
const rejectLike = async (req, res) => {
    try {
        const userId = req.user.uid; // Current user (the one who was liked)
        const { likerId } = req.params; // ID of the user who sent the like

        const query = `
            DELETE FROM likes
            WHERE liker_id = $1 AND liked_id = $2
            RETURNING *
        `;

        const result = await pool.query(query, [likerId, userId]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Like not found'
            });
        }

        res.json({
            success: true,
            message: 'Like rejected successfully'
        });
    } catch (error) {
        console.error('Error rejecting like:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to reject like'
        });
    }
};

module.exports = {
    likeUser,
    getWhoLikedYou,
    acceptLike,
    rejectLike
}; 