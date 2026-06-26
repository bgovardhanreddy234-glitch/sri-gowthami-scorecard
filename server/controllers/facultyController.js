const { Faculty, Department, PerformanceRecord, AuditLog, User, Course, Feedback, ClassSession, sequelize } = require('../models');

exports.listFaculty = async (req, res) => {
  try {
    const { departmentId } = req.query;
    const whereClause = { status: 'Active' };
    
    if (departmentId) {
      whereClause.department_id = departmentId;
    }

    const faculties = await Faculty.findAll({
      where: whereClause,
      include: [{ model: Department, as: 'department' }],
      order: [['name', 'ASC']]
    });

    return res.json({ faculties });
  } catch (error) {
    console.error('List faculty error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getFacultyHistory = async (req, res) => {
  try {
    const { id } = req.params;

    const faculty = await Faculty.findByPk(id, {
      include: [{ model: Department, as: 'department' }]
    });

    if (!faculty) {
      return res.status(404).json({ error: 'Faculty member not found' });
    }

    const records = await PerformanceRecord.findAll({
      where: { faculty_id: id },
      order: [['academic_year', 'ASC'], ['semester', 'ASC']],
      include: [
        { model: User, as: 'creator', attributes: ['username'] },
        { model: User, as: 'updater', attributes: ['username'] }
      ]
    });

    // Calculate dynamic Department Rank
    let departmentRank = 'N/A';
    if (faculty.department_id) {
      const allDeptFaculties = await Faculty.findAll({
        where: { department_id: faculty.department_id, status: 'Active' },
        attributes: ['id']
      });
      const deptFacultyIds = allDeptFaculties.map(f => f.id);

      const latestRecords = await PerformanceRecord.findAll({
        where: { faculty_id: deptFacultyIds },
        order: [['academic_year', 'DESC'], ['semester', 'DESC']]
      });

      // Filter to keep only the absolute latest record per faculty
      const latestByFaculty = {};
      latestRecords.forEach(rec => {
        if (!latestByFaculty[rec.faculty_id]) {
          latestByFaculty[rec.faculty_id] = rec;
        }
      });

      const sortedPerformers = Object.values(latestByFaculty).sort((a, b) => b.performance_score - a.performance_score);
      const ourLatest = records.length > 0 ? records[records.length - 1] : null;

      if (ourLatest) {
        const distinctScores = [...new Set(sortedPerformers.map(r => r.performance_score))];
        const scoreIdx = distinctScores.indexOf(ourLatest.performance_score);
        departmentRank = scoreIdx !== -1 ? `#${scoreIdx + 1}` : '#1';
      }
    }

    return res.json({ faculty, records, departmentRank });
  } catch (error) {
    console.error('Faculty history error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

exports.listDepartments = async (req, res) => {
  try {
    const departments = await Department.findAll({
      order: [['name', 'ASC']]
    });
    return res.json({ departments });
  } catch (error) {
    console.error('List departments error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

exports.listAuditLogs = async (req, res) => {
  try {
    const logs = await AuditLog.findAll({
      include: [{ model: User, as: 'user', attributes: ['username', 'role'] }],
      order: [['created_at', 'DESC']],
      limit: 100
    });
    return res.json({ logs });
  } catch (error) {
    console.error('List audit logs error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getAcademicDirectory = async (req, res) => {
  try {
    const departments = await Department.findAll({
      include: [
        {
          model: Faculty,
          as: 'faculties',
          where: { status: 'Active' },
          required: false,
          include: [
            {
              model: Course,
              as: 'courses'
            }
          ]
        }
      ],
      order: [
        ['name', 'ASC'],
        [{ model: Faculty, as: 'faculties' }, 'name', 'ASC']
      ]
    });
    return res.json({ departments });
  } catch (error) {
    console.error('Academic directory error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getScorecardSuggestions = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Calculate Average Student Feedback Score
    const feedbackStats = await Feedback.findOne({
      where: { faculty_id: id },
      attributes: [
        [sequelize.fn('AVG', sequelize.col('student_feedback_score')), 'avgFeedback'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      raw: true
    });

    let avgFeedback = 4.0; // Default fallback
    if (feedbackStats && feedbackStats.count > 0 && feedbackStats.avgFeedback) {
      avgFeedback = Math.round(Number(feedbackStats.avgFeedback) * 100) / 100;
    }

    // 2. Calculate Faculty Attendance (from FacultyAttendance daily records)
    const totalSessions = await FacultyAttendance.count({ where: { faculty_id: id } });
    const completedSessions = await FacultyAttendance.count({ where: { faculty_id: id, status: 'Present' } });

    let attendancePercentage = 95.0; // Default fallback
    if (totalSessions > 0) {
      attendancePercentage = Math.round((completedSessions / totalSessions) * 1000) / 10;
    }

    // 3. Calculate Course Completion Progress
    // We can assume a standard course has 5 completed class sessions as target.
    let courseProgress = 90.0; // Default fallback
    if (completedSessions > 0) {
      courseProgress = Math.min(100.0, Math.round((completedSessions / 5) * 1000) / 10);
    }

    return res.json({
      attendance_percentage: attendancePercentage,
      student_feedback_score: avgFeedback,
      course_completion_progress: courseProgress
    });
  } catch (error) {
    console.error('Scorecard suggestions error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

