import React, { useEffect, useState } from 'react';
import { api } from '../utils/api';
import { Star, MessageSquare, Send, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react';

const RateFaculty = ({ user, setCurrentTab }) => {
  const [pendingSessions, setPendingSessions] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form State
  const [selectedSessionId, setSelectedSessionId] = useState('');
  const [teachingQuality, setTeachingQuality] = useState(0);
  const [hoverTeachingQuality, setHoverTeachingQuality] = useState(0);
  const [subjectKnowledge, setSubjectKnowledge] = useState(0);
  const [hoverSubjectKnowledge, setHoverSubjectKnowledge] = useState(0);
  const [communicationSkills, setCommunicationSkills] = useState(0);
  const [hoverCommunicationSkills, setHoverCommunicationSkills] = useState(0);
  const [interactionWithStudents, setInteractionWithStudents] = useState(0);
  const [hoverInteractionWithStudents, setHoverInteractionWithStudents] = useState(0);
  const [classPreparation, setClassPreparation] = useState(0);
  const [hoverClassPreparation, setHoverClassPreparation] = useState(0);

  const [comments, setComments] = useState('');
  const [academicYear, setAcademicYear] = useState('2025-2026');
  const [semester, setSemester] = useState('Semester 1');

  const loadPendingSessions = async () => {
    try {
      const response = await api.get('/feedbacks/pending-sessions');
      const rawSessions = response.pendingSessions || [];
      
      // Filter out duplicate Faculty + Course combinations
      const unique = [];
      const seen = new Set();
      for (const s of rawSessions) {
        const key = `${s.faculty_id}-${s.course_id}`;
        if (!seen.has(key)) {
          seen.add(key);
          unique.push(s);
        }
      }
      setPendingSessions(unique);
    } catch (err) {
      console.error('Failed to load pending sessions:', err);
    }
  };

  const loadSubmissions = async () => {
    setLoading(true);
    try {
      const response = await api.get('/feedbacks/my');
      setSubmissions(response.feedbacks || []);
    } catch (err) {
      console.error('Failed to load submissions:', err);
      setError('Could not load your feedback history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPendingSessions();
    loadSubmissions();
  }, [user.id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!selectedSessionId) {
      setError('Please select a completed class session to evaluate.');
      return;
    }

    if (
      teachingQuality === 0 ||
      subjectKnowledge === 0 ||
      communicationSkills === 0 ||
      interactionWithStudents === 0 ||
      classPreparation === 0
    ) {
      setError('Please select a rating (1 to 5 stars) for all evaluation dimensions.');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/feedbacks', {
        class_session_id: selectedSessionId,
        teaching_quality: teachingQuality,
        subject_knowledge: subjectKnowledge,
        communication_skills: communicationSkills,
        interaction_with_students: interactionWithStudents,
        class_preparation: classPreparation,
        comments,
        academic_year: academicYear,
        semester
      });

      setSuccess('Your class session evaluation has been successfully recorded!');
      setTeachingQuality(0);
      setSubjectKnowledge(0);
      setCommunicationSkills(0);
      setInteractionWithStudents(0);
      setClassPreparation(0);
      setComments('');
      setSelectedSessionId('');
      loadPendingSessions();
      loadSubmissions();
    } catch (err) {
      console.error('Submit rating error:', err);
      setError(err.message || 'Failed to submit rating.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: 950, margin: '0 auto' }}>
      <div className="page-header" style={{ marginBottom: 24 }}>
        <div>
          <h1 className="page-title">Daily Class Evaluation Portal</h1>
          <p className="page-subtitle">
            Submit your feedback coordinates for classes you attended. Your daily feedback directly updates the faculty performance metrics.
          </p>
        </div>
      </div>

      {success && (
        <div className="alert-bar success" style={{ padding: '14px 20px', borderRadius: 10, display: 'flex', gap: 12, alignItems: 'center', marginBottom: 24 }}>
          <CheckCircle size={20} style={{ flexShrink: 0 }} />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="alert-bar error" style={{ padding: '14px 20px', borderRadius: 10, display: 'flex', gap: 12, alignItems: 'center', marginBottom: 24 }}>
          <AlertTriangle size={20} style={{ flexShrink: 0 }} />
          <span>{error}</span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 28, alignItems: 'start' }}>
        
        {/* Rating Form Card */}
        <div className="form-container" style={{ margin: 0, width: '100%', maxWidth: 'none', backgroundColor: 'var(--panel-bg)', borderRadius: 12, padding: 28 }}>
          <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Star size={20} fill="#f59e0b" color="#f59e0b" /> Submit Session Feedback
          </h3>

          <form onSubmit={handleSubmit}>
            <div className="form-group" style={{ marginBottom: 20 }}>
              <label className="form-label" style={{ fontSize: 13 }}>SELECT COMPLETED CLASS SESSION</label>
              <select
                className="form-select"
                value={selectedSessionId}
                onChange={(e) => setSelectedSessionId(e.target.value)}
                required
                style={{ padding: '10px 12px', width: '100%', borderRadius: 6, border: '1px solid var(--border)', backgroundColor: 'var(--bg-color)', color: 'var(--text-primary)' }}
              >
                <option value="">Select a completed class session...</option>
                {pendingSessions.map(session => (
                  <option key={session.id} value={session.id}>
                    {session.faculty?.name} — {session.course?.name}
                  </option>
                ))}
              </select>
              {pendingSessions.length === 0 && (
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 8, padding: '10px', backgroundColor: 'rgba(239, 68, 68, 0.08)', borderRadius: 6, border: '1px dashed rgba(239, 68, 68, 0.2)' }}>
                  No pending class sessions found. Please ensure you were marked <strong>Present</strong> in your course attendance logs to submit feedback.
                </div>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: 13 }}>ACADEMIC YEAR</label>
                <select
                  className="form-select"
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                  required
                  style={{ width: '100%', padding: '10px', borderRadius: 6, border: '1px solid var(--border)', backgroundColor: 'var(--bg-color)', color: 'var(--text-primary)' }}
                >
                  <option value="2025-2026">2025-2026</option>
                  <option value="2026-2027">2026-2027</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontSize: 13 }}>SEMESTER</label>
                <select
                  className="form-select"
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                  required
                  style={{ width: '100%', padding: '10px', borderRadius: 6, border: '1px solid var(--border)', backgroundColor: 'var(--bg-color)', color: 'var(--text-primary)' }}
                >
                  <option value="Semester 1">Semester 1</option>
                  <option value="Semester 2">Semester 2</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24, backgroundColor: 'var(--bg-color)', padding: 16, borderRadius: 8, border: '1px solid var(--border)' }}>
              <h4 style={{ fontSize: 13, fontWeight: 600, color: 'var(--primary-light)', borderBottom: '1px solid var(--border)', paddingBottom: 6, margin: 0 }}>EVALUATION DIMENSIONS</h4>
              
              {/* Teaching Quality */}
              <div>
                <label className="form-label" style={{ fontSize: 12, marginBottom: 4, display: 'block' }}>1. TEACHING QUALITY</label>
                <div style={{ display: 'flex', gap: 6, cursor: 'pointer' }}>
                  {[1, 2, 3, 4, 5].map((starIndex) => {
                    const isFilled = hoverTeachingQuality >= starIndex || (!hoverTeachingQuality && teachingQuality >= starIndex);
                    return (
                      <Star
                        key={starIndex}
                        size={22}
                        onClick={() => setTeachingQuality(starIndex)}
                        onMouseEnter={() => setHoverTeachingQuality(starIndex)}
                        onMouseLeave={() => setHoverTeachingQuality(0)}
                        style={{
                          color: isFilled ? '#eeb902' : '#cbd5e1',
                          fill: isFilled ? '#eeb902' : 'none',
                          transition: 'transform 0.15s ease'
                        }}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Subject Knowledge */}
              <div>
                <label className="form-label" style={{ fontSize: 12, marginBottom: 4, display: 'block' }}>2. SUBJECT KNOWLEDGE</label>
                <div style={{ display: 'flex', gap: 6, cursor: 'pointer' }}>
                  {[1, 2, 3, 4, 5].map((starIndex) => {
                    const isFilled = hoverSubjectKnowledge >= starIndex || (!hoverSubjectKnowledge && subjectKnowledge >= starIndex);
                    return (
                      <Star
                        key={starIndex}
                        size={22}
                        onClick={() => setSubjectKnowledge(starIndex)}
                        onMouseEnter={() => setHoverSubjectKnowledge(starIndex)}
                        onMouseLeave={() => setHoverSubjectKnowledge(0)}
                        style={{
                          color: isFilled ? '#eeb902' : '#cbd5e1',
                          fill: isFilled ? '#eeb902' : 'none',
                          transition: 'transform 0.15s ease'
                        }}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Communication Skills */}
              <div>
                <label className="form-label" style={{ fontSize: 12, marginBottom: 4, display: 'block' }}>3. COMMUNICATION SKILLS</label>
                <div style={{ display: 'flex', gap: 6, cursor: 'pointer' }}>
                  {[1, 2, 3, 4, 5].map((starIndex) => {
                    const isFilled = hoverCommunicationSkills >= starIndex || (!hoverCommunicationSkills && communicationSkills >= starIndex);
                    return (
                      <Star
                        key={starIndex}
                        size={22}
                        onClick={() => setCommunicationSkills(starIndex)}
                        onMouseEnter={() => setHoverCommunicationSkills(starIndex)}
                        onMouseLeave={() => setHoverCommunicationSkills(0)}
                        style={{
                          color: isFilled ? '#eeb902' : '#cbd5e1',
                          fill: isFilled ? '#eeb902' : 'none',
                          transition: 'transform 0.15s ease'
                        }}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Interaction with Students */}
              <div>
                <label className="form-label" style={{ fontSize: 12, marginBottom: 4, display: 'block' }}>4. INTERACTION WITH STUDENTS</label>
                <div style={{ display: 'flex', gap: 6, cursor: 'pointer' }}>
                  {[1, 2, 3, 4, 5].map((starIndex) => {
                    const isFilled = hoverInteractionWithStudents >= starIndex || (!hoverInteractionWithStudents && interactionWithStudents >= starIndex);
                    return (
                      <Star
                        key={starIndex}
                        size={22}
                        onClick={() => setInteractionWithStudents(starIndex)}
                        onMouseEnter={() => setHoverInteractionWithStudents(starIndex)}
                        onMouseLeave={() => setHoverInteractionWithStudents(0)}
                        style={{
                          color: isFilled ? '#eeb902' : '#cbd5e1',
                          fill: isFilled ? '#eeb902' : 'none',
                          transition: 'transform 0.15s ease'
                        }}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Class Preparation */}
              <div>
                <label className="form-label" style={{ fontSize: 12, marginBottom: 4, display: 'block' }}>5. CLASS PREPARATION</label>
                <div style={{ display: 'flex', gap: 6, cursor: 'pointer' }}>
                  {[1, 2, 3, 4, 5].map((starIndex) => {
                    const isFilled = hoverClassPreparation >= starIndex || (!hoverClassPreparation && classPreparation >= starIndex);
                    return (
                      <Star
                        key={starIndex}
                        size={22}
                        onClick={() => setClassPreparation(starIndex)}
                        onMouseEnter={() => setHoverClassPreparation(starIndex)}
                        onMouseLeave={() => setHoverClassPreparation(0)}
                        style={{
                          color: isFilled ? '#eeb902' : '#cbd5e1',
                          fill: isFilled ? '#eeb902' : 'none',
                          transition: 'transform 0.15s ease'
                        }}
                      />
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 24 }}>
              <label className="form-label" style={{ fontSize: 13 }}>COMMENTS (OPTIONAL)</label>
              <textarea
                className="form-textarea"
                rows={3}
                placeholder="Share your experience in class, syllabus completion, or grading feedback..."
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                style={{ padding: '10px 12px', fontSize: 14, width: '100%', borderRadius: 6, border: '1px solid var(--border)', backgroundColor: 'var(--bg-color)', color: 'var(--text-primary)' }}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', height: 44, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
              disabled={submitting || pendingSessions.length === 0}
            >
              {submitting ? 'Submitting...' : 'Submit Evaluation Rating'}
              <Send size={16} />
            </button>
          </form>
        </div>

        {/* Submissions List Card */}
        <div className="form-container" style={{ margin: 0, width: '100%', maxWidth: 'none', backgroundColor: 'var(--panel-bg)', borderRadius: 12, padding: 28 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 style={{ fontSize: 18, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
              <MessageSquare size={20} color="var(--primary-light)" /> My Ratings Log
            </h3>
            <button 
              className="btn-icon" 
              onClick={loadSubmissions} 
              disabled={loading}
              title="Refresh submissions"
              style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
            >
              <RefreshCw size={14} className={loading ? 'spin' : ''} />
            </button>
          </div>

          <div style={{ maxHeight: 550, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)' }}>
                Loading logs...
              </div>
            ) : submissions.length > 0 ? (
              submissions.map((sub) => (
                <div 
                  key={sub.id} 
                  style={{
                    backgroundColor: 'var(--bg-color)',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    padding: 16,
                    fontSize: 13
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <strong style={{ fontSize: 14 }}>{sub.faculty?.name}</strong>
                    <div style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                      {Array.from({ length: 5 }, (_, i) => (
                        <Star 
                          key={i} 
                          size={13} 
                          fill={i < Math.round(sub.student_feedback_score) ? '#eeb902' : 'none'}
                          color={i < Math.round(sub.student_feedback_score) ? '#eeb902' : '#cbd5e1'}
                        />
                      ))}
                    </div>
                  </div>
                  
                  <div style={{ color: 'var(--text-secondary)', marginBottom: 6, fontSize: 11 }}>
                    Course: <strong style={{ color: 'var(--primary-light)' }}>{sub.course?.name || 'General Evaluation'} ({sub.course?.code || 'N/A'})</strong>
                  </div>

                  {sub.classSession && (
                    <div style={{ color: 'var(--text-muted)', marginBottom: 6, fontSize: 11 }}>
                      Class Session: <strong>{sub.classSession.date} {sub.classSession.time_slot}</strong>
                    </div>
                  )}

                  <div style={{ color: 'var(--text-muted)', marginBottom: 8, fontSize: 11, display: 'flex', justifyContent: 'space-between' }}>
                    <span>{sub.academic_year} • {sub.semester}</span>
                    <span>Date: {sub.rating_date || 'N/A'}</span>
                  </div>

                  {sub.comments ? (
                    <p style={{ fontStyle: 'italic', color: 'var(--text-primary)', lineBreak: 'anywhere', margin: '4px 0 0 0' }}>
                      "{sub.comments}"
                    </p>
                  ) : (
                    <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>No comments.</span>
                  )}
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)' }}>
                No evaluations submitted yet.
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default RateFaculty;
