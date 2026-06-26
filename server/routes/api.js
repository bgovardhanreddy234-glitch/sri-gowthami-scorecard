const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const performanceController = require('../controllers/performanceController');
const dashboardController = require('../controllers/dashboardController');
const facultyController = require('../controllers/facultyController');
const feedbackController = require('../controllers/feedbackController');
const adminController = require('../controllers/adminController');
const notificationController = require('../controllers/notificationController');
const attendanceController = require('../controllers/attendanceController');
const { authenticateToken, requireRole } = require('../middleware/auth');

// Auth routes
router.post('/auth/login', authController.login);
router.post('/auth/register', authController.register);
router.get('/auth/me', authenticateToken, authController.me);

// Student feedback / rating routes
router.post('/feedback', authenticateToken, requireRole(['Student']), feedbackController.createFeedback);
router.post('/feedbacks', authenticateToken, requireRole(['Student']), feedbackController.createFeedback);
router.get('/feedback', authenticateToken, feedbackController.listFeedback);
router.get('/feedbacks', authenticateToken, feedbackController.listFeedback);
router.get('/feedbacks/my', authenticateToken, requireRole(['Student']), feedbackController.listFeedback);
router.get('/feedbacks/pending-sessions', authenticateToken, requireRole(['Student']), feedbackController.listPendingSessions);

// Notifications routes
router.get('/notifications', authenticateToken, notificationController.listNotifications);
router.put('/notifications/:id/read', authenticateToken, notificationController.markAsRead);
router.post('/notifications/read-all', authenticateToken, notificationController.markAllAsRead);
router.delete('/notifications', authenticateToken, notificationController.clearAllNotifications);

// HOD Management (Admin only)
router.get('/hods', authenticateToken, requireRole(['Admin']), adminController.listHODs);
router.post('/hods', authenticateToken, requireRole(['Admin']), adminController.createHOD);
router.put('/hods/:id', authenticateToken, requireRole(['Admin']), adminController.updateHOD);
router.delete('/hods/:id', authenticateToken, requireRole(['Admin']), adminController.deleteHOD);

// Student Management (Admin only)
router.get('/students', authenticateToken, requireRole(['Admin']), adminController.listStudents);
router.post('/students', authenticateToken, requireRole(['Admin']), adminController.createStudent);
router.put('/students/:id', authenticateToken, requireRole(['Admin']), adminController.updateStudent);
router.delete('/students/:id', authenticateToken, requireRole(['Admin']), adminController.deleteStudent);

// Faculty Management (Admin only CRUD actions)
router.get('/faculty/all', authenticateToken, requireRole(['Admin']), adminController.listAllFaculty);
router.post('/faculty', authenticateToken, requireRole(['Admin']), adminController.createFaculty);
router.put('/faculty/:id', authenticateToken, requireRole(['Admin']), adminController.updateFaculty);
router.delete('/faculty/:id', authenticateToken, requireRole(['Admin']), adminController.deleteFaculty);

// Department Management (Admin only CRUD actions)
router.post('/departments', authenticateToken, requireRole(['Admin']), adminController.createDepartment);
router.put('/departments/:id', authenticateToken, requireRole(['Admin']), adminController.updateDepartment);
router.delete('/departments/:id', authenticateToken, requireRole(['Admin']), adminController.deleteDepartment);

// Course Management (Admin CRUD, open GET for authorized roles)
router.get('/courses', authenticateToken, adminController.listCourses);
router.post('/courses', authenticateToken, requireRole(['Admin']), adminController.createCourse);
router.put('/courses/:id', authenticateToken, requireRole(['Admin']), adminController.updateCourse);
router.delete('/courses/:id', authenticateToken, requireRole(['Admin']), adminController.deleteCourse);

// Public endpoints
router.get('/public/departments', facultyController.listDepartments);

// Dashboard & Reports
router.get('/dashboard/summary', authenticateToken, dashboardController.getDashboardSummary);
router.get('/reports/summary', authenticateToken, dashboardController.getReportsSummary);

// Performance records
router.get('/performance', authenticateToken, performanceController.listRecords);
router.get('/performance/:id', authenticateToken, performanceController.getRecord);
router.post('/performance', authenticateToken, requireRole(['Admin', 'HOD']), performanceController.createRecord);
router.put('/performance/:id', authenticateToken, requireRole(['Admin', 'HOD']), performanceController.updateRecord);
router.delete('/performance/:id', authenticateToken, requireRole(['Admin']), performanceController.deleteRecord);

// Faculty & Departments
router.get('/faculty', authenticateToken, facultyController.listFaculty);
router.get('/faculty/:id/history', authenticateToken, facultyController.getFacultyHistory);
router.get('/departments', authenticateToken, facultyController.listDepartments);
router.get('/academic-directory', authenticateToken, facultyController.getAcademicDirectory);
router.get('/faculty/:id/scorecard-suggestions', authenticateToken, facultyController.getScorecardSuggestions);

// Audit logs
router.get('/audit-logs', authenticateToken, requireRole(['Admin']), facultyController.listAuditLogs);
router.get('/auditlogs', authenticateToken, requireRole(['Admin']), facultyController.listAuditLogs);

// Faculty Attendance
router.get('/faculty-attendance/daily', authenticateToken, requireRole(['Admin']), attendanceController.getDailyAttendance);
router.post('/faculty-attendance/save', authenticateToken, requireRole(['Admin']), attendanceController.saveAttendance);
router.get('/faculty-attendance/my-summary', authenticateToken, requireRole(['Faculty']), attendanceController.getMyAttendanceSummary);

module.exports = router;

