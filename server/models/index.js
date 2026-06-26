const sequelize = require('../config/database');
const Department = require('./Department');
const User = require('./User');
const Faculty = require('./Faculty');
const PerformanceRecord = require('./PerformanceRecord');
const Feedback = require('./Feedback');
const AuditLog = require('./AuditLog');
const Student = require('./Student');
const Notification = require('./Notification');
const Course = require('./Course');
const ClassSession = require('./ClassSession');
const Attendance = require('./Attendance');
const FacultyAttendance = require('./FacultyAttendance');

// Associations

// Department <-> Faculty
Department.hasMany(Faculty, { foreignKey: 'department_id', as: 'faculties', onDelete: 'CASCADE' });
Faculty.belongsTo(Department, { foreignKey: 'department_id', as: 'department' });

// User <-> Department
User.belongsTo(Department, { foreignKey: 'department_id', as: 'department' });
Department.hasMany(User, { foreignKey: 'department_id', as: 'users' });

// User <-> Faculty
User.hasOne(Faculty, { foreignKey: 'user_id', as: 'faculty', onDelete: 'SET NULL' });
Faculty.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// User <-> Student
User.hasOne(Student, { foreignKey: 'user_id', as: 'studentProfile', onDelete: 'CASCADE' });
Student.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Department <-> Student
Department.hasMany(Student, { foreignKey: 'department_id', as: 'students', onDelete: 'CASCADE' });
Student.belongsTo(Department, { foreignKey: 'department_id', as: 'department' });

// User <-> Notification
User.hasMany(Notification, { foreignKey: 'user_id', as: 'notifications', onDelete: 'CASCADE' });
Notification.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Faculty <-> PerformanceRecord
Faculty.hasMany(PerformanceRecord, { foreignKey: 'faculty_id', as: 'performanceRecords', onDelete: 'CASCADE' });
PerformanceRecord.belongsTo(Faculty, { foreignKey: 'faculty_id', as: 'faculty' });

// User <-> PerformanceRecord (creator/updater)
PerformanceRecord.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
PerformanceRecord.belongsTo(User, { foreignKey: 'updated_by', as: 'updater' });

// Faculty <-> Feedback
Faculty.hasMany(Feedback, { foreignKey: 'faculty_id', as: 'feedbacks', onDelete: 'CASCADE' });
Feedback.belongsTo(Faculty, { foreignKey: 'faculty_id', as: 'faculty' });

// User <-> Feedback (Student submissions)
User.hasMany(Feedback, { foreignKey: 'student_id', as: 'studentFeedbacks', onDelete: 'CASCADE' });
Feedback.belongsTo(User, { foreignKey: 'student_id', as: 'student' });

// User <-> AuditLog
User.hasMany(AuditLog, { foreignKey: 'user_id', as: 'auditLogs', onDelete: 'SET NULL' });
AuditLog.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Department <-> Course
Department.hasMany(Course, { foreignKey: 'department_id', as: 'courses', onDelete: 'CASCADE' });
Course.belongsTo(Department, { foreignKey: 'department_id', as: 'department' });

// Faculty <-> Course
Faculty.hasMany(Course, { foreignKey: 'faculty_id', as: 'courses', onDelete: 'SET NULL' });
Course.belongsTo(Faculty, { foreignKey: 'faculty_id', as: 'faculty' });

// Course <-> Feedback
Course.hasMany(Feedback, { foreignKey: 'course_id', as: 'feedbacks', onDelete: 'CASCADE' });
Feedback.belongsTo(Course, { foreignKey: 'course_id', as: 'course' });

// Faculty <-> ClassSession
Faculty.hasMany(ClassSession, { foreignKey: 'faculty_id', as: 'classSessions', onDelete: 'CASCADE' });
ClassSession.belongsTo(Faculty, { foreignKey: 'faculty_id', as: 'faculty' });

// Course <-> ClassSession
Course.hasMany(ClassSession, { foreignKey: 'course_id', as: 'classSessions', onDelete: 'CASCADE' });
ClassSession.belongsTo(Course, { foreignKey: 'course_id', as: 'course' });

// ClassSession <-> Attendance
ClassSession.hasMany(Attendance, { foreignKey: 'class_session_id', as: 'attendances', onDelete: 'CASCADE' });
Attendance.belongsTo(ClassSession, { foreignKey: 'class_session_id', as: 'classSession' });

// User <-> Attendance
User.hasMany(Attendance, { foreignKey: 'student_id', as: 'attendances', onDelete: 'CASCADE' });
Attendance.belongsTo(User, { foreignKey: 'student_id', as: 'student' });

// Faculty <-> FacultyAttendance
Faculty.hasMany(FacultyAttendance, { foreignKey: 'faculty_id', as: 'facultyAttendances', onDelete: 'CASCADE' });
FacultyAttendance.belongsTo(Faculty, { foreignKey: 'faculty_id', as: 'faculty' });

// ClassSession <-> Feedback
ClassSession.hasMany(Feedback, { foreignKey: 'class_session_id', as: 'feedbacks', onDelete: 'SET NULL' });
Feedback.belongsTo(ClassSession, { foreignKey: 'class_session_id', as: 'classSession' });

module.exports = {
  sequelize,
  Department,
  User,
  Faculty,
  PerformanceRecord,
  Feedback,
  AuditLog,
  Student,
  Notification,
  Course,
  ClassSession,
  Attendance,
  FacultyAttendance
};
