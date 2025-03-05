const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  first_name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  last_name: {
    type: DataTypes.STRING(100)
  },
  dob: {
    type: DataTypes.DATE,
    allowNull: false
  },
  location: {
    type: DataTypes.GEOMETRY('POINT', 4326),
    allowNull: true
  },
  pronouns: {
    type: DataTypes.STRING(50)
  },
  gender: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  sex: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  interested_in: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  dating_intentions: {
    type: DataTypes.TEXT
  },
  relationship_type: {
    type: DataTypes.TEXT
  },
  height: {
    type: DataTypes.FLOAT
  },
  has_children: {
    type: DataTypes.BOOLEAN
  },
  family_plans: {
    type: DataTypes.TEXT
  },
  hometown: {
    type: DataTypes.STRING(255)
  },
  workplace: {
    type: DataTypes.STRING(255)
  },
  job_title: {
    type: DataTypes.STRING(255)
  },
  education: {
    type: DataTypes.STRING(255)
  },
  education_level: {
    type: DataTypes.STRING(100)
  },
  religion: {
    type: DataTypes.STRING(100)
  },
  drink: {
    type: DataTypes.BOOLEAN
  },
  smoke: {
    type: DataTypes.BOOLEAN
  },
  weed: {
    type: DataTypes.BOOLEAN
  },
  drugs: {
    type: DataTypes.BOOLEAN
  },
  pictures: {
    type: DataTypes.ARRAY(DataTypes.TEXT),
    validate: {
      max6Pictures(value) {
        if (value && value.length > 6) {
          throw new Error('Maximum 6 pictures allowed');
        }
      }
    }
  },
  prompts: {
    type: DataTypes.ARRAY(DataTypes.TEXT),
    validate: {
      max3Prompts(value) {
        if (value && value.length > 3) {
          throw new Error('Maximum 3 prompts allowed');
        }
      }
    }
  },
  voice_prompt: {
    type: DataTypes.TEXT
  }
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = User; 