const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Activity = sequelize.define('Activity', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  type: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'e.g., CREATE_TODO, UPDATE_STATUS, ASSIGN_USER, UPDATE_TITLE'
  },
  details: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: 'A human-readable description of the activity.'
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  todoId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Todos',
      key: 'id'
    }
  }
}, {
  timestamps: true
});

Activity.associate = (models) => {
  Activity.belongsTo(models.User, {
    foreignKey: 'userId',
    as: 'user'
  });
  Activity.belongsTo(models.Todo, {
    foreignKey: 'todoId',
    as: 'todo'
  });
};

module.exports = Activity;
