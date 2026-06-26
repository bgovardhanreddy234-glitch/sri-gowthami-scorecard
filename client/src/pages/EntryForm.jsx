import React, { useEffect, useState } from 'react';
import { api, calculateScorePreview } from '../utils/api';
import { Save, RotateCcw, AlertTriangle } from 'lucide-react';

const EntryForm = ({ user, recordId, setRecordId, setCurrentTab }) => {
  const [faculties, setFaculties] = useState([]);
  const [formData, setFormData] = useState({
    faculty_id: '',
    attendance_percentage: '',
    lesson_plan_status: 'Submitted on Time',
    test_correction_turnaround: '1-3 Days',
    student_feedback_score: '',
    course_completion_progress: '',
    academic_year: '2025-2026',
    semester: 'Semester 1',
    remarks: '',
    status: 'Active'
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [serverError, setServerError] = useState('');
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [suggestionsLoaded, setSuggestionsLoaded] = useState(false);

  // 1. Fetch faculties
  useEffect(() => {
    const fetchFaculties = async () => {
      try {
        const deptFilter = user.role === 'HOD' ? `?departmentId=${user.faculty?.department_id || ''}` : '';
        const response = await api.get(`/faculty${deptFilter}`);
        setFaculties(response.faculties || []);
      } catch (err) {
        console.error(err);
        setServerError('Failed to fetch faculty list');
      }
    };
    fetchFaculties();
  }, [user]);

  // 2. Fetch record details if editing
  useEffect(() => {
    const fetchRecord = async () => {
      if (!recordId) return;
      setFetching(true);
      try {
        const response = await api.get(`/performance/${recordId}`);
        const rec = response.record;
        setFormData({
          faculty_id: rec.faculty_id,
          attendance_percentage: rec.attendance_percentage,
          lesson_plan_status: rec.lesson_plan_status,
          test_correction_turnaround: rec.test_correction_turnaround,
          student_feedback_score: rec.student_feedback_score,
          course_completion_progress: rec.course_completion_progress || '',
          academic_year: rec.academic_year,
          semester: rec.semester,
          remarks: rec.remarks || '',
          status: rec.status
        });
      } catch (err) {
        console.error(err);
        setServerError('Failed to fetch the performance record for editing');
      } finally {
        setFetching(false);
      }
    };
    fetchRecord();
  }, [recordId]);

  const handleChange = async (e) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }

    // Auto-fill actual metrics from database if selecting a faculty member
    if (name === 'faculty_id' && value) {
      setSuggestionsLoading(true);
      setSuggestionsLoaded(false);
      try {
        const response = await api.get(`/faculty/${value}/scorecard-suggestions`);
        setFormData(prev => ({
          ...prev,
          attendance_percentage: response.attendance_percentage || '',
          student_feedback_score: response.student_feedback_score || '',
          course_completion_progress: response.course_completion_progress || ''
        }));
        setSuggestionsLoaded(true);
      } catch (err) {
        console.error('Failed to load scorecard suggestions:', err);
      } finally {
        setSuggestionsLoading(false);
      }
    } else if (name === 'faculty_id' && !value) {
      setSuggestionsLoaded(false);
      setFormData(prev => ({
        ...prev,
        attendance_percentage: '',
        student_feedback_score: '',
        course_completion_progress: ''
      }));
    }
  };

  // 3. Real-time Preview Calculation
  const { score, rating } = calculateScorePreview(
    formData.attendance_percentage,
    formData.lesson_plan_status,
    formData.test_correction_turnaround,
    formData.student_feedback_score,
    formData.course_completion_progress
  );

  const validate = () => {
    const newErrors = {};
    if (!formData.faculty_id) newErrors.faculty_id = 'Please select a faculty member';
    
    const att = parseFloat(formData.attendance_percentage);
    if (formData.attendance_percentage === '' || isNaN(att) || att < 0 || att > 100) {
      newErrors.attendance_percentage = 'Attendance must be a decimal between 0 and 100';
    }

    const feed = parseFloat(formData.student_feedback_score);
    if (formData.student_feedback_score === '' || isNaN(feed) || feed < 1.0 || feed > 5.0) {
      newErrors.student_feedback_score = 'Feedback score must be a decimal between 1.0 and 5.0';
    }

    const progress = parseFloat(formData.course_completion_progress);
    if (formData.course_completion_progress === '' || isNaN(progress) || progress < 0 || progress > 100) {
      newErrors.course_completion_progress = 'Course progress must be a percentage between 0 and 100';
    }

    if (!formData.academic_year) newErrors.academic_year = 'Academic year is required';
    if (!formData.semester) newErrors.semester = 'Semester is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setServerError('');
    setSuccessMsg('');

    try {
      if (recordId) {
        // Edit record
        await api.put(`/performance/${recordId}`, {
          attendance_percentage: parseFloat(formData.attendance_percentage),
          lesson_plan_status: formData.lesson_plan_status,
          test_correction_turnaround: formData.test_correction_turnaround,
          student_feedback_score: parseFloat(formData.student_feedback_score),
          course_completion_progress: parseFloat(formData.course_completion_progress),
          academic_year: formData.academic_year,
          semester: formData.semester,
          remarks: formData.remarks,
          status: formData.status
        });
        setSuccessMsg('Performance record updated successfully!');
      } else {
        // Create new record
        await api.post('/performance', {
          faculty_id: parseInt(formData.faculty_id),
          attendance_percentage: parseFloat(formData.attendance_percentage),
          lesson_plan_status: formData.lesson_plan_status,
          test_correction_turnaround: formData.test_correction_turnaround,
          student_feedback_score: parseFloat(formData.student_feedback_score),
          course_completion_progress: parseFloat(formData.course_completion_progress),
          academic_year: formData.academic_year,
          semester: formData.semester,
          remarks: formData.remarks,
          status: formData.status
        });
        setSuccessMsg('Performance record created successfully!');
        // Reset form
        setFormData({
          faculty_id: '',
          attendance_percentage: '',
          lesson_plan_status: 'Submitted on Time',
          test_correction_turnaround: '1-3 Days',
          student_feedback_score: '',
          course_completion_progress: '',
          academic_year: '2025-2026',
          semester: 'Semester 1',
          remarks: '',
          status: 'Active'
        });
      }
      
      // Redirect to list after 1.5 seconds
      setTimeout(() => {
        setRecordId(null);
        setCurrentTab('records');
      }, 1500);
    } catch (err) {
      console.error(err);
      setServerError(err.message || 'An error occurred while saving the record.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setRecordId(null);
    setCurrentTab('records');
  };

  if (fetching) {
    return (
      <div className="loading-spinner-wrapper">
        <div className="spinner"></div>
        <p>Fetching record values...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">{recordId ? 'Edit Scorecard Record' : 'Record Score Evaluation'}</h1>
          <p className="page-subtitle">Fill in student feedback, grading TAT, lesson logs, and calculate KPIs.</p>
        </div>
      </div>

      {serverError && (
        <div className="alert-bar error" style={{ maxWidth: 800, margin: '0 auto 24px auto' }}>
          <AlertTriangle size={16} />
          <span>{serverError}</span>
        </div>
      )}

      {successMsg && (
        <div className="alert-bar success" style={{ maxWidth: 800, margin: '0 auto 24px auto' }}>
          <span>{successMsg}</span>
        </div>
      )}

      {suggestionsLoading && (
        <div className="alert-bar info" style={{ maxWidth: 800, margin: '0 auto 24px auto', display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderRadius: 8, backgroundColor: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)', color: '#3b82f6' }}>
          <div className="loading-spinner-small" style={{ border: '2px solid rgba(59,130,246,0.2)', borderTop: '2px solid #3b82f6', borderRadius: '50%', width: 14, height: 14, animation: 'spin 1s linear infinite' }}></div>
          <span style={{ fontSize: 13, fontWeight: 500 }}>Calculating & fetching real-time database metrics for selected faculty member...</span>
        </div>
      )}

      {suggestionsLoaded && (
        <div className="alert-bar success" style={{ maxWidth: 800, margin: '0 auto 24px auto', display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', borderRadius: 8, backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', color: '#10b981' }}>
          <span style={{ fontSize: 13, fontWeight: 600 }}>✓ Real-time database metrics (Attendance, Feedback, and Course Progress) loaded successfully!</span>
        </div>
      )}

      <div className="form-container">
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            
            {/* Faculty selection */}
            <div className="form-group">
              <label className="form-label">Faculty Member *</label>
              <select
                name="faculty_id"
                className="form-select"
                value={formData.faculty_id}
                onChange={handleChange}
                disabled={!!recordId} // Cannot change faculty once created
                required
              >
                <option value="">-- Select Faculty --</option>
                {faculties.map(f => (
                  <option key={f.id} value={f.id}>
                    {f.name} ({f.employee_id}) • {f.department?.code}
                  </option>
                ))}
              </select>
              {formData.faculty_id && !recordId && (
                <div style={{ padding: '12px 14px', backgroundColor: 'var(--primary-tint)', borderRadius: 8, fontSize: 12, color: 'var(--text-secondary)', marginTop: 10, border: '1px solid var(--border)', lineHeight: '1.4' }}>
                  ℹ️ <strong>System Data Summary:</strong> Based on institutional data, this faculty has an average student rating of <strong>{formData.student_feedback_score || 'N/A'} / 5.0</strong> across completed classes and <strong>{formData.attendance_percentage || 'N/A'}%</strong> session completion. The values have been auto-populated from database records.
                </div>
              )}
              {errors.faculty_id && <span className="error-text">{errors.faculty_id}</span>}
            </div>

            {/* Attendance percentage */}
            <div className="form-group">
              <label className="form-label">Attendance Percentage (%) *</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="100"
                name="attendance_percentage"
                className="form-input"
                value={formData.attendance_percentage}
                onChange={handleChange}
                placeholder="e.g. 92.5"
                required
              />
              {errors.attendance_percentage && <span className="error-text">{errors.attendance_percentage}</span>}
            </div>

            {/* Lesson Plan submission status */}
            <div className="form-group">
              <label className="form-label">Lesson Plan Submission Status *</label>
              <select
                name="lesson_plan_status"
                className="form-select"
                value={formData.lesson_plan_status}
                onChange={handleChange}
                required
              >
                <option value="Submitted on Time">Submitted on Time (20 pts)</option>
                <option value="Submitted Late">Submitted Late (10 pts)</option>
                <option value="Not Submitted">Not Submitted (0 pts)</option>
              </select>
            </div>

            {/* Test Correction Turnaround */}
            <div className="form-group">
              <label className="form-label">Test Correction Turnaround Time *</label>
              <select
                name="test_correction_turnaround"
                className="form-select"
                value={formData.test_correction_turnaround}
                onChange={handleChange}
                required
              >
                <option value="1-3 Days">1-3 Days (20 pts)</option>
                <option value="4-7 Days">4-7 Days (10 pts)</option>
                <option value="Above 7 Days">Above 7 Days (5 pts)</option>
                <option value="Not Done">Not Done (0 pts)</option>
              </select>
            </div>

            {/* Student Feedback Score */}
            <div className="form-group">
              <label className="form-label">Student Feedback Score (1.0 - 5.0) *</label>
              <input
                type="number"
                step="0.01"
                min="1"
                max="5"
                name="student_feedback_score"
                className="form-input"
                value={formData.student_feedback_score}
                onChange={handleChange}
                placeholder="e.g. 4.5"
                required
              />
              {errors.student_feedback_score && <span className="error-text">{errors.student_feedback_score}</span>}
            </div>

            {/* Course Completion Progress */}
            <div className="form-group">
              <label className="form-label">Course Completion Progress (%) *</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="100"
                name="course_completion_progress"
                className="form-input"
                value={formData.course_completion_progress}
                onChange={handleChange}
                placeholder="e.g. 85.0"
                required
              />
              {errors.course_completion_progress && <span className="error-text">{errors.course_completion_progress}</span>}
            </div>

            {/* Academic Year */}
            <div className="form-group">
              <label className="form-label">Academic Year *</label>
              <select
                name="academic_year"
                className="form-select"
                value={formData.academic_year}
                onChange={handleChange}
                required
              >
                <option value="2025-2026">2025-2026</option>
                <option value="2026-2027">2026-2027</option>
                <option value="2027-2028">2027-2028</option>
              </select>
            </div>

            {/* Semester */}
            <div className="form-group">
              <label className="form-label">Semester *</label>
              <select
                name="semester"
                className="form-select"
                value={formData.semester}
                onChange={handleChange}
                required
              >
                <option value="Semester 1">Semester 1</option>
                <option value="Semester 2">Semester 2</option>
              </select>
            </div>

            {/* Scorecard Record Status */}
            <div className="form-group">
              <label className="form-label">Scorecard Record Status *</label>
              <select
                name="status"
                className="form-select"
                value={formData.status}
                onChange={handleChange}
                required
              >
                <option value="Active">Active (Draft/In progress)</option>
                <option value="Completed">Completed (Locked)</option>
                <option value="Archived">Archived</option>
              </select>
            </div>

            {/* Remarks */}
            <div className="form-group full-width">
              <label className="form-label">Remarks / Evaluator Observations</label>
              <textarea
                name="remarks"
                className="form-textarea"
                value={formData.remarks}
                onChange={handleChange}
                placeholder="Add general context or notes regarding the scorecard evaluations..."
              />
            </div>

            {/* Live Preview panel */}
            <div className="preview-panel">
              <div className="preview-score-box">
                <div className="preview-score-value">{score}%</div>
                <div className="preview-score-label">Estimated Performance Score</div>
              </div>
              <div className="preview-score-box">
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <span className={`badge ${rating.toLowerCase().replace(/ /g, '-')}`} style={{ fontSize: '18px', padding: '6px 16px' }}>
                    {rating}
                  </span>
                  <div className="preview-score-label" style={{ marginTop: 8 }}>KPI Rating</div>
                </div>
              </div>
            </div>

          </div>

          <div className="btn-group">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleCancel}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              <Save size={16} />
              {loading ? 'Saving Record...' : 'Save Scorecard'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default EntryForm;
