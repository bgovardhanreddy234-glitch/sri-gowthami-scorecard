function calculateScore({
  attendancePercentage,
  lessonPlanStatus,
  testCorrectionTurnaround,
  studentFeedbackScore,
  courseCompletionProgress = 0
}) {
  // Attendance: 20% weight (points = attendance * 0.2)
  const attendancePoints = Number(attendancePercentage) * 0.2;

  // Lesson Plan Status: 15% weight
  let lessonPlanPoints = 0;
  if (lessonPlanStatus === 'Submitted on Time') {
    lessonPlanPoints = 15;
  } else if (lessonPlanStatus === 'Submitted Late') {
    lessonPlanPoints = 7.5;
  } else if (lessonPlanStatus === 'Not Submitted') {
    lessonPlanPoints = 0;
  }

  // Test Correction Turnaround: 15% weight
  let testCorrectionPoints = 0;
  if (testCorrectionTurnaround === '1-3 Days') {
    testCorrectionPoints = 15;
  } else if (testCorrectionTurnaround === '4-7 Days') {
    testCorrectionPoints = 7.5;
  } else if (testCorrectionTurnaround === 'Above 7 Days') {
    testCorrectionPoints = 3.75;
  } else if (testCorrectionTurnaround === 'Not Done') {
    testCorrectionPoints = 0;
  }

  // Student Feedback Score: 40% weight (points = (feedback_score / 5) * 40)
  const feedbackPoints = (Number(studentFeedbackScore) / 5.0) * 40;

  // Course Completion Progress: 10% weight (points = progress * 0.1)
  const courseCompletionPoints = Number(courseCompletionProgress) * 0.1;

  const totalScore = attendancePoints + lessonPlanPoints + testCorrectionPoints + feedbackPoints + courseCompletionPoints;
  const roundedScore = Math.round(totalScore * 100) / 100; // Round to 2 decimal places

  let kpiRating = 'Needs Improvement';
  if (roundedScore >= 90) {
    kpiRating = 'Excellent';
  } else if (roundedScore >= 80) {
    kpiRating = 'Very Good';
  } else if (roundedScore >= 70) {
    kpiRating = 'Good';
  } else if (roundedScore >= 60) {
    kpiRating = 'Average';
  } else {
    kpiRating = 'Needs Improvement';
  }

  return {
    performanceScore: roundedScore,
    kpiRating
  };
}

module.exports = { calculateScore };
