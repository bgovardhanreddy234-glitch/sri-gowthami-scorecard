const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const FacultyAttendance = sequelize.define('FacultyAttendance', {
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
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  remarks: {
    type: DataTypes.STRING,
    allowNull: true
  },
  faculty_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'faculties',
      key: 'id'
    }
  }
});

module.exports = FacultyAttendance;
