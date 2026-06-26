const { PerformanceRecord, Faculty, Department, User, AuditLog } = require('../models');
const { calculateScore } = require('../utils/scoreCalculator');
const { Op } = require('sequelize');

// Helper to log audit actions
const logAudit = async (userId, action, table, targetId, details) => {
  try {
    await AuditLog.create({
      user_id: userId,
      action,
      target_table: table,
      target_id: targetId,
      details: typeof details === 'object' ? JSON.stringify(details) : details
    });
  } catch (err) {
    console.error('Audit logging failed:', err);
  }
};

// Helper to check compliance thresholds and emit notifications
const checkComplianceAlerts = async (record, facultyId) => {
  try {
    const { Faculty, User, Notification } = require('../models');
    const faculty = await Faculty.findByPk(facultyId);
    if (!faculty) return;
    
    const alerts = [];
    if (record.attendance_percentage < 75) {
      alerts.push({
        type: 'ATTENDANCE_ALERT',
        title: 'Low Attendance Alert',
        message: `${faculty.name} (${faculty.employee_id}) attendance is below threshold: ${record.attendance_percentage}% (Required: 75%).`
      });
    }
    if (record.lesson_plan_status === 'Not Submitted' || record.lesson_plan_status === 'Submitted Late') {
      alerts.push({
        type: 'LESSON_PLAN_ALERT',
        title: 'Lesson Plan Compliance Alert',
        message: `${faculty.name} (${faculty.employee_id}) lesson plan submission status is "${record.lesson_plan_status}".`
      });
    }
    if (record.test_correction_turnaround === 'Above 7 Days' || record.test_correction_turnaround === 'Delayed' || record.test_correction_turnaround === 'Not Done') {
      alerts.push({
        type: 'TEST_CORRECTION_ALERT',
        title: 'Delayed Test Correction Alert',
        message: `${faculty.name} (${faculty.employee_id}) test correction turnaround is delayed: "${record.test_correction_turnaround}".`
      });
    }
    if (record.student_feedback_score < 3.0) {
      alerts.push({
        type: 'FEEDBACK_ALERT',
        title: 'Low Student Feedback Alert',
        message: `${faculty.name} (${faculty.employee_id}) average student feedback rating is below threshold: ${record.student_feedback_score}/5.0.`
      });
    }
    if (record.performance_score < 60) {
      alerts.push({
        type: 'KPI_ALERT',
        title: 'Critical KPI Score Alert',
        message: `${faculty.name} (${faculty.employee_id}) overall KPI score is critical: ${record.performance_score}% (${record.kpi_rating}).`
      });
    }
    
    if (alerts.length === 0) return;
    
    const recipients = await User.findAll({
      where: {
        role: ['Admin', 'HOD']
      }
    });
    
    for (const alert of alerts) {
      for (const user of recipients) {
        if (user.role === 'HOD' && user.department_id !== faculty.department_id) {
          continue;
        }
        
        // Prevent duplicate alerts
        const exist = await Notification.findOne({
          where: {
            user_id: user.id,
            title: alert.title,
            message: alert.message,
            is_read: false
          }
        });
        if (!exist) {
          await Notification.create({
            user_id: user.id,
            type: alert.type,
            title: alert.title,
            message: alert.message
          });
        }
      }
      
      if (faculty.user_id) {
        const exist = await Notification.findOne({
          where: {
            user_id: faculty.user_id,
            title: alert.title,
            message: alert.message,
            is_read: false
          }
        });
        if (!exist) {
          await Notification.create({
            user_id: faculty.user_id,
            type: alert.type,
            title: alert.title,
            message: alert.message
          });
        }
      }
    }
  } catch (err) {
    console.error('Compliance alerts check failed:', err);
  }
};

// GET /api/performance - List records
exports.listRecords = async (req, res) => {
  try {
    const { departmentId, academicYear, semester, search } = req.query;
    const { role, facultyId, departmentId: userDeptId } = req.user;

    const whereClause = {};
    const facultyWhere = {};

    // 1. Role-based restrictions
    if (role === 'Faculty') {
      whereClause.faculty_id = facultyId;
    } else if (role === 'HOD') {
      facultyWhere.department_id = userDeptId;
    } else if (role === 'Admin') {
      if (departmentId) {
        facultyWhere.department_id = departmentId;
      }
    }

    // 2. Query Filters
    if (academicYear) {
      whereClause.academic_year = academicYear;
    }
    if (semester) {
      whereClause.semester = semester;
    }

    // 3. Search Filter (Faculty Name or Employee ID)
    if (search) {
      facultyWhere[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { employee_id: { [Op.like]: `%${search}%` } }
      ];
    }

    const records = await PerformanceRecord.findAll({
      where: whereClause,
      include: [
        {
          model: Faculty,
          as: 'faculty',
          where: Reflect.ownKeys(facultyWhere).length > 0 ? facultyWhere : undefined,
          include: [{ model: Department, as: 'department' }]
        },
        { model: User, as: 'creator', attributes: ['username'] }
      ],
      order: [['created_at', 'DESC']]
    });

    return res.json({ records });
  } catch (error) {
    console.error('List records error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /api/performance/:id - Detail record
exports.getRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, facultyId, departmentId: userDeptId } = req.user;

    const record = await PerformanceRecord.findByPk(id, {
      include: [
        {
          model: Faculty,
          as: 'faculty',
          include: [{ model: Department, as: 'department' }]
        },
        { model: User, as: 'creator', attributes: ['username'] },
        { model: User, as: 'updater', attributes: ['username'] }
      ]
    });

    if (!record) {
      return res.status(404).json({ error: 'Performance record not found' });
    }

    // Access enforcement
    if (role === 'Faculty' && record.faculty_id !== facultyId) {
      return res.status(403).json({ error: 'Unauthorized: You can only view your own records' });
    }
    if (role === 'HOD' && record.faculty.department_id !== userDeptId) {
      return res.status(403).json({ error: 'Unauthorized: You can only view records in your own department' });
    }

    // Fetch faculty historical records for trend
    const history = await PerformanceRecord.findAll({
      where: { faculty_id: record.faculty_id },
      order: [['academic_year', 'ASC'], ['semester', 'ASC']],
      attributes: ['id', 'academic_year', 'semester', 'performance_score', 'kpi_rating']
    });

    return res.json({ record, history });
  } catch (error) {
    console.error('Get record error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// POST /api/performance - Create record
exports.createRecord = async (req, res) => {
  try {
    const { role, id: userId, departmentId: userDeptId } = req.user;
    const {
      faculty_id,
      attendance_percentage,
      lesson_plan_status,
      test_correction_turnaround,
      student_feedback_score,
      course_completion_progress,
      academic_year,
      semester,
      remarks,
      status
    } = req.body;

    // Validation
    if (!faculty_id || attendance_percentage === undefined || !lesson_plan_status || !test_correction_turnaround || student_feedback_score === undefined || !academic_year || !semester) {
      return res.status(400).json({ error: 'All fields are required except remarks' });
    }

    const attVal = Number(attendance_percentage);
    if (isNaN(attVal) || attVal < 0 || attVal > 100) {
      return res.status(400).json({ error: 'Attendance percentage must be between 0 and 100' });
    }

    const feedVal = Number(student_feedback_score);
    if (isNaN(feedVal) || feedVal < 1.0 || feedVal > 5.0) {
      return res.status(400).json({ error: 'Student feedback score must be between 1.0 and 5.0' });
    }

    const progressVal = course_completion_progress !== undefined ? Number(course_completion_progress) : 0;
    if (isNaN(progressVal) || progressVal < 0 || progressVal > 100) {
      return res.status(400).json({ error: 'Course completion progress must be a percentage between 0 and 100' });
    }

    const faculty = await Faculty.findByPk(faculty_id);
    if (!faculty) {
      return res.status(404).json({ error: 'Faculty member not found' });
    }

    // HOD validation
    if (role === 'HOD' && faculty.department_id !== userDeptId) {
      return res.status(403).json({ error: 'Unauthorized: You can only enter scores for your own department' });
    }

    // Check duplicate record for same Faculty, Academic Year, Semester
    const existing = await PerformanceRecord.findOne({
      where: {
        faculty_id,
        academic_year,
        semester
      }
    });
    if (existing) {
      return res.status(400).json({ error: `A scorecard already exists for this faculty for ${academic_year} ${semester}.` });
    }

    // Calculate performance score and rating
    const { performanceScore, kpiRating } = calculateScore({
      attendancePercentage: attVal,
      lessonPlanStatus: lesson_plan_status,
      testCorrectionTurnaround: test_correction_turnaround,
      studentFeedbackScore: feedVal,
      courseCompletionProgress: progressVal
    });

    const record = await PerformanceRecord.create({
      faculty_id,
      attendance_percentage: attVal,
      lesson_plan_status,
      test_correction_turnaround,
      student_feedback_score: feedVal,
      course_completion_progress: progressVal,
      performance_score: performanceScore,
      kpi_rating: kpiRating,
      academic_year,
      semester,
      remarks,
      status: status || 'Active',
      created_by: userId
    });

    await logAudit(userId, 'CREATE_RECORD', 'PerformanceRecords', record.id, record);
    await checkComplianceAlerts(record, record.faculty_id);

    return res.status(201).json({ message: 'Performance record created successfully', record });
  } catch (error) {
    console.error('Create record error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// PUT /api/performance/:id - Update record
exports.updateRecord = async (req, res) => {
  try {
    const { role, id: userId, departmentId: userDeptId } = req.user;
    const { id } = req.params;
    const {
      attendance_percentage,
      lesson_plan_status,
      test_correction_turnaround,
      student_feedback_score,
      course_completion_progress,
      academic_year,
      semester,
      remarks,
      status
    } = req.body;

    const record = await PerformanceRecord.findByPk(id, {
      include: [{ model: Faculty, as: 'faculty' }]
    });

    if (!record) {
      return res.status(404).json({ error: 'Performance record not found' });
    }

    // Access checks
    if (role === 'HOD' && record.faculty.department_id !== userDeptId) {
      return res.status(403).json({ error: 'Unauthorized: You can only edit records in your own department' });
    }

    // Validation
    const attVal = attendance_percentage !== undefined ? Number(attendance_percentage) : record.attendance_percentage;
    if (attVal < 0 || attVal > 100) {
      return res.status(400).json({ error: 'Attendance percentage must be between 0 and 100' });
    }

    const feedVal = student_feedback_score !== undefined ? Number(student_feedback_score) : record.student_feedback_score;
    if (feedVal < 1.0 || feedVal > 5.0) {
      return res.status(400).json({ error: 'Student feedback score must be between 1.0 and 5.0' });
    }

    const progressVal = course_completion_progress !== undefined ? Number(course_completion_progress) : record.course_completion_progress;
    if (progressVal < 0 || progressVal > 100) {
      return res.status(400).json({ error: 'Course completion progress must be between 0 and 100' });
    }

    // If changing academic year or semester, check duplicate
    if ((academic_year && academic_year !== record.academic_year) || (semester && semester !== record.semester)) {
      const checkAY = academic_year || record.academic_year;
      const checkSem = semester || record.semester;
      const duplicate = await PerformanceRecord.findOne({
        where: {
          id: { [Op.ne]: id },
          faculty_id: record.faculty_id,
          academic_year: checkAY,
          semester: checkSem
        }
      });
      if (duplicate) {
        return res.status(400).json({ error: `A record already exists for ${checkAY} ${checkSem}.` });
      }
    }

    // Re-calculate
    const { performanceScore, kpiRating } = calculateScore({
      attendancePercentage: attVal,
      lessonPlanStatus: lesson_plan_status || record.lesson_plan_status,
      testCorrectionTurnaround: test_correction_turnaround || record.test_correction_turnaround,
      studentFeedbackScore: feedVal,
      courseCompletionProgress: progressVal
    });

    const oldRecordData = { ...record.get({ plain: true }) };

    await record.update({
      attendance_percentage: attVal,
      lesson_plan_status: lesson_plan_status || record.lesson_plan_status,
      test_correction_turnaround: test_correction_turnaround || record.test_correction_turnaround,
      student_feedback_score: feedVal,
      course_completion_progress: progressVal,
      performance_score: performanceScore,
      kpi_rating: kpiRating,
      academic_year: academic_year || record.academic_year,
      semester: semester || record.semester,
      remarks: remarks !== undefined ? remarks : record.remarks,
      status: status || record.status,
      updated_by: userId
    });

    await logAudit(userId, 'UPDATE_RECORD', 'PerformanceRecords', record.id, {
      old: oldRecordData,
      new: record.get({ plain: true })
    });
    await checkComplianceAlerts(record, record.faculty_id);

    return res.json({ message: 'Performance record updated successfully', record });
  } catch (error) {
    console.error('Update record error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// DELETE /api/performance/:id - Delete record
exports.deleteRecord = async (req, res) => {
  try {
    const { role, id: userId } = req.user;
    const { id } = req.params;

    // Only Admin can delete
    if (role !== 'Admin') {
      return res.status(403).json({ error: 'Unauthorized: Only administrators can delete records' });
    }

    const record = await PerformanceRecord.findByPk(id);
    if (!record) {
      return res.status(404).json({ error: 'Performance record not found' });
    }

    await logAudit(userId, 'DELETE_RECORD', 'PerformanceRecords', id, record);
    await record.destroy();

    return res.json({ message: 'Performance record deleted successfully' });
  } catch (error) {
    console.error('Delete record error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
