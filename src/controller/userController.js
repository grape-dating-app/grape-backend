const { pool } = require('../config/db');

// Update user details
const updateUser = async (req, res) => {
    try {
        const userId = req.params.userId;
        const updateData = req.body;

        console.log('Update request for user:', userId);
        console.log('Update data received:', updateData);

        // Remove sensitive or non-updatable fields
        delete updateData.id;
        delete updateData.created_at;

        // Validate required fields if they are being updated
        const requiredFields = ['first_name', 'phone_number', 'email', 'dob', 'gender', 'sex', 'interested_in'];
        for (const field of requiredFields) {
            if (field in updateData && !updateData[field]) {
                return res.status(400).json({ error: `${field} cannot be empty` });
            }
        }

        // Validate array lengths if they are being updated
        if (updateData.pictures && updateData.pictures.length > 6) {
            return res.status(400).json({ error: 'Maximum 6 pictures allowed' });
        }
        if (updateData.prompts && updateData.prompts.length > 3) {
            return res.status(400).json({ error: 'Maximum 3 prompts allowed' });
        }

        // Handle location update if coordinates are provided
        if (updateData.latitude && updateData.longitude) {
            updateData.location = `POINT(${updateData.longitude} ${updateData.latitude})`;
            delete updateData.latitude;
            delete updateData.longitude;
        }

        // Convert boolean strings to actual booleans
        const booleanFields = ['has_children', 'drink', 'smoke', 'weed', 'drugs'];
        for (const field of booleanFields) {
            if (field in updateData) {
                updateData[field] = updateData[field] === 'true' || updateData[field] === true;
            }
        }

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ error: 'No valid fields to update' });
        }

        // Construct the update query dynamically
        const setClause = Object.keys(updateData)
            .map((key, index) => {
                // Special handling for location field
                if (key === 'location') {
                    return `${key} = ST_SetSRID(ST_GeomFromText($${index + 2}), 4326)`;
                }
                return `${key} = $${index + 2}`;
            })
            .join(', ');
        const values = Object.values(updateData);

        const updateQuery = `
            UPDATE users 
            SET ${setClause}
            WHERE id = $1
            RETURNING 
                id, first_name, last_name, phone_number, email, dob,
                ST_AsText(location) as location,
                pronouns, gender, sex, interested_in,
                dating_intentions, relationship_type,
                height, has_children, family_plans,
                hometown, workplace, job_title,
                education, education_level,
                religion, drink, smoke, weed, drugs,
                pictures, prompts, voice_prompt,
                created_at
        `;

        console.log('Generated SQL Query:', updateQuery);
        console.log('Query parameters:', [userId, ...values]);

        const result = await pool.query(updateQuery, [userId, ...values]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Convert location from WKT format to lat/lng object if it exists
        const user = result.rows[0];
        if (user.location) {
            const match = user.location.match(/POINT\(([-\d.]+) ([-\d.]+)\)/);
            if (match) {
                user.location = {
                    longitude: parseFloat(match[1]),
                    latitude: parseFloat(match[2])
                };
            }
        }

        res.json({
            message: 'User updated successfully',
            user: user
        });
    } catch (error) {
        console.error('Error updating user:', error.message);
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

        // Send appropriate error message based on the error type
        if (error.constraint === 'users_email_key') {
            return res.status(400).json({ error: 'Email already exists' });
        } else if (error.constraint === 'users_phone_number_key') {
            return res.status(400).json({ error: 'Phone number already exists' });
        } else if (error.code === '42703') {
            return res.status(400).json({ error: 'Invalid field name provided' });
        } else if (error.code === '22P02') {
            return res.status(400).json({ error: 'Invalid data type for one or more fields' });
        }
        
        res.status(500).json({ 
            error: 'Internal server error',
            details: error.message // Adding error message for debugging
        });
    }
};

// Delete user account
const deleteUser = async (req, res) => {
    try {
        const userId = req.params.userId;

        // First, check if the user exists
        const checkUserQuery = 'SELECT id FROM users WHERE id = $1';
        const userCheck = await pool.query(checkUserQuery, [userId]);

        if (userCheck.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Begin transaction
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // Delete user's matches (the foreign key cascade will handle this automatically)
            // But we can add explicit cleanup if needed:
            await client.query('DELETE FROM matches WHERE user1_id = $1 OR user2_id = $1', [userId]);

            // Delete the user
            const deleteQuery = 'DELETE FROM users WHERE id = $1 RETURNING id';
            const result = await client.query(deleteQuery, [userId]);

            await client.query('COMMIT');
            
            res.json({
                message: 'User account deleted successfully',
                userId: result.rows[0].id
            });
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = {
    updateUser,
    deleteUser
}; 