const { Feedback, PerformanceRecord, Faculty, User, Notification, AuditLog, Course, ClassSession, Attendance, Department } = require('../models');
const { calculateScore } = require('../utils/scoreCalculator');
const { Op } = require('sequelize');

// POST /api/feedback - Submit faculty rating (Multidimensional, validated by class session attendance)
exports.createFeedback = async (req, res) => {
  try {
    const student_id = req.user.id;
    const {
      teaching_quality,
      subject_knowledge,
      communication_skills,
      interaction_with_students,
      class_preparation,
      comments,
      academic_year,
      semester,
      class_session_id
    } = req.body;

    // 1. Validation
    if (!class_session_id || teaching_quality === undefined || subject_knowledge === undefined || 
        communication_skills === undefined || interaction_with_students === undefined || 
        class_preparation === undefined || !academic_year || !semester) {
      return res.status(400).json({ error: 'All rating coordinates, academic context, and class session ID are required.' });
    }

    const tq = Number(teaching_quality);
    const sk = Number(subject_knowledge);
    const cs = Number(communication_skills);
    const is = Number(interaction_with_students);
    const cp = Number(class_preparation);

    if ([tq, sk, cs, is, cp].some(v => isNaN(v) || v < 1 || v > 5)) {
      return res.status(400).json({ error: 'Ratings must be integer values between 1 and 5' });
    }

    // 2. Load and validate class session
    const session = await ClassSession.findByPk(class_session_id);
    if (!session) {
      return res.status(404).json({ error: 'Class session not found.' });
    }
    if (session.status !== 'Completed') {
      return res.status(400).json({ error: 'Cannot rate a class session that is not completed.' });
    }

    const faculty_id = session.faculty_id;
    const course_id = session.course_id;

    // 3. Verify or register student's attendance in this session (ensure marked as Present)
    let attendance = await Attendance.findOne({
      where: {
        class_session_id,
        student_id
      }
    });

    if (!attendance) {
      attendance = await Attendance.create({
        status: 'Present',
        class_session_id,
        student_id
      });
    } else if (attendance.status !== 'Present') {
      await attendance.update({ status: 'Present' });
    }

    // 4. Prevent duplicate rating for this class session
    const existing = await Feedback.findOne({
      where: {
        class_session_id,
        student_id
      }
    });

    if (existing) {
      return res.status(400).json({ error: 'You have already submitted feedback for this class session.' });
    }

    const faculty = await Faculty.findByPk(faculty_id);
    if (!faculty) {
      return res.status(404).json({ error: 'Faculty member not found' });
    }

    const course = await Course.findByPk(course_id);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    const todayDate = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

    // 5. Compute overall composite rating average
    const avgRating = (tq + sk + cs + is + cp) / 5;
    const roundedAvgRating = Math.round(avgRating * 100) / 100;

    // 6. Create feedback record
    const feedback = await Feedback.create({
      faculty_id,
      student_id,
      student_feedback_score: roundedAvgRating,
      teaching_quality: tq,
      subject_knowledge: sk,
      communication_skills: cs,
      interaction_with_students: is,
      class_preparation: cp,
      comments: comments || '',
      academic_year,
      semester,
      course_id,
      class_session_id,
      rating_date: todayDate
    });

    // 7. Generate Alert if rating is below 3.0
    if (roundedAvgRating < 3.0) {
      const HODsAndAdmins = await User.findAll({
        where: { role: ['Admin', 'HOD'] }
      });
      for (const user of HODsAndAdmins) {
        if (user.role === 'HOD' && user.department_id !== faculty.department_id) {
          continue;
        }
        await Notification.create({
          user_id: user.id,
          type: 'FEEDBACK_ALERT',
          title: 'Low Student Feedback Alert',
          message: `Student submitted a low rating of ${roundedAvgRating}/5.0 for ${faculty.name} (${faculty.employee_id}) in ${academic_year} ${semester}.`
        });
      }
    }

    // 8. Recalculate global average score for this faculty, academic year, and semester
    const feedbacks = await Feedback.findAll({
      where: { faculty_id, academic_year, semester }
    });

    let sum = 0;
    feedbacks.forEach(f => {
      sum += f.student_feedback_score;
    });
    const avgFeedbackScore = feedbacks.length > 0 ? (sum / feedbacks.length) : roundedAvgRating;
    const roundedGlobalAvg = Math.round(avgFeedbackScore * 100) / 100;

    // 9. Update PerformanceRecord if it exists
    const record = await PerformanceRecord.findOne({
      where: { faculty_id, academic_year, semester }
    });

    if (record) {
      const { performanceScore, kpiRating } = calculateScore({
        attendancePercentage: record.attendance_percentage,
        lessonPlanStatus: record.lesson_plan_status,
        testCorrectionTurnaround: record.test_correction_turnaround,
        studentFeedbackScore: roundedGlobalAvg,
        courseCompletionProgress: record.course_completion_progress || 0
      });

      await record.update({
        student_feedback_score: roundedGlobalAvg,
        performance_score: performanceScore,
        kpi_rating: kpiRating
      });

      // Generate Alert if KPI falls below 60
      if (performanceScore < 60) {
        const HODsAndAdmins = await User.findAll({
          where: { role: ['Admin', 'HOD'] }
        });
        for (const user of HODsAndAdmins) {
          if (user.role === 'HOD' && user.department_id !== faculty.department_id) {
            continue;
          }
          await Notification.create({
            user_id: user.id,
            type: 'KPI_ALERT',
            title: 'Critical KPI Score Alert',
            message: `Faculty member ${faculty.name} (${faculty.employee_id}) has fallen below threshold. New KPI: ${performanceScore}% (${kpiRating})`
          });
        }

        // Notify faculty directly
        if (faculty.user_id) {
          await Notification.create({
            user_id: faculty.user_id,
            type: 'KPI_ALERT',
            title: 'Performance Score Threshold Warning',
            message: `Your overall performance rating for ${academic_year} ${semester} has dropped below threshold: ${performanceScore}% (${kpiRating}).`
          });
        }
      }

      await AuditLog.create({
        user_id: student_id,
        action: 'FEEDBACK_AUTO_RECALCULATE',
        target_table: 'PerformanceRecords',
        target_id: record.id,
        details: `Average feedback score for ${faculty.name} updated to ${roundedGlobalAvg}/5.0 by new student rating. Performance score updated to ${performanceScore}%.`
      });
    }

    return res.status(201).json({ message: 'Feedback submitted successfully', feedback });
  } catch (error) {
    console.error('Create feedback error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /api/feedbacks/pending-sessions - List completed class sessions that the student hasn't rated yet
exports.listPendingSessions = async (req, res) => {
  try {
    const student_id = req.user.id;

    // Get all class sessions the student has already rated
    const ratedSessionIds = await Feedback.findAll({
      where: { student_id },
      attributes: ['class_session_id'],
      raw: true
    }).then(feedbacks => feedbacks.map(f => f.class_session_id).filter(Boolean));

    // Find all completed class sessions not yet rated
    const pendingSessions = await ClassSession.findAll({
      where: {
        status: 'Completed',
        id: { [Op.notIn]: ratedSessionIds.length > 0 ? ratedSessionIds : [-1] }
      },
      include: [
        { model: Course, as: 'course', attributes: ['id', 'name', 'code'] },
        { model: Faculty, as: 'faculty', attributes: ['id', 'name', 'employee_id', 'designation'] }
      ]
    });

    return res.json({ pendingSessions });
  } catch (error) {
    console.error('List pending sessions error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /api/feedback - List current student's feedback submissions or list feedbacks for HOD/Admin
exports.listFeedback = async (req, res) => {
  try {
    const { role, id: userId, departmentId: userDeptId } = req.user;
    
    if (role === 'Student') {
      const feedbacks = await Feedback.findAll({
        where: { student_id: userId },
        include: [
          { model: Faculty, as: 'faculty', attributes: ['name', 'employee_id'] },
          { model: Course, as: 'course', attributes: ['name', 'code'] },
          { model: ClassSession, as: 'classSession', attributes: ['date', 'time_slot'] }
        ],
        order: [['createdAt', 'DESC']]
      });
      return res.json({ feedbacks });
    }

    // For HOD / Admin - list feedbacks within their scope
    const whereClause = {};
    const facultyWhere = {};

    if (role === 'HOD') {
      facultyWhere.department_id = userDeptId;
    }

    const feedbacks = await Feedback.findAll({
      where: whereClause,
      include: [
        { 
          model: Faculty, 
          as: 'faculty', 
          where: Object.keys(facultyWhere).length > 0 ? facultyWhere : undefined,
          include: [{ model: Department, as: 'department' }]
        },
        { model: User, as: 'student', attributes: ['name', 'email'] },
        { model: Course, as: 'course', attributes: ['name', 'code'] },
        { model: ClassSession, as: 'classSession', attributes: ['date', 'time_slot'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    return res.json({ feedbacks });
  } catch (error) {
    console.error('List feedbacks error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
