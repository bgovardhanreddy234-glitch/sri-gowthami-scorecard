const { FacultyAttendance, Faculty, Department, sequelize } = require('../models');

// POST /api/faculty-attendance/save (Admin only)
exports.saveAttendance = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { date, records } = req.body;

    if (!date || !records || !Array.isArray(records)) {
      return res.status(400).json({ error: 'Invalid parameters. Need date and records array.' });
    }

    // Delete existing attendance for this date
    await FacultyAttendance.destroy({
      where: { date },
      transaction
    });

    // Bulk create new attendance records for marked entries
    const attendanceData = records
      .filter(r => r.status === 'Present' || r.status === 'Absent')
      .map(r => ({
        date,
        faculty_id: r.faculty_id,
        status: r.status,
        remarks: r.remarks || null
      }));

    if (attendanceData.length > 0) {
      await FacultyAttendance.bulkCreate(attendanceData, { transaction });
    }

    await transaction.commit();

    return res.json({ success: true, message: `Attendance for ${date} saved successfully.` });
  } catch (error) {
    await transaction.rollback();
    console.error('Save attendance error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /api/faculty-attendance/daily (Admin only)
exports.getDailyAttendance = async (req, res) => {
  try {
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ error: 'Date query parameter is required.' });
    }

    // Get all active faculty members
    const faculties = await Faculty.findAll({
      where: { status: 'Active' },
      include: [{ model: Department, as: 'department', attributes: ['id', 'name', 'code'] }],
      order: [['name', 'ASC']]
    });

    // Get marked attendance for this date
    const attendanceRecords = await FacultyAttendance.findAll({
      where: { date }
    });

    // Create a map of faculty_id -> attendance details
    const attendanceMap = {};
    attendanceRecords.forEach(rec => {
      attendanceMap[rec.faculty_id] = {
        status: rec.status,
        remarks: rec.remarks
      };
    });

    // Map faculty with their attendance status
    const result = faculties.map(fac => ({
      id: fac.id,
      name: fac.name,
      employee_id: fac.employee_id,
      email: fac.email,
      designation: fac.designation,
      department: fac.department ? fac.department.name : 'N/A',
      department_code: fac.department ? fac.department.code : 'N/A',
      status: attendanceMap[fac.id] ? attendanceMap[fac.id].status : null, // null if not marked
      remarks: attendanceMap[fac.id] ? attendanceMap[fac.id].remarks : '',
      isMarked: !!attendanceMap[fac.id]
    }));

    return res.json({ date, records: result });
  } catch (error) {
    console.error('Get daily attendance error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /api/faculty-attendance/my-summary (Faculty only)
exports.getMyAttendanceSummary = async (req, res) => {
  try {
    const { facultyId } = req.user;

    if (!facultyId) {
      return res.status(400).json({ error: 'Logged-in user is not associated with a faculty profile.' });
    }

    // Find all attendance records for this faculty member
    const history = await FacultyAttendance.findAll({
      where: { faculty_id: facultyId },
      order: [['date', 'DESC']]
    });

    // Calculate metrics
    let presentDays = 0;
    let absentDays = 0;

    history.forEach(rec => {
      if (rec.status === 'Present') {
        presentDays++;
      } else if (rec.status === 'Absent') {
        absentDays++;
      }
    });

    const totalWorkingDays = presentDays + absentDays;
    const attendancePercentage = totalWorkingDays > 0 
      ? Math.round((presentDays / totalWorkingDays) * 1000) / 10 
      : 100.0;

    return res.json({
      summary: {
        presentDays,
        absentDays,
        totalWorkingDays,
        attendancePercentage
      },
      history
    });
  } catch (error) {
    console.error('Get my attendance summary error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
