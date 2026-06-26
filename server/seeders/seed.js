const bcrypt = require('bcryptjs');
const {
  sequelize,
  Department,
  User,
  Faculty,
  Student,
  PerformanceRecord,
  Feedback,
  Notification,
  AuditLog,
  Course,
  ClassSession,
  Attendance,
  FacultyAttendance
} = require('../models');
const { calculateScore } = require('../utils/scoreCalculator');

const firstNames = [
  'Ramesh', 'Sanjay', 'Divya', 'Anil', 'Suresh', 'Rahul', 'Priya', 'Amit', 'Vikram', 'Rajesh',
  'Sandeep', 'Kavitha', 'Lakshmi', 'Ravi', 'Sunita', 'Gita', 'Mohan', 'Karan', 'Deepak', 'Neelam',
  'Aditya', 'Aarav', 'Vijay', 'Krishna', 'Radha', 'Arjun', 'Sita', 'Hari', 'Gopal', 'Madhav',
  'Pooja', 'Anjali', 'Swati', 'Meena', 'Rohan', 'Sneha', 'Jyothi', 'Pranathi', 'Venkatesh', 'Bhaskar',
  'Ajay', 'Kiran', 'Nisha', 'Asha', 'Ganesh', 'Karthik', 'Srinivas', 'Prasad', 'Sridevi', 'Madhuri',
  'Sunil', 'Harish', 'Manish', 'Soniya', 'Rohit', 'Kunal', 'Abhishek', 'Neha', 'Shalini', 'Ritu'
];

const surnames = [
  'Kumar', 'Reddy', 'Sharma', 'Naidu', 'Rao', 'Verma', 'Patel', 'Singh', 'Gupta', 'Joshi',
  'Choudhary', 'Malhotra', 'Kapoor', 'Das', 'Sen', 'Babu', 'Prasad', 'Lal', 'Acharya', 'Murthy',
  'Nair', 'Pillai', 'Rani', 'Devi', 'Goud', 'Yadav', 'Jha', 'Mishra', 'Trivedi', 'Bose'
];

function generateUniqueNames(count) {
  const namesSet = new Set();
  const list = [];
  while (list.length < count) {
    const fn = firstNames[Math.floor(Math.random() * firstNames.length)];
    const sn = surnames[Math.floor(Math.random() * surnames.length)];
    const fullName = `${fn} ${sn}`;
    if (!namesSet.has(fullName)) {
      namesSet.add(fullName);
      list.push({ firstName: fn, lastName: sn, fullName });
    }
  }
  return list;
}

async function seed() {
  try {
    const cleanName = (name) => {
      if (!name) return 'user';
      let cleaned = name.replace(/^(dr\.|prof\.|mr\.|ms\.|mrs\.)/gi, '');
      return cleaned.toLowerCase().replace(/[^a-z0-9]/g, '');
    };

    const usedUsernames = new Set(['admin']);
    const getUniqueUsername = (name) => {
      const base = cleanName(name);
      let proposed = base;
      let counter = 1;
      while (usedUsernames.has(proposed)) {
        proposed = `${base}${counter}`;
        counter++;
      }
      usedUsernames.add(proposed);
      return proposed;
    };

    console.log('Connecting and syncing database with expanded ERP models...');
    await sequelize.sync({ force: true });
    console.log('Database synced successfully.');

    // 1. Seed Departments
    const depts = [
      { name: 'Computer Science & Engineering', code: 'CSE' },
      { name: 'Electronics & Communication Engineering', code: 'ECE' },
      { name: 'Electrical & Electronics Engineering', code: 'EEE' },
      { name: 'Mechanical Engineering', code: 'ME' },
      { name: 'Civil Engineering', code: 'CE' },
      { name: 'Bachelor of Commerce', code: 'BCOM' },
      { name: 'Bachelor of Science', code: 'BSC' },
      { name: 'Master of Business Administration', code: 'MBA' }
    ];
    const createdDepts = await Department.bulkCreate(depts);
    console.log('Departments seeded.');

    // 2. Prepare passwords and names
    const salt = await bcrypt.genSalt(10);
    const adminPasswordHash = await bcrypt.hash('admin123', salt);
    const hodPasswordHash = await bcrypt.hash('9012', salt);
    const studentPasswordHash = await bcrypt.hash('1234', salt);
    const facultyPasswordHash = await bcrypt.hash('5678', salt);

    const namePool = generateUniqueNames(200);
    const generatedFaculties = namePool.slice(0, 32);
    const generatedStudents = namePool.slice(32, 192);

    // 3. Create Admin User
    const adminUser = await User.create({
      username: 'admin',
      password_hash: adminPasswordHash,
      role: 'Admin',
      email: 'admin@srigowthami.in',
      name: 'ERP Administrator'
    });
    console.log('Admin user created.');

    const createdUsers = [];
    const createdHODs = [];
    const createdFaculties = [];
    const createdStudents = [];

    // Loop over departments to create HOD, Faculty, Students
    for (let i = 0; i < createdDepts.length; i++) {
      const dept = createdDepts[i];
      const deptCodeLower = dept.code.toLowerCase();

      // Create HOD User
      const hodName = `Dr. HOD ${dept.code}`;
      const hodUsername = getUniqueUsername(hodName);
      const hodUser = await User.create({
        username: hodUsername,
        password_hash: hodPasswordHash,
        role: 'HOD',
        email: `hod.${deptCodeLower}@srigowthami.in`,
        name: hodName,
        department_id: dept.id
      });
      createdHODs.push(hodUser);
      createdUsers.push(hodUser);

      // Create 4 Faculty members for this department
      for (let fNum = 1; fNum <= 4; fNum++) {
        const facNameInfo = generatedFaculties[(i * 4) + (fNum - 1)];
        const sanitizedFirst = facNameInfo.firstName.toLowerCase();
        const sanitizedLast = facNameInfo.lastName.toLowerCase();
        const facUsername = getUniqueUsername(facNameInfo.fullName);
        
        const facUser = await User.create({
          username: facUsername,
          password_hash: facultyPasswordHash,
          role: 'Faculty',
          email: `faculty.${sanitizedFirst}.${sanitizedLast}@srigowthami.in`,
          name: facNameInfo.fullName,
          department_id: dept.id
        });
        createdUsers.push(facUser);

        const designations = ['Professor', 'Associate Professor', 'Assistant Professor'];
        const qualifications = ['Ph.D', 'M.Tech', 'MBA', 'M.Sc', 'M.Com'];
        const designation = designations[Math.floor(Math.random() * designations.length)];
        const qualification = qualifications[Math.floor(Math.random() * qualifications.length)];
        const experience = Math.floor(Math.random() * 15) + 3; // 3 to 17 years
        const mobile_number = `+91 9${Math.floor(100000000 + Math.random() * 900000000)}`;

        const faculty = await Faculty.create({
          name: facNameInfo.fullName,
          employee_id: `SGI-FAC-${dept.code}-${String(fNum).padStart(3, '0')}`,
          email: facUser.email,
          designation,
          mobile_number,
          qualification,
          experience,
          status: 'Active',
          department_id: dept.id,
          user_id: facUser.id
        });
        createdFaculties.push(faculty);
      }

      // Create 20 Students for this department
      for (let sNum = 1; sNum <= 20; sNum++) {
        const stuNameInfo = generatedStudents[(i * 20) + (sNum - 1)];
        const sanitizedFirst = stuNameInfo.firstName.toLowerCase();
        const sanitizedLast = stuNameInfo.lastName.toLowerCase();
        const stuUsername = getUniqueUsername(stuNameInfo.fullName);
        
        const stuUser = await User.create({
          username: stuUsername,
          password_hash: studentPasswordHash,
          role: 'Student',
          email: `student.${sanitizedFirst}.${sanitizedLast}@srigowthami.in`,
          name: stuNameInfo.fullName,
          department_id: dept.id
        });
        createdUsers.push(stuUser);

        const years = ['1st', '2nd', '3rd', '4th'];
        const sections = ['A', 'B', 'C'];
        const year = years[(sNum - 1) % 4];
        const section = sections[(sNum - 1) % 3];
        const mobile_number = `+91 9${Math.floor(100000000 + Math.random() * 900000000)}`;

        const student = await Student.create({
          name: stuNameInfo.fullName,
          student_id: `SGI-STU-${dept.code}-${String(sNum).padStart(3, '0')}`,
          email: stuUser.email,
          year,
          section,
          mobile_number,
          status: 'Active',
          department_id: dept.id,
          user_id: stuUser.id
        });
        createdStudents.push(student);
      }
    }
    
    // Seed Specific Demo Accounts
    // 1. Student Sanjay
    const sanjayUsername = getUniqueUsername('Sanjay Kumar');
    const sanjayUser = await User.create({
      username: sanjayUsername,
      password_hash: studentPasswordHash,
      role: 'Student',
      email: 'student.sanjay@srigowthami.in',
      name: 'Sanjay Kumar',
      department_id: createdDepts[0].id
    });
    const sanjayStudent = await Student.create({
      name: 'Sanjay Kumar',
      student_id: 'SGI-STU-CSE-100',
      email: 'student.sanjay@srigowthami.in',
      year: '3rd',
      section: 'A',
      mobile_number: '+91 9876543210',
      status: 'Active',
      department_id: createdDepts[0].id,
      user_id: sanjayUser.id
    });
    createdStudents.push(sanjayStudent);
    createdUsers.push(sanjayUser);

    // 2. Faculty John
    const johnUsername = getUniqueUsername('John Doe');
    const johnUser = await User.create({
      username: johnUsername,
      password_hash: facultyPasswordHash,
      role: 'Faculty',
      email: 'faculty.john@srigowthami.in',
      name: 'John Doe',
      department_id: createdDepts[0].id
    });
    const johnFaculty = await Faculty.create({
      name: 'John Doe',
      employee_id: 'SGI-FAC-CSE-100',
      email: 'faculty.john@srigowthami.in',
      designation: 'Associate Professor',
      mobile_number: '+91 9876543211',
      qualification: 'M.Tech',
      experience: 8,
      status: 'Active',
      department_id: createdDepts[0].id,
      user_id: johnUser.id
    });
    createdFaculties.push(johnFaculty);
    createdUsers.push(johnUser);

    console.log('HODs, Faculty, and Students seeded successfully.');

    // 4. Seed Courses (2 courses per department)
    const courseNames = {
      'CSE': ['Data Structures & Algorithms', 'Operating Systems'],
      'ECE': ['Signals & Systems', 'Microprocessors'],
      'EEE': ['Control Systems', 'Electrical Machines'],
      'ME': ['Thermodynamics', 'Heat Transfer'],
      'CE': ['Structural Analysis', 'Geotechnical Engineering'],
      'BCOM': ['Financial Accounting', 'Business Law'],
      'BSC': ['Organic Chemistry', 'Mathematical Physics'],
      'MBA': ['Marketing Management', 'Organizational Behavior']
    };

    const courseCodes = {
      'CSE': ['CS101', 'CS102'],
      'ECE': ['EC101', 'EC102'],
      'EEE': ['EE101', 'EE102'],
      'ME': ['ME101', 'ME102'],
      'CE': ['CE101', 'CE102'],
      'BCOM': ['BC101', 'BC102'],
      'BSC': ['BS101', 'BS102'],
      'MBA': ['MB101', 'MB102']
    };

    const createdCourses = [];
    for (const dept of createdDepts) {
      const deptFaculty = createdFaculties.filter(f => f.department_id === dept.id);
      const names = courseNames[dept.code];
      const codes = courseCodes[dept.code];

      for (let cIdx = 0; cIdx < 2; cIdx++) {
        let assignedFacultyId = deptFaculty[cIdx].id;
        if (dept.code === 'CSE' && cIdx === 1) {
          const john = createdFaculties.find(f => f.email === 'faculty.john@srigowthami.in');
          if (john) assignedFacultyId = john.id;
        }

        const course = await Course.create({
          name: names[cIdx],
          code: codes[cIdx],
          department_id: dept.id,
          faculty_id: assignedFacultyId
        });
        createdCourses.push(course);
      }
    }
    console.log('Courses seeded.');

    // 5. Seed ClassSessions & Attendance logs (3 completed sessions per course)
    const dates = ['2026-06-12', '2026-06-13', '2026-06-14'];
    const timeSlots = ['09:00 AM - 10:00 AM', '11:00 AM - 12:00 PM', '02:00 PM - 03:00 PM'];
    const createdSessions = [];
    const createdAttendances = [];

    for (const course of createdCourses) {
      const deptStudents = createdStudents.filter(s => s.department_id === course.department_id);

      for (let dayIdx = 0; dayIdx < dates.length; dayIdx++) {
        const session = await ClassSession.create({
          date: dates[dayIdx],
          time_slot: timeSlots[dayIdx],
          status: 'Completed',
          faculty_id: course.faculty_id,
          course_id: course.id
        });
        createdSessions.push(session);

        for (const student of deptStudents) {
          const isPresent = Math.random() < 0.85; // 85% attendance probability
          const attendance = await Attendance.create({
            status: isPresent ? 'Present' : 'Absent',
            class_session_id: session.id,
            student_id: student.user_id
          });
          createdAttendances.push(attendance);
        }
      }
    }
    console.log('Class sessions and attendance records seeded.');

    // 6. Seed Student Feedback ratings (Daily Feedbacks)
    const createdFeedbacks = [];
    for (const session of createdSessions) {
      const faculty = createdFaculties.find(f => f.id === session.faculty_id);
      // Let's make CSE Faculty #1 and ME Faculty #1 poor performers to generate alerts/low score cases
      const isLowPerformer = faculty.employee_id === 'SGI-FAC-CSE-001' || faculty.employee_id === 'SGI-FAC-ME-001';

      // Find present students for this session
      const presentAttendances = createdAttendances.filter(att => att.class_session_id === session.id && att.status === 'Present');
      
      // Select 3 random students to submit feedback
      const shuffled = presentAttendances.sort(() => 0.5 - Math.random());
      const selected = shuffled.slice(0, Math.min(3, shuffled.length));

      for (const att of selected) {
        let tq, sk, cs, is, cp;
        if (isLowPerformer) {
          tq = Math.floor(Math.random() * 2) + 2; // 2-3
          sk = Math.floor(Math.random() * 2) + 2; // 2-3
          cs = Math.floor(Math.random() * 2) + 1; // 1-2
          is = Math.floor(Math.random() * 2) + 2; // 2-3
          cp = Math.floor(Math.random() * 2) + 2; // 2-3
        } else {
          tq = Math.floor(Math.random() * 2) + 4; // 4-5
          sk = Math.floor(Math.random() * 2) + 4; // 4-5
          cs = Math.floor(Math.random() * 2) + 4; // 4-5
          is = Math.floor(Math.random() * 2) + 4; // 4-5
          cp = Math.floor(Math.random() * 2) + 4; // 4-5
        }

        const avg = (tq + sk + cs + is + cp) / 5;
        const roundedAvg = Math.round(avg * 100) / 100;

        const feedback = await Feedback.create({
          faculty_id: faculty.id,
          student_id: att.student_id,
          student_feedback_score: roundedAvg,
          teaching_quality: tq,
          subject_knowledge: sk,
          communication_skills: cs,
          interaction_with_students: is,
          class_preparation: cp,
          comments: isLowPerformer 
            ? 'Concepts are not explained clearly. Class is hard to follow.' 
            : 'Excellent teacher, very interactive and clear explanations.',
          academic_year: '2025-2026',
          semester: 'Semester 1',
          course_id: session.course_id,
          class_session_id: session.id,
          rating_date: session.date
        });
        createdFeedbacks.push(feedback);
      }
    }
    console.log('Daily student feedback ratings seeded.');

    // 7. Seed Performance Records
    const createdRecords = [];
    for (const faculty of createdFaculties) {
      const isLowPerformer = faculty.employee_id === 'SGI-FAC-CSE-001' || faculty.employee_id === 'SGI-FAC-ME-001';

      // Find average feedback score
      const relatedFeedbacks = createdFeedbacks.filter(f => f.faculty_id === faculty.id);
      let avgFeedback = 4.2;
      if (relatedFeedbacks.length > 0) {
        const sum = relatedFeedbacks.reduce((acc, curr) => acc + curr.student_feedback_score, 0);
        avgFeedback = Math.round((sum / relatedFeedbacks.length) * 100) / 100;
      }

      let attendance_percentage, lesson_plan_status, test_correction_turnaround, course_completion_progress, remarks;
      
      if (isLowPerformer) {
        attendance_percentage = Math.round((60 + Math.random() * 12) * 100) / 100; // 60% - 72%
        lesson_plan_status = Math.random() < 0.5 ? 'Submitted Late' : 'Not Submitted';
        test_correction_turnaround = Math.random() < 0.5 ? 'Above 7 Days' : 'Not Done';
        course_completion_progress = Math.round((45 + Math.random() * 15) * 100) / 100; // 45% - 60%
        remarks = 'Requires serious improvement. Punctuality, lesson plans and test turnaround are lagging.';
      } else {
        attendance_percentage = Math.round((88 + Math.random() * 10) * 100) / 100; // 88% - 98%
        lesson_plan_status = 'Submitted on Time';
        test_correction_turnaround = Math.random() < 0.7 ? '1-3 Days' : '4-7 Days';
        course_completion_progress = Math.round((80 + Math.random() * 18) * 100) / 100; // 80% - 98%
        remarks = 'Consistently excellent performance on all parameters. High syllabus coverage.';
      }

      const { performanceScore, kpiRating } = calculateScore({
        attendancePercentage: attendance_percentage,
        lessonPlanStatus: lesson_plan_status,
        testCorrectionTurnaround: test_correction_turnaround,
        studentFeedbackScore: avgFeedback,
        courseCompletionProgress: course_completion_progress
      });

      const record = await PerformanceRecord.create({
        faculty_id: faculty.id,
        attendance_percentage,
        lesson_plan_status,
        test_correction_turnaround,
        student_feedback_score: avgFeedback,
        course_completion_progress,
        performance_score: performanceScore,
        kpi_rating: kpiRating,
        academic_year: '2025-2026',
        semester: 'Semester 1',
        remarks,
        status: isLowPerformer ? 'Active' : 'Completed',
        created_by: adminUser.id
      });
      createdRecords.push(record);
    }
    console.log('Performance records seeded.');

    // 8. Seed Compliance Alerts & Notifications
    for (const record of createdRecords) {
      const faculty = createdFaculties.find(f => f.id === record.faculty_id);
      
      if (record.attendance_percentage < 75) {
        // Alert Admin
        await Notification.create({
          user_id: adminUser.id,
          type: 'ATTENDANCE_ALERT',
          title: 'Low Attendance Alert',
          message: `${faculty.name} (${faculty.employee_id}) attendance is below threshold: ${record.attendance_percentage}% (Required: 75%).`,
          is_read: false
        });
        
        // Alert HOD
        const deptHOD = createdHODs.find(h => h.department_id === faculty.department_id);
        if (deptHOD) {
          await Notification.create({
            user_id: deptHOD.id,
            type: 'ATTENDANCE_ALERT',
            title: 'Low Attendance Alert',
            message: `${faculty.name} (${faculty.employee_id}) attendance is below threshold: ${record.attendance_percentage}% (Required: 75%).`,
            is_read: false
          });
        }
      }

      if (record.performance_score < 60) {
        // Alert Admin
        await Notification.create({
          user_id: adminUser.id,
          type: 'KPI_ALERT',
          title: 'Critical KPI Score Alert',
          message: `${faculty.name} (${faculty.employee_id}) overall KPI score is critical: ${record.performance_score}% (${record.kpi_rating}).`,
          is_read: false
        });

        // Alert HOD
        const deptHOD = createdHODs.find(h => h.department_id === faculty.department_id);
        if (deptHOD) {
          await Notification.create({
            user_id: deptHOD.id,
            type: 'KPI_ALERT',
            title: 'Critical KPI Score Alert',
            message: `${faculty.name} (${faculty.employee_id}) overall KPI score is critical: ${record.performance_score}% (${record.kpi_rating}).`,
            is_read: false
          });
        }

        // Notify Faculty
        await Notification.create({
          user_id: faculty.user_id,
          type: 'KPI_ALERT',
          title: 'Performance Score Threshold Warning',
          message: `Your overall performance rating for 2025-2026 Semester 1 has dropped below threshold: ${record.performance_score}% (${record.kpi_rating}).`,
          is_read: false
        });
      }
    }
    console.log('Compliance alerts seeded.');

    // Seed Faculty Attendance records for past 30 days
    const facultyAttendanceRecords = [];
    const dateObj = new Date();
    for (let dayOffset = 30; dayOffset >= 0; dayOffset--) {
      const d = new Date(dateObj);
      d.setDate(d.getDate() - dayOffset);
      const dateString = d.toISOString().split('T')[0];
      
      // Skip Sundays (realistic!)
      const dayOfWeek = d.getDay();
      if (dayOfWeek === 0) continue; 
      
      createdFaculties.forEach(fac => {
        // High performers have a higher presence rate (e.g. 95%), low performers lower (e.g. 70%)
        const isLowPerformer = fac.employee_id === 'SGI-FAC-CSE-001' || fac.employee_id === 'SGI-FAC-ME-001';
        const presenceRate = isLowPerformer ? 0.70 : 0.95;
        const status = Math.random() < presenceRate ? 'Present' : 'Absent';
        const remarks = status === 'Absent' ? (Math.random() < 0.5 ? 'Sick leave' : 'Personal reasons') : null;
        
        facultyAttendanceRecords.push({
          faculty_id: fac.id,
          date: dateString,
          status,
          remarks
        });
      });
    }
    await FacultyAttendance.bulkCreate(facultyAttendanceRecords);
    console.log('Faculty daily attendance records seeded.');


    // 9. Seed Audit Logs
    await AuditLog.create({
      action: 'SYSTEM_SEED',
      details: 'Sri Gowthami ERP initialized with 8 departments, 160 students, 32 faculty members, HOD accounts, daily class sessions, attendance logs, and multi-day ratings.',
      timestamp: new Date()
    });
    console.log('Audit logs seeded.');

    console.log('\n================================================================');
    console.log('DATABASE SEEDING COMPLETED SUCCESSFULLY!');
    console.log('Total Departments seeded: ' + createdDepts.length);
    console.log('Total Users seeded: ' + (createdUsers.length + 1));
    console.log('Total Faculty Profiles seeded: ' + createdFaculties.length);
    console.log('Total Student Profiles seeded: ' + createdStudents.length);
    console.log('Total Completed Class Sessions seeded: ' + createdSessions.length);
    console.log('Total Attendance Entries seeded: ' + createdAttendances.length);
    console.log('Total Feedback Ratings seeded: ' + createdFeedbacks.length);
    console.log('\nDEMO CREDENTIALS:');
    console.log('- Admin: admin / admin123');
    console.log('- HOD Users: hodcse / 9012');
    console.log('- Students password: 1234');
    console.log('- Faculty password: 5678');
    console.log('  Example Student: ' + createdStudents[0].email + ' (username: ' + cleanName(createdStudents[0].name) + ')');
    console.log('  Example Faculty: ' + createdFaculties[0].email);
    console.log('================================================================\n');

  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    if (require.main === module) {
      await sequelize.close();
    }
  }
}

if (require.main === module) {
  seed();
}

module.exports = seed;
