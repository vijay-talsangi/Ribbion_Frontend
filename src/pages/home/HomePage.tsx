import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { FiMessageSquare, FiEye, FiChevronUp, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { questionsApi, type QuestionSummary, type PagedData } from '../../services/api';
import { timeAgo, formatNumber } from '../../utils/format';
import './HomePage.css';

const SORT_OPTIONS = [
  { key: 'NEWEST', label: 'Newest' },
  { key: 'VOTES', label: 'Top Voted' },
  { key: 'VIEWS', label: 'Most Viewed' },
  { key: 'UNANSWERED', label: 'Unanswered' },
];

export default function HomePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeSort = searchParams.get('sort') || 'NEWEST';
  const currentPage = parseInt(searchParams.get('page') || '0');

  const [data, setData] = useState<PagedData<QuestionSummary> | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    try {
      const result = await questionsApi.list(activeSort, currentPage, 10);
      setData(result);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [activeSort, currentPage]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  const setSort = (sort: string) => {
    setSearchParams({ sort, page: '0' });
  };

  const goToPage = (page: number) => {
    setSearchParams({ sort: activeSort, page: page.toString() });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="home-page">
      <div className="home-header">
        <div>
          <h1 className="home-title">All Questions</h1>
          <p className="home-subtitle">
            {data ? `${data.totalElements} question${data.totalElements !== 1 ? 's' : ''}` : 'Loading...'}
          </p>
        </div>
        <Link to="/ask" className="btn btn-primary" id="home-ask-btn">
          Ask a Question
        </Link>
      </div>

      {/* Sort Tabs */}
      <div className="sort-tabs">
        {SORT_OPTIONS.map(opt => (
          <button
            key={opt.key}
            className={`sort-tab ${activeSort === opt.key ? 'active' : ''}`}
            onClick={() => setSort(opt.key)}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Question List */}
      <div className="question-list">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="question-card skeleton-card">
              <div className="skeleton skeleton-title" />
              <div className="skeleton skeleton-text" style={{ width: '80%' }} />
              <div className="skeleton skeleton-text" style={{ width: '40%' }} />
            </div>
          ))
        ) : data && data.content.length > 0 ? (
          data.content.map((q, i) => (
            <QuestionCard key={q.id} question={q} index={i} />
          ))
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">🤔</div>
            <div className="empty-state-title">No questions yet</div>
            <p>Be the first to ask a question!</p>
            <Link to="/ask" className="btn btn-primary" style={{ marginTop: '1rem' }}>
              Ask a Question
            </Link>
          </div>
        )}
      </div>

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="pagination">
          <button
            className="btn btn-ghost btn-sm"
            disabled={currentPage === 0}
            onClick={() => goToPage(currentPage - 1)}
          >
            <FiChevronLeft /> Prev
          </button>
          <div className="page-info">
            Page {currentPage + 1} of {data.totalPages}
          </div>
          <button
            className="btn btn-ghost btn-sm"
            disabled={data.last}
            onClick={() => goToPage(currentPage + 1)}
          >
            Next <FiChevronRight />
          </button>
        </div>
      )}
    </div>
  );
}

function QuestionCard({ question, index }: { question: QuestionSummary; index: number }) {
  return (
    <Link
      to={`/questions/${question.id}`}
      className="question-card animate-fade-in"
      style={{ animationDelay: `${index * 0.05}s` }}
      id={`question-${question.id}`}
    >
      <div className="qc-stats">
        <div className="qc-stat">
          <FiChevronUp />
          <span className="qc-stat-num">{formatNumber(question.voteCount)}</span>
          <span className="qc-stat-label">votes</span>
        </div>
        <div className={`qc-stat ${question.answerCount > 0 ? 'has-answers' : ''} ${question.status === 'SOLVED' ? 'solved' : ''}`}>
          <FiMessageSquare />
          <span className="qc-stat-num">{question.answerCount}</span>
          <span className="qc-stat-label">answers</span>
        </div>
        <div className="qc-stat">
          <FiEye />
          <span className="qc-stat-num">{formatNumber(question.viewCount)}</span>
          <span className="qc-stat-label">views</span>
        </div>
      </div>

      <div className="qc-body">
        <h3 className="qc-title">{question.title}</h3>
        <div className="qc-meta">
          <div className="qc-tags">
            {question.tags.map(tag => (
              <span key={tag.name} className="tag">{tag.name}</span>
            ))}
          </div>
          <div className="qc-info">
            {question.status === 'SOLVED' && <span className="badge badge-solved">✓ Solved</span>}
            <span className="qc-author">{question.author.displayName || question.author.username}</span>
            <span className="qc-time">{timeAgo(question.createdAt)}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
