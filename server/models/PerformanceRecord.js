const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PerformanceRecord = sequelize.define('PerformanceRecord', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  attendance_percentage: {
    type: DataTypes.FLOAT,
    allowNull: false,
    validate: {
      min: 0,
      max: 100
    }
  },
  lesson_plan_status: {
    type: DataTypes.ENUM('Submitted on Time', 'Submitted Late', 'Not Submitted'),
    allowNull: false
  },
  test_correction_turnaround: {
    type: DataTypes.ENUM('1-3 Days', '4-7 Days', 'Above 7 Days', 'Not Done'),
    allowNull: false
  },
  student_feedback_score: {
    type: DataTypes.FLOAT,
    allowNull: false,
    validate: {
      min: 1.0,
      max: 5.0
    }
  },
  course_completion_progress: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 0.0,
    validate: {
      min: 0.0,
      max: 100.0
    }
  },
  performance_score: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  kpi_rating: {
    type: DataTypes.ENUM('Excellent', 'Very Good', 'Good', 'Average', 'Needs Improvement'),
    allowNull: false
  },
  academic_year: {
    type: DataTypes.STRING,
    allowNull: false
  },
  semester: {
    type: DataTypes.ENUM('Semester 1', 'Semester 2'),
    allowNull: false
  },
  remarks: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('Active', 'Completed', 'Archived'),
    defaultValue: 'Active',
    allowNull: false
  }
});

module.exports = PerformanceRecord;
