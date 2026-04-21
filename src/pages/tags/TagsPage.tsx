import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Hash, Search } from 'lucide-react';
import { tagsApi, type TagData, type PagedData } from '../../services/api';
import './TagsPage.css';

export default function TagsPage() {
  const [tags, setTags] = useState<TagData[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTags = async () => {
      setLoading(true);
      try {
        let data: PagedData<TagData>;
        if (search.trim()) {
          data = await tagsApi.search(search, 0, 50);
        } else {
          data = await tagsApi.list(0, 50);
        }
        setTags(data.content);
      } catch { /* ignore */ }
      finally { setLoading(false); }
    };

    const timer = setTimeout(fetchTags, 300);
    return () => clearTimeout(timer);
  }, [search]);

  return (
    <div className="tags-page animate-fade-in">
      <div className="tags-header">
        <h1 className="tags-title">Tags</h1>
        <p className="tags-subtitle">Browse topics to find questions you can answer</p>
      </div>

      <div className="tags-search-bar">
        <Search className="tags-search-icon" />
        <input
          type="text"
          className="form-input tags-search-input"
          placeholder="Filter by tag name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          id="tag-search"
        />
      </div>

      {loading ? (
        <div className="loading-container"><div className="spinner" /></div>
      ) : (
        <div className="tags-grid">
          {tags.length > 0 ? tags.map(tag => (
            <Link key={tag.id} to={`/questions/tagged/${tag.name}`} className="tag-card glass-card">
              <div className="tc-name"><Hash /> {tag.name}</div>
              <div className="tc-count">{tag.questionCount || 0} question{(tag.questionCount || 0) !== 1 ? 's' : ''}</div>
              {tag.description && <p className="tc-desc">{tag.description}</p>}
            </Link>
          )) : (
            <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
              <p>No tags found</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
