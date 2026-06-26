const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Attendance = sequelize.define('Attendance', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  status: {
    type: DataTypes.ENUM('Present', 'Absent'),
    defaultValue: 'Present',
    allowNull: false
  },
  class_session_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'class_sessions',
      key: 'id'
    }
  },
  student_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  }
});

module.exports = Attendance;
