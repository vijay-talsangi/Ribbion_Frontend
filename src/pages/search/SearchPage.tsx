import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { FiSearch, FiChevronUp, FiMessageSquare, FiEye, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { questionsApi, type QuestionSummary, type PagedData } from '../../services/api';
import { timeAgo, formatNumber } from '../../utils/format';
import './SearchPage.css';

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const currentPage = parseInt(searchParams.get('page') || '0');

  const [data, setData] = useState<PagedData<QuestionSummary> | null>(null);
  const [loading, setLoading] = useState(false);

  const doSearch = useCallback(async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const result = await questionsApi.search(query, currentPage, 10);
      setData(result);
    } catch { setData(null); }
    finally { setLoading(false); }
  }, [query, currentPage]);

  useEffect(() => { doSearch(); }, [doSearch]);

  return (
    <div className="search-page animate-fade-in">
      <div className="search-header">
        <FiSearch className="search-header-icon" />
        <div>
          <h1 className="search-title">Search Results</h1>
          <p className="search-query">
            {data ? `${data.totalElements} result${data.totalElements !== 1 ? 's' : ''} for ` : 'Searching for '}
            "<strong>{query}</strong>"
          </p>
        </div>
      </div>

      {loading ? (
        <div className="loading-container"><div className="spinner" /></div>
      ) : data && data.content.length > 0 ? (
        <>
          <div className="search-results">
            {data.content.map((q, i) => (
              <Link
                key={q.id}
                to={`/questions/${q.id}`}
                className="search-result glass-card animate-fade-in"
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                <div className="sr-stats">
                  <span><FiChevronUp /> {formatNumber(q.voteCount)}</span>
                  <span><FiMessageSquare /> {q.answerCount}</span>
                  <span><FiEye /> {formatNumber(q.viewCount)}</span>
                </div>
                <div className="sr-body">
                  <h3 className="sr-title">{q.title}</h3>
                  <div className="sr-meta">
                    <div className="sr-tags">
                      {q.tags.map(t => <span key={t.name} className="tag">{t.name}</span>)}
                    </div>
                    <span className="sr-time">{q.author.displayName || q.author.username} · {timeAgo(q.createdAt)}</span>
                  </div>
                </div>
                {q.status === 'SOLVED' && <span className="badge badge-solved">Solved</span>}
              </Link>
            ))}
          </div>

          {data.totalPages > 1 && (
            <div className="pagination">
              <Link
                to={`/search?q=${encodeURIComponent(query)}&page=${currentPage - 1}`}
                className={`btn btn-ghost btn-sm ${currentPage === 0 ? 'disabled' : ''}`}
              >
                <FiChevronLeft /> Prev
              </Link>
              <span className="page-info">Page {currentPage + 1} of {data.totalPages}</span>
              <Link
                to={`/search?q=${encodeURIComponent(query)}&page=${currentPage + 1}`}
                className={`btn btn-ghost btn-sm ${data.last ? 'disabled' : ''}`}
              >
                Next <FiChevronRight />
              </Link>
            </div>
          )}
        </>
      ) : (
        <div className="empty-state">
          <div className="empty-state-icon">🔍</div>
          <div className="empty-state-title">No results found</div>
          <p>Try different keywords or browse <Link to="/tags">tags</Link></p>
        </div>
      )}
    </div>
  );
}
