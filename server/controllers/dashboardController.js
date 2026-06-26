const { PerformanceRecord, Faculty, Department, User, Feedback, Course, Attendance } = require('../models');
const sequelize = require('../config/database');
const { Op } = require('sequelize');

// GET /api/dashboard/summary - High-level metrics & alerts
exports.getDashboardSummary = async (req, res) => {
  try {
    const { role, facultyId, departmentId: userDeptId } = req.user;

    const recordWhere = {};
    const facultyWhere = {};

    // Role restrictions
    if (role === 'Faculty') {
      recordWhere.faculty_id = facultyId;
    } else if (role === 'HOD') {
      facultyWhere.department_id = userDeptId;
    }

    // 1. Total Faculty Count
    const totalFaculty = await Faculty.count({ where: facultyWhere });

    // 2. Average Score & Rating Distribution
    const performanceStats = await PerformanceRecord.findAll({
      where: recordWhere,
      include: [
        {
          model: Faculty,
          as: 'faculty',
          where: Object.keys(facultyWhere).length > 0 ? facultyWhere : undefined
        }
      ],
      attributes: [
        [sequelize.fn('AVG', sequelize.col('performance_score')), 'avgScore'],
        [sequelize.fn('AVG', sequelize.col('attendance_percentage')), 'avgAttendance'],
        [sequelize.fn('AVG', sequelize.col('student_feedback_score')), 'avgFeedback'],
        'kpi_rating'
      ],
      group: ['kpi_rating'],
      raw: true
    });

    let totalScoreSum = 0;
    let recordsCount = 0;
    const ratingDistribution = {
      'Excellent': 0,
      'Very Good': 0,
      'Good': 0,
      'Average': 0,
      'Needs Improvement': 0
    };

    performanceStats.forEach(stat => {
      const rating = stat.kpi_rating;
      // Note: SQLite/MySQL avg returns might be string or float. Grouped queries count matches.
      // We will count the exact records for distribution separately to avoid issues with averages in group by.
    });

    const allRecords = await PerformanceRecord.findAll({
      where: recordWhere,
      include: [
        {
          model: Faculty,
          as: 'faculty',
          where: Object.keys(facultyWhere).length > 0 ? facultyWhere : undefined,
          include: [{ model: Department, as: 'department' }]
        }
      ]
    });

    let sumScore = 0;
    let sumAttendance = 0;
    let sumFeedback = 0;

    allRecords.forEach(r => {
      sumScore += r.performance_score;
      sumAttendance += r.attendance_percentage;
      sumFeedback += r.student_feedback_score;
      recordsCount++;
      if (ratingDistribution[r.kpi_rating] !== undefined) {
        ratingDistribution[r.kpi_rating]++;
      }
    });

    const avgScore = recordsCount > 0 ? Math.round((sumScore / recordsCount) * 100) / 100 : 0;
    const avgAttendance = recordsCount > 0 ? Math.round((sumAttendance / recordsCount) * 100) / 100 : 0;
    const avgFeedback = recordsCount > 0 ? Math.round((sumFeedback / recordsCount) * 100) / 100 : 0;

    // 3. Top Performers (Top 5)
    const topPerformers = allRecords
      .slice()
      .sort((a, b) => b.performance_score - a.performance_score)
      .slice(0, 5)
      .map(r => ({
        id: r.id,
        facultyName: r.faculty.name,
        department: r.faculty.department.code,
        score: r.performance_score,
        rating: r.kpi_rating
      }));

    // 4. Low Performance Alerts (Based on threshold parameters)
    const alerts = [];
    allRecords.forEach(r => {
      if (r.status === 'Active' || r.status === 'Completed') {
        // Attendance alert (<75%)
        if (r.attendance_percentage < 75) {
          alerts.push({
            type: 'Low Attendance',
            severity: r.attendance_percentage < 65 ? 'high' : 'medium',
            facultyName: r.faculty.name,
            employeeId: r.faculty.employee_id,
            department: r.faculty.department.code,
            value: `${r.attendance_percentage}%`,
            message: `Attendance has fallen to ${r.attendance_percentage}% (threshold: 75%).`
          });
        }
        // Missing lesson plan
        if (r.lesson_plan_status === 'Not Submitted') {
          alerts.push({
            type: 'Missing Lesson Plan',
            severity: 'high',
            facultyName: r.faculty.name,
            employeeId: r.faculty.employee_id,
            department: r.faculty.department.code,
            value: 'Not Submitted',
            message: 'Lesson plan has not been submitted for evaluation.'
          });
        }
        // Delayed test correction
        if (r.test_correction_turnaround === 'Not Done' || r.test_correction_turnaround === 'Above 7 Days') {
          alerts.push({
            type: 'Delayed Test Correction',
            severity: r.test_correction_turnaround === 'Not Done' ? 'high' : 'medium',
            facultyName: r.faculty.name,
            employeeId: r.faculty.employee_id,
            department: r.faculty.department.code,
            value: r.test_correction_turnaround,
            message: `Test correction timeline is ${r.test_correction_turnaround}.`
          });
        }
        // Poor feedback score (<3.5)
        if (r.student_feedback_score < 3.5) {
          alerts.push({
            type: 'Poor Feedback Score',
            severity: r.student_feedback_score < 3.0 ? 'high' : 'medium',
            facultyName: r.faculty.name,
            employeeId: r.faculty.employee_id,
            department: r.faculty.department.code,
            value: `${r.student_feedback_score}/5.0`,
            message: `Student feedback score is low: ${r.student_feedback_score}/5.0.`
          });
        }
      }
    });

    return res.json({
      summary: {
        totalFaculty,
        recordsCount,
        avgScore,
        avgAttendance,
        avgFeedback,
        ratingDistribution,
        topPerformers,
        alertsCount: alerts.length,
        alerts
      }
    });
  } catch (error) {
    console.error('Dashboard summary error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /api/reports/summary - Advanced reporting analytics
exports.getReportsSummary = async (req, res) => {
  try {
    const { academicYear, semester } = req.query;

    const whereClause = {};
    if (academicYear) whereClause.academic_year = academicYear;
    if (semester) whereClause.semester = semester;

    // Fetch all departments
    const departments = await Department.findAll();

    // Group performance data by department
    const records = await PerformanceRecord.findAll({
      where: whereClause,
      include: [
        {
          model: Faculty,
          as: 'faculty',
          include: [{ model: Department, as: 'department' }]
        }
      ]
    });

    // Compute department-wise statistics
    const departmentComparison = departments.map(dept => {
      const deptRecords = records.filter(r => r.faculty.department_id === dept.id);
      const count = deptRecords.length;

      let scoreSum = 0;
      let attSum = 0;
      let feedSum = 0;

      deptRecords.forEach(r => {
        scoreSum += r.performance_score;
        attSum += r.attendance_percentage;
        feedSum += r.student_feedback_score;
      });

      return {
        id: dept.id,
        name: dept.name,
        code: dept.code,
        facultyCount: count,
        avgPerformanceScore: count > 0 ? Math.round((scoreSum / count) * 100) / 100 : 0,
        avgAttendance: count > 0 ? Math.round((attSum / count) * 100) / 100 : 0,
        avgFeedbackScore: count > 0 ? Math.round((feedSum / count) * 100) / 100 : 0
      };
    });

    // Faculty rankings
    const rankings = records
      .map(r => ({
        id: r.id,
        facultyName: r.faculty.name,
        employeeId: r.faculty.employee_id,
        department: r.faculty.department.name,
        departmentCode: r.faculty.department.code,
        attendance: r.attendance_percentage,
        feedback: r.student_feedback_score,
        score: r.performance_score,
        rating: r.kpi_rating,
        academicYear: r.academic_year,
        semester: r.semester
      }))
      .sort((a, b) => b.score - a.score);

    // Distribution by KPI rating
    const kpiDistribution = {
      'Excellent': 0,
      'Very Good': 0,
      'Good': 0,
      'Average': 0,
      'Needs Improvement': 0
    };
    records.forEach(r => {
      if (kpiDistribution[r.kpi_rating] !== undefined) {
        kpiDistribution[r.kpi_rating]++;
      }
    });

    // Format charts data
    const kpiChartData = Object.keys(kpiDistribution).map(key => ({
      name: key,
      value: kpiDistribution[key]
    }));

    // 1. Calculate courseFacultyRatings (average rating for each Faculty/Course combo)
    const feedbackWhere = {};
    if (academicYear) feedbackWhere.academic_year = academicYear;
    if (semester) feedbackWhere.semester = semester;

    const courseRatings = await Feedback.findAll({
      where: feedbackWhere,
      attributes: [
        'course_id',
        'faculty_id',
        [sequelize.fn('AVG', sequelize.col('Feedback.student_feedback_score')), 'avgRating'],
        [sequelize.fn('COUNT', sequelize.col('Feedback.id')), 'count']
      ],
      group: [sequelize.col('Feedback.course_id'), sequelize.col('Feedback.faculty_id')],
      include: [
        { model: Course, as: 'course', attributes: ['name', 'code'] },
        { model: Faculty, as: 'faculty', attributes: ['name', 'employee_id'] }
      ]
    });

    const courseFacultyRatings = courseRatings.map(cr => ({
      courseName: cr.course ? cr.course.name : 'Unknown',
      courseCode: cr.course ? cr.course.code : 'Unknown',
      facultyName: cr.faculty ? cr.faculty.name : 'Unknown',
      facultyEmployeeId: cr.faculty ? cr.faculty.employee_id : 'Unknown',
      avgRating: cr.getDataValue('avgRating') ? Math.round(Number(cr.getDataValue('avgRating')) * 100) / 100 : 0,
      count: cr.getDataValue('count')
    }));

    // 2. Calculate dailyFeedbacks (count and avg rating per day)
    const dailyFeedbacksRaw = await Feedback.findAll({
      where: feedbackWhere,
      attributes: [
        'rating_date',
        [sequelize.fn('COUNT', sequelize.col('Feedback.id')), 'count'],
        [sequelize.fn('AVG', sequelize.col('student_feedback_score')), 'avgRating']
      ],
      group: ['rating_date'],
      order: [['rating_date', 'ASC']]
    });

    const dailyFeedbacks = dailyFeedbacksRaw.map(df => ({
      date: df.rating_date,
      count: df.getDataValue('count'),
      avgRating: df.getDataValue('avgRating') ? Math.round(Number(df.getDataValue('avgRating')) * 100) / 100 : 0
    }));

    // 3. Calculate monthlyTrends (group feedbacks JS-side by YYYY-MM to be DB-agnostic)
    const allFeedbacks = await Feedback.findAll({
      where: feedbackWhere,
      attributes: ['rating_date', 'student_feedback_score'],
      order: [['rating_date', 'ASC']]
    });

    const monthGroups = {};
    allFeedbacks.forEach(f => {
      if (!f.rating_date) return;
      const monthStr = f.rating_date.substring(0, 7); // "YYYY-MM"
      if (!monthGroups[monthStr]) {
        monthGroups[monthStr] = { sum: 0, count: 0 };
      }
      monthGroups[monthStr].sum += f.student_feedback_score;
      monthGroups[monthStr].count++;
    });

    const monthlyTrends = Object.keys(monthGroups).map(month => ({
      month,
      avgRating: Math.round((monthGroups[month].sum / monthGroups[month].count) * 100) / 100,
      count: monthGroups[month].count
    })).sort((a, b) => a.month.localeCompare(b.month));

    // 4. Calculate participationRate (attendance rate)
    const totalAttendanceCount = await Attendance.count();
    const presentAttendanceCount = await Attendance.count({ where: { status: 'Present' } });
    const participationRate = totalAttendanceCount > 0
      ? Math.round((presentAttendanceCount / totalAttendanceCount) * 10000) / 100
      : 100.0;

    return res.json({
      departmentComparison,
      rankings,
      kpiChartData,
      courseFacultyRatings,
      dailyFeedbacks,
      monthlyTrends,
      participationRate,
      totalRecordsCount: records.length
    });
  } catch (error) {
    console.error('Reports summary error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
