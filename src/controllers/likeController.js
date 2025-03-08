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

        const query = `
            SELECT 
                l.id as like_id,
                l.created_at as liked_at,
                l.is_super_like,
                u.id,
                u.first_name,
                u.last_name,
                u.pictures,
                u.age,
                u.job_title,
                u.workplace,
                u.education
            FROM likes l
            JOIN users u ON l.liker_id = u.id
            WHERE l.liked_id = $1
            AND NOT EXISTS (
                SELECT 1 FROM matches m
                WHERE (m.user1_id = l.liker_id AND m.user2_id = l.liked_id)
                OR (m.user1_id = l.liked_id AND m.user2_id = l.liker_id)
            )
            ORDER BY l.created_at DESC
        `;

        const result = await pool.query(query, [userId]);

        res.json({
            success: true,
            message: 'Retrieved users who liked you',
            data: result.rows
        });
    } catch (error) {
        console.error('Error getting likes:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get users who liked you'
        });
    }
};

// Unlike a user
const unlikeUser = async (req, res) => {
    try {
        const likerId = req.user.uid;
        const { likedId } = req.params;

        const query = `
            DELETE FROM likes
            WHERE liker_id = $1 AND liked_id = $2
            RETURNING *
        `;

        const result = await pool.query(query, [likerId, likedId]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Like not found'
            });
        }

        res.json({
            success: true,
            message: 'Successfully unliked user',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error unliking user:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to unlike user'
        });
    }
};

module.exports = {
    likeUser,
    getWhoLikedYou,
    unlikeUser
}; 