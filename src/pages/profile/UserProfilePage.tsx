import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MessageSquare, Award, Calendar, Pencil } from 'lucide-react';
import { usersApi, type UserProfile, type QuestionSummary, type AnswerData, type PagedData } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { timeAgo, formatNumber } from '../../utils/format';
import './UserProfilePage.css';

export default function UserProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [tab, setTab] = useState<'questions' | 'answers'>('questions');
  const [questions, setQuestions] = useState<QuestionSummary[]>([]);
  const [answers, setAnswers] = useState<AnswerData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const u = await usersApi.getUser(Number(id));
      setProfile(u);
      const [qData, aData] = await Promise.all([
        usersApi.getUserQuestions(Number(id), 0, 20),
        usersApi.getUserAnswers(Number(id), 0, 20),
      ]) as [PagedData<QuestionSummary>, PagedData<AnswerData>];
      setQuestions(qData.content);
      setAnswers(aData.content);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  if (loading) return <div className="loading-container"><div className="spinner" /></div>;
  if (!profile) return <div className="empty-state"><div className="empty-state-title">User not found</div></div>;

  const isOwnProfile = currentUser?.id === profile.id;

  return (
    <div className="profile-page animate-fade-in">
      <div className="profile-header glass-card">
        <div className="profile-avatar-lg">
          {(profile.displayName || profile.username)[0].toUpperCase()}
        </div>
        <div className="profile-info">
          <h1 className="profile-name">{profile.displayName || profile.username}</h1>
          <p className="profile-username">@{profile.username}</p>
          {profile.bio && <p className="profile-bio">{profile.bio}</p>}
          <div className="profile-stats">
            <div className="profile-stat">
              <Award /> <strong>{formatNumber(profile.reputation)}</strong> reputation
            </div>
            <div className="profile-stat">
              <MessageSquare /> <strong>{questions.length}</strong> questions
            </div>
            <div className="profile-stat">
              <Calendar /> Joined {timeAgo(profile.createdAt)}
            </div>
          </div>
        </div>
        {isOwnProfile && (
          <Link to="/settings" className="btn btn-secondary btn-sm profile-edit-btn">
            <Pencil /> Edit Profile
          </Link>
        )}
      </div>

      {/* Tabs */}
      <div className="profile-tabs">
        <button className={`profile-tab ${tab === 'questions' ? 'active' : ''}`} onClick={() => setTab('questions')}>
          Questions ({questions.length})
        </button>
        <button className={`profile-tab ${tab === 'answers' ? 'active' : ''}`} onClick={() => setTab('answers')}>
          Answers ({answers.length})
        </button>
      </div>

      {/* Tab Content */}
      <div className="profile-content">
        {tab === 'questions' ? (
          questions.length > 0 ? questions.map(q => (
            <Link key={q.id} to={`/questions/${q.id}`} className="profile-item glass-card">
              <div className="pi-votes">{q.voteCount} votes</div>
              <div className="pi-body">
                <h4 className="pi-title">{q.title}</h4>
                <span className="pi-time">{timeAgo(q.createdAt)}</span>
              </div>
              {q.status === 'SOLVED' && <span className="badge badge-solved">Solved</span>}
            </Link>
          )) : <div className="empty-state"><p>No questions yet</p></div>
        ) : (
          answers.length > 0 ? answers.map(a => (
            <Link key={a.id} to={`/questions/${a.questionId}`} className="profile-item glass-card">
              <div className="pi-votes">{a.voteCount} votes</div>
              <div className="pi-body">
                <p className="pi-answer-body">{a.body.slice(0, 120)}...</p>
                <span className="pi-time">{timeAgo(a.createdAt)}</span>
              </div>
              {a.accepted && <span className="badge badge-solved">Accepted</span>}
            </Link>
          )) : <div className="empty-state"><p>No answers yet</p></div>
        )}
      </div>
    </div>
  );
}
