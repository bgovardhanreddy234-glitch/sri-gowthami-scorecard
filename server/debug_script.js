const { getDailyAttendance } = require('./controllers/attendanceController');

async function testAttendance() {
  try {
    const req = {
      query: {
        date: '2026-06-23'
      }
    };
    
    const res = {
      json: (data) => {
        console.log('ATTENDANCE SUCCESS:', JSON.stringify(data, null, 2).substring(0, 500));
      },
      status: (code) => {
        console.log('ATTENDANCE STATUS:', code);
        return res;
      }
    };

    await getDailyAttendance(req, res);
  } catch (err) {
    console.error('CRITICAL ERROR IN RUN:', err);
  }
}

testAttendance();
