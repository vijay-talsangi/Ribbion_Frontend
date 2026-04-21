import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { ChevronUp, MessageSquare, Eye, Hash, ChevronLeft, ChevronRight, Tags } from 'lucide-react';
import { questionsApi, type QuestionSummary, type PagedData } from '../../services/api';
import { timeAgo, formatNumber } from '../../utils/format';
import './TaggedQuestionsPage.css';

export default function TaggedQuestionsPage() {
  const { tag } = useParams<{ tag: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentPage = parseInt(searchParams.get('page') || '0');

  const [data, setData] = useState<PagedData<QuestionSummary> | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchQuestions = useCallback(async () => {
    if (!tag) return;
    setLoading(true);
    try {
      const result = await questionsApi.byTag(tag, currentPage, 10);
      setData(result);
    } catch { setData(null); }
    finally { setLoading(false); }
  }, [tag, currentPage]);

  useEffect(() => { fetchQuestions(); }, [fetchQuestions]);

  return (
    <div className="tagged-page animate-fade-in">
      <div className="tagged-header">
        <div className="tagged-tag-name">
          <Hash /> {tag}
        </div>
        <p className="tagged-count">
          {data ? `${data.totalElements} question${data.totalElements !== 1 ? 's' : ''} tagged` : 'Loading...'}
        </p>
      </div>

      {loading ? (
        <div className="loading-container"><div className="spinner" /></div>
      ) : data && data.content.length > 0 ? (
        <>
          <div className="question-list">
            {data.content.map((q, i) => (
              <Link
                key={q.id}
                to={`/questions/${q.id}`}
                className="question-card animate-fade-in"
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                <div className="qc-stats">
                  <div className="qc-stat">
                    <ChevronUp />
                    <span className="qc-stat-num">{formatNumber(q.voteCount)}</span>
                    <span className="qc-stat-label">votes</span>
                  </div>
                  <div className={`qc-stat ${q.answerCount > 0 ? 'has-answers' : ''} ${q.status === 'SOLVED' ? 'solved' : ''}`}>
                    <MessageSquare />
                    <span className="qc-stat-num">{q.answerCount}</span>
                    <span className="qc-stat-label">answers</span>
                  </div>
                  <div className="qc-stat">
                    <Eye />
                    <span className="qc-stat-num">{formatNumber(q.viewCount)}</span>
                    <span className="qc-stat-label">views</span>
                  </div>
                </div>
                <div className="qc-body">
                  <h3 className="qc-title">{q.title}</h3>
                  <div className="qc-meta">
                    <div className="qc-tags">
                      {q.tags.map(t => <span key={t.name} className="tag">{t.name}</span>)}
                    </div>
                    <div className="qc-info">
                      {q.status === 'SOLVED' && <span className="badge badge-solved">Solved</span>}
                      <span className="qc-author">{q.author.displayName || q.author.username}</span>
                      <span className="qc-time">{timeAgo(q.createdAt)}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {data.totalPages > 1 && (
            <div className="pagination">
              <button className="btn btn-ghost btn-sm" disabled={currentPage === 0}
                onClick={() => setSearchParams({ page: (currentPage - 1).toString() })}>
                <ChevronLeft /> Prev
              </button>
              <span className="page-info">Page {currentPage + 1} of {data.totalPages}</span>
              <button className="btn btn-ghost btn-sm" disabled={data.last}
                onClick={() => setSearchParams({ page: (currentPage + 1).toString() })}>
                Next <ChevronRight />
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="empty-state">
          <div className="empty-state-icon"><Tags /></div>
          <div className="empty-state-title">No questions with this tag</div>
          <p>Be the first to <Link to="/ask">ask a question</Link> with this tag!</p>
        </div>
      )}
    </div>
  );
}
