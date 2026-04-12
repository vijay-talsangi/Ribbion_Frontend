import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiTrendingUp, FiHash } from 'react-icons/fi';
import { tagsApi, type TagData } from '../../services/api';
import './Sidebar.css';

export default function Sidebar() {
  const [tags, setTags] = useState<TagData[]>([]);

  useEffect(() => {
    tagsApi.popular(0, 12).then(data => setTags(data.content)).catch(() => {});
  }, []);

  return (
    <aside className="sidebar">
      <div className="sidebar-section">
        <h3 className="sidebar-title">
          <FiTrendingUp /> Popular Tags
        </h3>
        <div className="sidebar-tags">
          {tags.length > 0 ? (
            tags.map(tag => (
              <Link
                key={tag.id}
                to={`/questions/tagged/${tag.name}`}
                className="tag"
              >
                <FiHash style={{ fontSize: '0.65rem' }} /> {tag.name}
                <span className="tag-count">{tag.questionCount}</span>
              </Link>
            ))
          ) : (
            <p className="sidebar-empty">No tags yet. Ask the first question!</p>
          )}
        </div>
        <Link to="/tags" className="sidebar-view-all">
          View all tags →
        </Link>
      </div>

      <div className="sidebar-section sidebar-about">
        <h3 className="sidebar-title">About Ribbion</h3>
        <p className="sidebar-desc">
          The doubt forum built for <strong>MIT WPU, Pune</strong> students. Ask questions, share knowledge, and help your peers grow.
        </p>
      </div>
    </aside>
  );
}
