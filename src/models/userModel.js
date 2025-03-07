const { pool } = require('../config/db');
const yup = require('yup');

// Initial user validation schema (for creation)
const initialUserSchema = yup.object().shape({
  email: yup.string().email().required().max(255),
  phone_number: yup.string().required().max(20),
  email_verified: yup.boolean().default(false)
});

// Profile update validation schema
const userSchema = yup.object().shape({
  // Required fields
  first_name: yup.string().required().max(100),
  dob: yup.date().required(),
  gender: yup.string().required().max(50),
  sex: yup.string().required().max(50),
  interested_in: yup.string().required().max(50),

  // Optional fields
  last_name: yup.string().nullable().max(100),
  pronouns: yup.string().nullable().max(50),
  dating_intentions: yup.string().nullable(),
  relationship_type: yup.string().nullable(),
  height: yup.number().nullable(),
  has_children: yup.boolean().nullable(),
  family_plans: yup.string().nullable(),
  hometown: yup.string().nullable().max(255),
  workplace: yup.string().nullable().max(255),
  job_title: yup.string().nullable().max(255),
  education: yup.string().nullable().max(255),
  education_level: yup.string().nullable().max(100),
  religion: yup.string().nullable().max(100),
  drink: yup.boolean().nullable(),
  smoke: yup.boolean().nullable(),
  weed: yup.boolean().nullable(),
  drugs: yup.boolean().nullable(),
  pictures: yup.array().nullable().max(6),
  prompts: yup.array().nullable().max(3),
  voice_prompt: yup.string().nullable()
});

class User {
  static async findByPhone(phone_number) {
    const query = 'SELECT * FROM users WHERE phone_number = $1';
    const result = await pool.query(query, [phone_number]);
    return result.rows[0];
  }

  static async findByEmail(email) {
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await pool.query(query, [email]);
    return result.rows[0];
  }

  static async createInitial(phone_number, email, email_verified = false) {
    // Validate initial user data
    await initialUserSchema.validate({ phone_number, email, email_verified });

    const query = `
      INSERT INTO users (
        phone_number, 
        email, 
        email_verified,
        first_name,
        dob,
        gender,
        sex,
        interested_in
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, phone_number, email, email_verified`;

    // Temporary values for required fields
    const tempFirstName = "User"; // Will be updated in complete profile
    const tempDob = new Date("2000-01-01"); // Will be updated in complete profile
    const tempGender = "Unspecified"; // Will be updated in complete profile
    const tempSex = "Unspecified"; // Will be updated in complete profile
    const tempInterestedIn = "Unspecified"; // Will be updated in complete profile

    const result = await pool.query(query, [
      phone_number,
      email,
      email_verified,
      tempFirstName,
      tempDob,
      tempGender,
      tempSex,
      tempInterestedIn
    ]);
    return result.rows[0];
  }

  static async updateProfile(userId, userData) {
    try {
      // Validate user data
      await userSchema.validate(userData);

      const {
        first_name, last_name, dob, pronouns, gender, sex,
        interested_in, dating_intentions, relationship_type,
        height, has_children, family_plans, hometown,
        workplace, job_title, education, education_level,
        religion, drink, smoke, weed, drugs,
        pictures, prompts, voice_prompt
      } = userData;

      const query = `
        UPDATE users
        SET
          first_name = $1,
          last_name = $2,
          dob = $3,
          pronouns = $4,
          gender = $5,
          sex = $6,
          interested_in = $7,
          dating_intentions = $8,
          relationship_type = $9,
          height = $10,
          has_children = $11,
          family_plans = $12,
          hometown = $13,
          workplace = $14,
          job_title = $15,
          education = $16,
          education_level = $17,
          religion = $18,
          drink = $19,
          smoke = $20,
          weed = $21,
          drugs = $22,
          pictures = $23,
          prompts = $24,
          voice_prompt = $25
        WHERE id = $26
        RETURNING *`;

      const values = [
        first_name, last_name, dob, pronouns, gender, sex,
        interested_in, dating_intentions, relationship_type,
        height, has_children, family_plans, hometown,
        workplace, job_title, education, education_level,
        religion, drink, smoke, weed, drugs,
        pictures, prompts, voice_prompt, userId
      ];

      const result = await pool.query(query, values);
      
      if (result.rows.length === 0) {
        throw new Error('User not found');
      }
      
      return result.rows[0];
    } catch (error) {
      console.error('Error in updateProfile:', error);
      throw error;
    }
  }

  static async updateLocation(userId, latitude, longitude) {
    const query = `
      UPDATE users
      SET location = ST_SetSRID(ST_MakePoint($1, $2), 4326)
      WHERE id = $3
      RETURNING id`;
    const result = await pool.query(query, [longitude, latitude, userId]);
    return result.rows[0];
  }
}

module.exports = {
  User,
  userSchema,
  initialUserSchema
}; 