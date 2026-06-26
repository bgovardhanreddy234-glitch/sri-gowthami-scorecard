const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const { User, Faculty, Department, Student } = require('../models');
const { JWT_SECRET } = require('../middleware/auth');

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    const loginValue = username && username.trim();

    if (!loginValue || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    let user = await User.findOne({
      where: {
        [Op.or]: [
          { username: loginValue },
          { email: loginValue }
        ]
      },
      include: [
        {
          model: Faculty,
          as: 'faculty',
          include: [{ model: Department, as: 'department' }]
        },
        {
          model: Department,
          as: 'department'
        },
        {
          model: Student,
          as: 'studentProfile',
          include: [{ model: Department, as: 'department' }]
        }
      ]
    });

    if (!user) {
      user = await User.findOne({
        include: [
          {
            model: Faculty,
            as: 'faculty',
            where: {
              [Op.or]: [
                { employee_id: loginValue },
                { name: loginValue }
              ]
            },
            include: [{ model: Department, as: 'department' }]
          },
          {
            model: Department,
            as: 'department'
          },
          {
            model: Student,
            as: 'studentProfile',
            include: [{ model: Department, as: 'department' }]
          }
        ]
      });
    }

    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const tokenPayload = {
      id: user.id,
      username: user.username,
      role: user.role,
      facultyId: user.faculty ? user.faculty.id : null,
      departmentId: user.faculty ? user.faculty.department_id : (user.department_id || null)
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '8h' });

    return res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        email: user.email,
        name: user.name,
        department_id: user.department_id,
        department: user.department ? {
          id: user.department.id,
          name: user.department.name,
          code: user.department.code
        } : null,
        faculty: user.faculty ? {
          id: user.faculty.id,
          name: user.faculty.name,
          employee_id: user.faculty.employee_id,
          designation: user.faculty.designation,
          mobile_number: user.faculty.mobile_number,
          qualification: user.faculty.qualification,
          experience: user.faculty.experience,
          department: user.faculty.department
        } : null,
        studentProfile: user.studentProfile ? {
          id: user.studentProfile.id,
          student_id: user.studentProfile.student_id,
          name: user.studentProfile.name,
          email: user.studentProfile.email,
          status: user.studentProfile.status,
          year: user.studentProfile.year,
          section: user.studentProfile.section,
          mobile_number: user.studentProfile.mobile_number,
          department: user.studentProfile.department
        } : null
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

exports.register = async (req, res) => {
  try {
    const { username, email, password, role = 'Faculty', name, employee_id, department_id } = req.body;
    const normalizedUsername = username && username.trim();
    const normalizedEmail = email && email.trim().toLowerCase();

    if (!normalizedUsername || !normalizedEmail || !password || !role) {
      return res.status(400).json({ error: 'Username, email, password and role are required.' });
    }

    const existingUser = await User.findOne({
      where: {
        [Op.or]: [
          { username: normalizedUsername },
          { email: normalizedEmail }
        ]
      }
    });

    if (existingUser) {
      return res.status(409).json({ error: 'Username or email already exists.' });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      username: normalizedUsername,
      email: normalizedEmail,
      password_hash,
      role
    });

    let faculty = null;
    if (role === 'Faculty') {
      if (!name || !employee_id || !department_id) {
        return res.status(400).json({ error: 'Name, employee ID, and department are required for faculty registration.' });
      }

      faculty = await Faculty.create({
        name: name.trim(),
        employee_id: employee_id.trim(),
        email: normalizedEmail,
        department_id,
        user_id: newUser.id,
        status: 'Active'
      });
    }

    const tokenPayload = {
      id: newUser.id,
      username: newUser.username,
      role: newUser.role,
      facultyId: faculty ? faculty.id : null,
      departmentId: faculty ? faculty.department_id : (newUser.department_id || null)
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '8h' });

    return res.status(201).json({
      token,
      user: {
        id: newUser.id,
        username: newUser.username,
        role: newUser.role,
        email: newUser.email,
        name: newUser.name,
        department_id: newUser.department_id,
        faculty: faculty ? {
          id: faculty.id,
          name: faculty.name,
          employee_id: faculty.employee_id,
          department_id: faculty.department_id
        } : null
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

exports.me = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password_hash'] },
      include: [
        {
          model: Faculty,
          as: 'faculty',
          include: [{ model: Department, as: 'department' }]
        },
        {
          model: Department,
          as: 'department'
        },
        {
          model: Student,
          as: 'studentProfile',
          include: [{ model: Department, as: 'department' }]
        }
      ]
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({ user });
  } catch (error) {
    console.error('Auth me error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
