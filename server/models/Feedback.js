const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Feedback = sequelize.define('Feedback', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  student_feedback_score: {
    type: DataTypes.FLOAT,
    allowNull: false,
    validate: {
      min: 1.0,
      max: 5.0
    }
  },
  teaching_quality: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 5,
    validate: { min: 1, max: 5 }
  },
  subject_knowledge: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 5,
    validate: { min: 1, max: 5 }
  },
  communication_skills: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 5,
    validate: { min: 1, max: 5 }
  },
  interaction_with_students: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 5,
    validate: { min: 1, max: 5 }
  },
  class_preparation: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 5,
    validate: { min: 1, max: 5 }
  },
  comments: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  academic_year: {
    type: DataTypes.STRING,
    allowNull: false
  },
  semester: {
    type: DataTypes.ENUM('Semester 1', 'Semester 2'),
    allowNull: false
  },
  student_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  course_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'courses',
      key: 'id'
    }
  },
  class_session_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'class_sessions',
      key: 'id'
    }
  },
  rating_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
});

module.exports = Feedback;
