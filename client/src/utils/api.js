const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000/api' : '/api');

export const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem('sgi_scorecard_token', token);
  } else {
    localStorage.removeItem('sgi_scorecard_token');
  }
};

export const getAuthToken = () => {
  return localStorage.getItem('sgi_scorecard_token');
};

export const logoutUser = () => {
  localStorage.removeItem('sgi_scorecard_token');
  localStorage.removeItem('sgi_scorecard_user');
};

export const getSavedUser = () => {
  try {
    return JSON.parse(localStorage.getItem('sgi_scorecard_user'));
  } catch {
    return null;
  }
};

export const saveUser = (user) => {
  localStorage.setItem('sgi_scorecard_user', JSON.stringify(user));
};

const request = async (endpoint, options = {}) => {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Something went wrong');
  }

  return data;
};

export const api = {
  get: (endpoint) => request(endpoint, { method: 'GET' }),
  post: (endpoint, body) => request(endpoint, { method: 'POST', body: JSON.stringify(body) }),
  put: (endpoint, body) => request(endpoint, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (endpoint) => request(endpoint, { method: 'DELETE' }),
};

// Client-side real-time score calculation utility (matches backend exactly)
export const calculateScorePreview = (attendance, lessonPlan, testCorrection, feedback, courseProgress = 0) => {
  const attVal = parseFloat(attendance) || 0;
  const feedVal = parseFloat(feedback) || 0;
  const progressVal = parseFloat(courseProgress) || 0;

  const attendancePoints = attVal * 0.2;

  let lessonPlanPoints = 0;
  if (lessonPlan === 'Submitted on Time') lessonPlanPoints = 15;
  else if (lessonPlan === 'Submitted Late') lessonPlanPoints = 7.5;

  let testCorrectionPoints = 0;
  if (testCorrection === '1-3 Days') testCorrectionPoints = 15;
  else if (testCorrection === '4-7 Days') testCorrectionPoints = 7.5;
  else if (testCorrection === 'Above 7 Days') testCorrectionPoints = 3.75;

  const feedbackPoints = (feedVal / 5.0) * 40;

  const courseCompletionPoints = progressVal * 0.1;

  const score = attendancePoints + lessonPlanPoints + testCorrectionPoints + feedbackPoints + courseCompletionPoints;
  const rounded = Math.round(score * 100) / 100;

  let rating = 'Needs Improvement';
  if (rounded >= 90) rating = 'Excellent';
  else if (rounded >= 80) rating = 'Very Good';
  else if (rounded >= 70) rating = 'Good';
  else if (rounded >= 60) rating = 'Average';

  return { score: rounded, rating };
};
