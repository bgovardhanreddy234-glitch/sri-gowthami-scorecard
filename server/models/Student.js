const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Student = sequelize.define('Student', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  student_id: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isEmail: true
    }
  },
  year: {
    type: DataTypes.ENUM('1st', '2nd', '3rd', '4th'),
    allowNull: false,
    defaultValue: '1st'
  },
  section: {
    type: DataTypes.ENUM('A', 'B', 'C'),
    allowNull: false,
    defaultValue: 'A'
  },
  mobile_number: {
    type: DataTypes.STRING,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('Active', 'Archived'),
    defaultValue: 'Active',
    allowNull: false
  }
});

module.exports = Student;
