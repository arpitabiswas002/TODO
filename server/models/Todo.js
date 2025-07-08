const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Todo = sequelize.define('Todo', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Please enter a title for your todo' },
      len: {
        args: [1, 100],
        msg: 'Todo title cannot exceed 100 characters'
      },
      notIn: {
        args: [['Todo', 'In Progress', 'Done']],
        msg: 'Task title cannot be a column name.'
      }
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    validate: {
      len: {
        args: [0, 500],
        msg: 'Description cannot exceed 500 characters'
      }
    }
  },
  completed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  dueDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  priority: {
    type: DataTypes.ENUM('low', 'medium', 'high'),
    defaultValue: 'medium'
  },
  status: {
    type: DataTypes.ENUM('todo', 'in_progress', 'done'),
    defaultValue: 'todo',
    allowNull: false,
    validate: {
      isIn: {
        args: [['todo', 'in_progress', 'done']],
        msg: 'Status must be either todo, in_progress, or done'
      }
    }
  },
  assigneeId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    }
  }
}, {
  timestamps: true,
  indexes: [
    {
      fields: ['title'],
      using: 'BTREE'
    },

  ]
});

// Define associations
Todo.associate = (models) => {
  Todo.belongsTo(models.User, {
    foreignKey: 'userId',
    as: 'creator'
  });

  Todo.belongsTo(models.User, {
    foreignKey: 'assigneeId',
    as: 'assignee'
  });

  Todo.hasMany(models.Activity, {
    foreignKey: 'todoId',
    as: 'activities',
    onDelete: 'CASCADE',
    hooks: true
  });
};

module.exports = Todo;
