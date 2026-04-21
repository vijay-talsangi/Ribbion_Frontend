import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronUp, ChevronDown, Check, MessageCircle, Hash, Eye, Clock3, Trash2, CircleHelp } from 'lucide-react';
import {
  questionsApi, answersApi, votesApi, commentsApi,
  type QuestionDetail, type AnswerData, type CommentData, type VoteData, type PagedData
} from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { timeAgo } from '../../utils/format';
import toast from 'react-hot-toast';
import './QuestionDetailPage.css';

export default function QuestionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user, isAuthenticated } = useAuth();
  const [question, setQuestion] = useState<QuestionDetail | null>(null);
  const [answers, setAnswers] = useState<AnswerData[]>([]);
  const [questionComments, setQuestionComments] = useState<CommentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [answerBody, setAnswerBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [questionVote, setQuestionVote] = useState<VoteData | null>(null);
  const [answerVotes, setAnswerVotes] = useState<Record<number, VoteData>>({});

  const fetchQuestion = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const q = await questionsApi.get(Number(id));
      setQuestion(q);

      const [ansData, cmtData] = await Promise.all([
        answersApi.list(Number(id), 0, 50),
        commentsApi.listForQuestion(Number(id), 0, 50),
      ]);
      setAnswers(ansData.content);
      setQuestionComments(cmtData.content);

      // Fetch vote statuses if logged in
      if (isAuthenticated) {
        try {
          const qv = await votesApi.status('QUESTION', Number(id));
          setQuestionVote(qv);
        } catch { /* no vote yet */ }

        const votePromises = ansData.content.map(async (a) => {
          try {
            const av = await votesApi.status('ANSWER', a.id);
            return [a.id, av] as const;
          } catch {
            return [a.id, null] as const;
          }
        });
        const voteResults = await Promise.all(votePromises);
        const voteMap: Record<number, VoteData> = {};
        voteResults.forEach(([aid, v]) => { if (v) voteMap[aid] = v; });
        setAnswerVotes(voteMap);
      }
    } catch {
      toast.error('Question not found');
    } finally {
      setLoading(false);
    }
  }, [id, isAuthenticated]);

  useEffect(() => { fetchQuestion(); }, [fetchQuestion]);

  const handleVote = async (targetType: 'QUESTION' | 'ANSWER', targetId: number, value: 1 | -1) => {
    if (!isAuthenticated) { toast.error('Please log in to vote'); return; }
    try {
      const result = await votesApi.cast({ targetType, targetId, value });
      if (targetType === 'QUESTION') {
        setQuestionVote(result);
        setQuestion(q => q ? { ...q, voteCount: result.currentVoteCount } : q);
      } else {
        setAnswerVotes(prev => ({ ...prev, [targetId]: result }));
        setAnswers(prev => prev.map(a => a.id === targetId ? { ...a, voteCount: result.currentVoteCount } : a));
      }
    } catch (err) {
      toast.error((err as Error).message || 'Vote failed');
    }
  };

  const handlePostAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) { toast.error('Please log in to answer'); return; }
    setSubmitting(true);
    try {
      const answer = await answersApi.create(Number(id), answerBody);
      setAnswers(prev => [...prev, answer]);
      setAnswerBody('');
      setQuestion(q => q ? { ...q, answerCount: q.answerCount + 1 } : q);
      toast.success('Answer posted!');
    } catch (err) {
      toast.error((err as Error).message || 'Failed to post answer');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAccept = async (answerId: number) => {
    try {
      await answersApi.accept(answerId);
      setAnswers(prev => prev.map(a => ({
        ...a,
        accepted: a.id === answerId,
      })));
      setQuestion(q => q ? { ...q, status: 'SOLVED' } : q);
      toast.success('Answer accepted!');
    } catch (err) {
      toast.error((err as Error).message || 'Failed to accept');
    }
  };

  const handleDeleteAnswer = async (answerId: number) => {
    if (!confirm('Delete this answer?')) return;
    try {
      await answersApi.delete(answerId);
      setAnswers(prev => prev.filter(a => a.id !== answerId));
      setQuestion(q => q ? { ...q, answerCount: q.answerCount - 1 } : q);
      toast.success('Answer deleted');
    } catch (err) {
      toast.error((err as Error).message || 'Failed to delete');
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner" />
      </div>
    );
  }

  if (!question) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon"><CircleHelp /></div>
        <div className="empty-state-title">Question not found</div>
      </div>
    );
  }

  return (
    <div className="qd-page animate-fade-in">
      {/* Question Header */}
      <div className="qd-header">
        <h1 className="qd-title">{question.title}</h1>
        <div className="qd-meta">
          <span><Clock3 /> Asked {timeAgo(question.createdAt)}</span>
          <span><Eye /> {question.viewCount} views</span>
          {question.status === 'SOLVED' && <span className="badge badge-solved">Solved</span>}
        </div>
      </div>

      {/* Question Body + Vote */}
      <div className="qd-content glass-card">
        <div className="qd-left">
          <VoteWidget
            count={question.voteCount}
            userVote={questionVote?.userVote || 0}
            onUpvote={() => handleVote('QUESTION', question.id, 1)}
            onDownvote={() => handleVote('QUESTION', question.id, -1)}
          />
        </div>
        <div className="qd-right">
          <div className="qd-body">{question.body}</div>
          <div className="qd-tags">
            {question.tags.map(tag => (
              <Link key={tag.name} to={`/questions/tagged/${tag.name}`} className="tag">
                <Hash style={{ fontSize: '0.6rem' }} /> {tag.name}
              </Link>
            ))}
          </div>
          <div className="qd-author-bar">
            <Link to={`/users/${question.author.id}`} className="qd-author">
              <div className="qd-author-avatar">
                {(question.author.displayName || question.author.username)[0].toUpperCase()}
              </div>
              <div>
                <div className="qd-author-name">{question.author.displayName || question.author.username}</div>
                <div className="qd-author-rep">{question.author.reputation} rep</div>
              </div>
            </Link>
          </div>

          {/* Question Comments */}
          <CommentSection
            comments={questionComments}
            onAddComment={async (body) => {
              const c = await commentsApi.addToQuestion(question.id, body);
              setQuestionComments(prev => [...prev, c]);
            }}
            isAuthenticated={isAuthenticated}
          />
        </div>
      </div>

      {/* Answers Section */}
      <div className="qd-answers-header">
        <h2>{question.answerCount} Answer{question.answerCount !== 1 ? 's' : ''}</h2>
      </div>

      <div className="qd-answers-list">
        {answers.map(answer => (
          <AnswerCard
            key={answer.id}
            answer={answer}
            userVote={answerVotes[answer.id]?.userVote || 0}
            isQuestionAuthor={user?.id === question.author.id}
            isAnswerAuthor={user?.id === answer.author.id}
            onUpvote={() => handleVote('ANSWER', answer.id, 1)}
            onDownvote={() => handleVote('ANSWER', answer.id, -1)}
            onAccept={() => handleAccept(answer.id)}
            onDelete={() => handleDeleteAnswer(answer.id)}
            isAuthenticated={isAuthenticated}
          />
        ))}
      </div>

      {/* Post Answer Form */}
      <div className="qd-answer-form glass-card">
        <h3>Your Answer</h3>
        <form onSubmit={handlePostAnswer}>
          <textarea
            className="form-input form-textarea"
            placeholder={isAuthenticated ? "Write your answer here..." : "Please log in to answer"}
            value={answerBody}
            onChange={(e) => setAnswerBody(e.target.value)}
            rows={6}
            disabled={!isAuthenticated}
            id="answer-body"
          />
          <button
            type="submit"
            className="btn btn-primary"
            disabled={!isAuthenticated || submitting || answerBody.length < 10}
            id="post-answer-btn"
          >
            {submitting ? <span className="spinner" style={{ width: 18, height: 18 }} /> : 'Post Answer'}
          </button>
        </form>
      </div>
    </div>
  );
}

/* ================== Sub-components ================== */

function VoteWidget({ count, userVote, onUpvote, onDownvote }: {
  count: number; userVote: number; onUpvote: () => void; onDownvote: () => void;
}) {
  return (
    <div className="vote-widget">
      <button className={`vote-btn ${userVote === 1 ? 'active-up' : ''}`} onClick={onUpvote}>
        <ChevronUp />
      </button>
      <span className="vote-count">{count}</span>
      <button className={`vote-btn ${userVote === -1 ? 'active-down' : ''}`} onClick={onDownvote}>
        <ChevronDown />
      </button>
    </div>
  );
}

function AnswerCard({ answer, userVote, isQuestionAuthor, isAnswerAuthor, onUpvote, onDownvote, onAccept, onDelete, isAuthenticated }: {
  answer: AnswerData; userVote: number; isQuestionAuthor: boolean; isAnswerAuthor: boolean;
  onUpvote: () => void; onDownvote: () => void; onAccept: () => void; onDelete: () => void;
  isAuthenticated: boolean;
}) {
  const [comments, setComments] = useState<CommentData[]>([]);
  const [showComments, setShowComments] = useState(false);

  const loadComments = async () => {
    if (showComments) { setShowComments(false); return; }
    try {
      const data: PagedData<CommentData> = await commentsApi.listForAnswer(answer.id, 0, 50);
      setComments(data.content);
    } catch { /* ignore */ }
    setShowComments(true);
  };

  return (
    <div className={`answer-card glass-card ${answer.accepted ? 'accepted' : ''}`} id={`answer-${answer.id}`}>
      <div className="qd-left">
        <VoteWidget count={answer.voteCount} userVote={userVote} onUpvote={onUpvote} onDownvote={onDownvote} />
        {answer.accepted && (
          <div className="accepted-badge" title="Accepted answer">
            <Check />
          </div>
        )}
        {isQuestionAuthor && !answer.accepted && (
          <button className="accept-btn" onClick={onAccept} title="Accept this answer">
            <Check />
          </button>
        )}
      </div>
      <div className="qd-right">
        <div className="qd-body">{answer.body}</div>
        <div className="qd-author-bar">
          <Link to={`/users/${answer.author.id}`} className="qd-author">
            <div className="qd-author-avatar">
              {(answer.author.displayName || answer.author.username)[0].toUpperCase()}
            </div>
            <div>
              <div className="qd-author-name">{answer.author.displayName || answer.author.username}</div>
              <div className="qd-author-rep">{answer.author.reputation} rep · {timeAgo(answer.createdAt)}</div>
            </div>
          </Link>
          <div className="answer-actions">
            <button className="btn btn-ghost btn-sm" onClick={loadComments}>
              <MessageCircle /> Comments
            </button>
            {isAnswerAuthor && (
              <button className="btn btn-ghost btn-sm" onClick={onDelete} style={{ color: 'var(--color-error)' }}>
                <Trash2 />
              </button>
            )}
          </div>
        </div>

        {showComments && (
          <CommentSection
            comments={comments}
            onAddComment={async (body) => {
              const c = await commentsApi.addToAnswer(answer.id, body);
              setComments(prev => [...prev, c]);
            }}
            isAuthenticated={isAuthenticated}
          />
        )}
      </div>
    </div>
  );
}

function CommentSection({ comments, onAddComment, isAuthenticated }: {
  comments: CommentData[]; onAddComment: (body: string) => Promise<void>; isAuthenticated: boolean;
}) {
  const [showForm, setShowForm] = useState(false);
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!body.trim()) return;
    setSubmitting(true);
    try {
      await onAddComment(body);
      setBody('');
      setShowForm(false);
      toast.success('Comment added');
    } catch (err) {
      toast.error((err as Error).message || 'Failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="comments-section">
      {comments.length > 0 && (
        <div className="comments-list">
          {comments.map(c => (
            <div key={c.id} className="comment-item">
              <span className="comment-body">{c.body}</span>
              <span className="comment-meta">
                — <Link to={`/users/${c.author.id}`}>{c.author.displayName || c.author.username}</Link>{' '}
                {timeAgo(c.createdAt)}
              </span>
            </div>
          ))}
        </div>
      )}
      {isAuthenticated && !showForm && (
        <button className="add-comment-btn" onClick={() => setShowForm(true)}>
          Add a comment
        </button>
      )}
      {showForm && (
        <div className="comment-form">
          <input
            type="text"
            className="form-input comment-input"
            placeholder="Write a comment..."
            value={body}
            onChange={e => setBody(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            maxLength={1000}
          />
          <button className="btn btn-sm btn-primary" onClick={handleSubmit} disabled={submitting || !body.trim()}>
            Post
          </button>
        </div>
      )}
    </div>
  );
}
