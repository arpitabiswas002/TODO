const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sequelize } = require('../config/database');
const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Please enter your name' },
      len: {
        args: [1, 30],
        msg: 'Your name cannot exceed 30 characters'
      }
    }
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: { msg: 'Please enter a valid email address' },
      notEmpty: { msg: 'Please enter your email' }
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Please enter your password' },
      len: {
        args: [6, 100],
        msg: 'Your password must be at least 6 characters long'
      }
    }
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  hooks: {
    beforeCreate: async (user) => {
      if (user.password) {
        user.password = await bcrypt.hash(user.password, 10);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        user.password = await bcrypt.hash(user.password, 10);
      }
    }
  },
  defaultScope: {
    attributes: { exclude: ['password'] }
  },
  scopes: {
    withPassword: {
      attributes: { include: ['password'] }
    }
  }
});

// Instance method to compare password
User.prototype.comparePassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Instance method to generate JWT token
User.prototype.getJwtToken = function() {
  return jwt.sign({ id: this.id }, process.env.JWT_SECRET || 'your-secret-key', {
    expiresIn: process.env.JWT_EXPIRES_TIME || '7d'
  });
};


// Define associations
User.associate = (models) => {
  // A user can create many todos
  User.hasMany(models.Todo, {
    foreignKey: 'userId',
    as: 'created_todos' // Corresponds to 'creator' in Todo model
  });

  // A user can be assigned many todos
  User.hasMany(models.Todo, {
    foreignKey: 'assigneeId',
    as: 'assigned_todos' // Corresponds to 'assignee' in Todo model
  });

  // A user can have many activities
  User.hasMany(models.Activity, {
    foreignKey: 'userId',
    as: 'activities'
  });
};

module.exports = User;
