const bcrypt = require('bcryptjs');
const { User, Faculty, Student, Department, AuditLog, Course } = require('../models');

// Helper to log audit actions
const logAdminAction = async (userId, action, table, targetId, details) => {
  try {
    await AuditLog.create({
      user_id: userId,
      action,
      target_table: table,
      target_id: targetId,
      details: typeof details === 'object' ? JSON.stringify(details) : details
    });
  } catch (err) {
    console.error('Admin audit logging failed:', err);
  }
};

const generateUniqueUsername = async (name) => {
  if (!name) return 'user';
  let baseUsername = name.replace(/^(dr\.|prof\.|mr\.|ms\.|mrs\.)/gi, '');
  baseUsername = baseUsername.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (!baseUsername) baseUsername = 'user';
  
  let uniqueUsername = baseUsername;
  let counter = 1;
  while (true) {
    const existing = await User.findOne({ where: { username: uniqueUsername } });
    if (!existing) {
      break;
    }
    uniqueUsername = `${baseUsername}${counter}`;
    counter++;
  }
  return uniqueUsername;
};

// ==========================================
// HOD MANAGEMENT
// ==========================================

exports.listHODs = async (req, res) => {
  try {
    const HODs = await User.findAll({
      where: { role: 'HOD' },
      attributes: { exclude: ['password_hash'] },
      include: [{ model: Department, as: 'department' }],
      order: [['username', 'ASC']]
    });
    return res.json({ HODs });
  } catch (error) {
    console.error('List HODs error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

exports.createHOD = async (req, res) => {
  try {
    const { name, username, email, password, department_id } = req.body;
    if (!username || !email || !password || !department_id) {
      return res.status(400).json({ error: 'Username, email, password and department are required' });
    }

    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) return res.status(409).json({ error: 'Username already exists' });

    const password_hash = await bcrypt.hash(password, 10);
    const newHOD = await User.create({
      username,
      email,
      password_hash,
      role: 'HOD',
      name: name || 'HOD',
      department_id
    });

    await logAdminAction(req.user.id, 'CREATE_HOD', 'Users', newHOD.id, { username, email });
    return res.status(201).json({ message: 'HOD account created successfully', HOD: newHOD });
  } catch (error) {
    console.error('Create HOD error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

exports.updateHOD = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, username, email, password, department_id } = req.body;

    const user = await User.findByPk(id);
    if (!user || user.role !== 'HOD') {
      return res.status(404).json({ error: 'HOD account not found' });
    }

    const updates = { name, username, email, department_id };
    if (password && password.trim()) {
      updates.password_hash = await bcrypt.hash(password, 10);
    }

    await user.update(updates);
    await logAdminAction(req.user.id, 'UPDATE_HOD', 'Users', id, { username, email });
    return res.json({ message: 'HOD account updated successfully', HOD: user });
  } catch (error) {
    console.error('Update HOD error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

exports.deleteHOD = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id);
    if (!user || user.role !== 'HOD') {
      return res.status(404).json({ error: 'HOD account not found' });
    }

    await logAdminAction(req.user.id, 'DELETE_HOD', 'Users', id, { username: user.username });
    await user.destroy();
    return res.json({ message: 'HOD account deleted successfully' });
  } catch (error) {
    console.error('Delete HOD error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// ==========================================
// STUDENT MANAGEMENT
// ==========================================

exports.listStudents = async (req, res) => {
  try {
    const students = await Student.findAll({
      include: [
        { model: Department, as: 'department' },
        { model: User, as: 'user', attributes: ['username', 'role'] }
      ],
      order: [['name', 'ASC']]
    });
    return res.json({ students });
  } catch (error) {
    console.error('List students error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

exports.createStudent = async (req, res) => {
  try {
    const { name, student_id, email, password, department_id, year, section, mobile_number } = req.body;
    if (!name || !student_id || !email || !password || !department_id) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    const existingStudent = await Student.findOne({ where: { student_id } });
    if (existingStudent) return res.status(409).json({ error: 'Student ID already exists' });

    const username = await generateUniqueUsername(name);
    const password_hash = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      username,
      email,
      password_hash,
      role: 'Student',
      name,
      department_id
    });

    const student = await Student.create({
      name,
      student_id,
      email,
      department_id,
      user_id: newUser.id,
      year: year || '1st',
      section: section || 'A',
      mobile_number: mobile_number || null,
      status: 'Active'
    });

    await logAdminAction(req.user.id, 'CREATE_STUDENT', 'Students', student.id, { name, student_id });
    return res.status(201).json({ message: 'Student created successfully', student });
  } catch (error) {
    console.error('Create student error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

exports.updateStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, student_id, email, password, department_id, status, year, section, mobile_number } = req.body;

    const student = await Student.findByPk(id);
    if (!student) return res.status(404).json({ error: 'Student not found' });

    const user = await User.findByPk(student.user_id);

    const userUpdates = { name, email, department_id };
    if (password && password.trim()) {
      userUpdates.password_hash = await bcrypt.hash(password, 10);
    }
    if (user) {
      await user.update(userUpdates);
    }

    await student.update({ name, student_id, email, department_id, status, year, section, mobile_number });
    await logAdminAction(req.user.id, 'UPDATE_STUDENT', 'Students', id, { name, student_id });

    return res.json({ message: 'Student updated successfully', student });
  } catch (error) {
    console.error('Update student error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

exports.deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const student = await Student.findByPk(id);
    if (!student) return res.status(404).json({ error: 'Student not found' });

    await logAdminAction(req.user.id, 'DELETE_STUDENT', 'Students', id, { student_id: student.student_id });

    if (student.user_id) {
      await User.destroy({ where: { id: student.user_id } });
    }
    await student.destroy();

    return res.json({ message: 'Student deleted successfully' });
  } catch (error) {
    console.error('Delete student error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// ==========================================
// FACULTY MANAGEMENT (CRUD EXPANSION)
// ==========================================

exports.listAllFaculty = async (req, res) => {
  try {
    const faculties = await Faculty.findAll({
      include: [
        { model: Department, as: 'department' },
        { model: User, as: 'user', attributes: ['username', 'role'] }
      ],
      order: [['name', 'ASC']]
    });
    return res.json({ faculties });
  } catch (error) {
    console.error('List all faculty error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

exports.createFaculty = async (req, res) => {
  try {
    const { name, employee_id, email, password, department_id, status, designation, mobile_number, qualification, experience } = req.body;
    if (!name || !employee_id || !email || !password || !department_id) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    const existingFaculty = await Faculty.findOne({ where: { employee_id } });
    if (existingFaculty) return res.status(409).json({ error: 'Employee ID already exists' });

    const username = await generateUniqueUsername(name);
    const password_hash = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      username,
      email,
      password_hash,
      role: 'Faculty',
      name,
      department_id
    });

    const faculty = await Faculty.create({
      name,
      employee_id,
      email,
      department_id,
      user_id: newUser.id,
      designation: designation || null,
      mobile_number: mobile_number || null,
      qualification: qualification || null,
      experience: experience || 0,
      status: status || 'Active'
    });

    await logAdminAction(req.user.id, 'CREATE_FACULTY', 'Faculties', faculty.id, { name, employee_id });
    return res.status(201).json({ message: 'Faculty created successfully', faculty });
  } catch (error) {
    console.error('Create faculty error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

exports.updateFaculty = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, employee_id, email, password, department_id, status, designation, mobile_number, qualification, experience } = req.body;

    const faculty = await Faculty.findByPk(id);
    if (!faculty) return res.status(404).json({ error: 'Faculty member not found' });

    const user = await User.findByPk(faculty.user_id);
    
    const userUpdates = { name, email, department_id };
    if (password && password.trim()) {
      userUpdates.password_hash = await bcrypt.hash(password, 10);
    }
    if (user) {
      await user.update(userUpdates);
    }

    await faculty.update({ name, employee_id, email, department_id, status, designation, mobile_number, qualification, experience });
    await logAdminAction(req.user.id, 'UPDATE_FACULTY', 'Faculties', id, { name, employee_id });

    return res.json({ message: 'Faculty updated successfully', faculty });
  } catch (error) {
    console.error('Update faculty error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

exports.deleteFaculty = async (req, res) => {
  try {
    const { id } = req.params;
    const faculty = await Faculty.findByPk(id);
    if (!faculty) return res.status(404).json({ error: 'Faculty member not found' });

    await logAdminAction(req.user.id, 'DELETE_FACULTY', 'Faculties', id, { employee_id: faculty.employee_id });

    if (faculty.user_id) {
      await User.destroy({ where: { id: faculty.user_id } });
    }
    await faculty.destroy();

    return res.json({ message: 'Faculty member deleted successfully' });
  } catch (error) {
    console.error('Delete faculty error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// ==========================================
// DEPARTMENT MANAGEMENT
// ==========================================

exports.createDepartment = async (req, res) => {
  try {
    const { name, code } = req.body;
    if (!name || !code) return res.status(400).json({ error: 'Name and Code are required' });

    const existing = await Department.findOne({ where: { code } });
    if (existing) return res.status(409).json({ error: 'Department code already exists' });

    const dept = await Department.create({ name, code });
    await logAdminAction(req.user.id, 'CREATE_DEPT', 'Departments', dept.id, { name, code });

    return res.status(201).json({ message: 'Department created successfully', department: dept });
  } catch (error) {
    console.error('Create department error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

exports.updateDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code } = req.body;

    const dept = await Department.findByPk(id);
    if (!dept) return res.status(404).json({ error: 'Department not found' });

    await dept.update({ name, code });
    await logAdminAction(req.user.id, 'UPDATE_DEPT', 'Departments', id, { name, code });

    return res.json({ message: 'Department updated successfully', department: dept });
  } catch (error) {
    console.error('Update department error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

exports.deleteDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const dept = await Department.findByPk(id);
    if (!dept) return res.status(404).json({ error: 'Department not found' });

    await logAdminAction(req.user.id, 'DELETE_DEPT', 'Departments', id, { code: dept.code });
    await dept.destroy();

    return res.json({ message: 'Department deleted successfully' });
  } catch (error) {
    console.error('Delete department error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// ==========================================
// COURSE MANAGEMENT
// ==========================================

exports.listCourses = async (req, res) => {
  try {
    const { departmentId, facultyId } = req.query;
    const where = {};
    if (departmentId) where.department_id = departmentId;
    if (facultyId) where.faculty_id = facultyId;

    const courses = await Course.findAll({
      where,
      include: [
        { model: Department, as: 'department' },
        { model: Faculty, as: 'faculty', attributes: ['name', 'employee_id'] }
      ],
      order: [['name', 'ASC']]
    });
    return res.json({ courses });
  } catch (error) {
    console.error('List courses error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

exports.createCourse = async (req, res) => {
  try {
    const { name, code, department_id, faculty_id } = req.body;
    if (!name || !code || !department_id) {
      return res.status(400).json({ error: 'Name, code, and department are required' });
    }

    const existing = await Course.findOne({ where: { code } });
    if (existing) return res.status(409).json({ error: 'Course code already exists' });

    const course = await Course.create({ name, code, department_id, faculty_id });
    await logAdminAction(req.user.id, 'CREATE_COURSE', 'Courses', course.id, { name, code });

    return res.status(201).json({ message: 'Course created successfully', course });
  } catch (error) {
    console.error('Create course error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

exports.updateCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code, department_id, faculty_id } = req.body;

    const course = await Course.findByPk(id);
    if (!course) return res.status(404).json({ error: 'Course not found' });

    await course.update({ name, code, department_id, faculty_id });
    await logAdminAction(req.user.id, 'UPDATE_COURSE', 'Courses', id, { name, code });

    return res.json({ message: 'Course updated successfully', course });
  } catch (error) {
    console.error('Update course error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

exports.deleteCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const course = await Course.findByPk(id);
    if (!course) return res.status(404).json({ error: 'Course not found' });

    await logAdminAction(req.user.id, 'DELETE_COURSE', 'Courses', id, { code: course.code });
    await course.destroy();

    return res.json({ message: 'Course deleted successfully' });
  } catch (error) {
    console.error('Delete course error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
