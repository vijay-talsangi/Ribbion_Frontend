import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, X, Hash } from 'lucide-react';
import { questionsApi, tagsApi, type TagData } from '../../services/api';
import { ApiError } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import './AskQuestionPage.css';

export default function AskQuestionPage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<TagData[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isAuthenticated) {
      toast.error('Please log in to ask a question');
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  const searchTags = useCallback(async (query: string) => {
    if (query.length < 1) { setSuggestions([]); return; }
    try {
      const data = await tagsApi.search(query, 0, 6);
      setSuggestions(data.content.filter(t => !tags.includes(t.name)));
    } catch { setSuggestions([]); }
  }, [tags]);

  useEffect(() => {
    const timer = setTimeout(() => searchTags(tagInput), 300);
    return () => clearTimeout(timer);
  }, [tagInput, searchTags]);

  const addTag = (name: string) => {
    const normalized = name.toLowerCase().trim();
    if (normalized && !tags.includes(normalized) && tags.length < 5) {
      setTags([...tags, normalized]);
    }
    setTagInput('');
    setSuggestions([]);
  };

  const removeTag = (name: string) => {
    setTags(tags.filter(t => t !== name));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(tagInput);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    try {
      const question = await questionsApi.create({ title, body, tagNames: tags });
      toast.success('Question posted!');
      navigate(`/questions/${question.id}`);
    } catch (err) {
      if (err instanceof ApiError && err.data) {
        setErrors(err.data);
      } else if (err instanceof ApiError) {
        toast.error(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ask-page animate-fade-in">
      <h1 className="ask-title">Ask a Question</h1>
      <p className="ask-subtitle">Get answers from the MIT WPU community</p>

      <form onSubmit={handleSubmit} className="ask-form glass-card">
        {/* Title */}
        <div className="form-group">
          <label className="form-label">Question Title</label>
          <input
            type="text"
            className={`form-input ${errors.title ? 'input-error' : ''}`}
            placeholder="e.g. How does virtual memory work in operating systems?"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            minLength={10}
            maxLength={300}
            id="ask-title"
          />
          {errors.title && <span className="field-error">{errors.title}</span>}
          <span className="char-count">{title.length}/300</span>
        </div>

        {/* Body */}
        <div className="form-group">
          <label className="form-label">Details</label>
          <textarea
            className={`form-input form-textarea ${errors.body ? 'input-error' : ''}`}
            placeholder="Explain your question in detail. Include what you've tried, relevant code, or specific concepts you're confused about..."
            value={body}
            onChange={(e) => setBody(e.target.value)}
            required
            minLength={20}
            rows={8}
            id="ask-body"
          />
          {errors.body && <span className="field-error">{errors.body}</span>}
        </div>

        {/* Tags */}
        <div className="form-group">
          <label className="form-label">Tags <span style={{ color: 'var(--text-tertiary)' }}>(up to 5)</span></label>
          <div className="tag-input-wrapper">
            <div className="tag-list-inline">
              {tags.map(tag => (
                <span key={tag} className="tag tag-removable">
                  <Hash style={{ fontSize: '0.6rem' }} />{tag}
                  <button type="button" onClick={() => removeTag(tag)} className="tag-remove"><X /></button>
                </span>
              ))}
              {tags.length < 5 && (
                <input
                  type="text"
                  className="tag-input-inline"
                  placeholder={tags.length === 0 ? 'Add tags...' : ''}
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                  id="ask-tags"
                />
              )}
            </div>
            {suggestions.length > 0 && (
              <div className="tag-suggestions">
                {suggestions.map(s => (
                  <button
                    key={s.id}
                    type="button"
                    className="tag-suggestion"
                    onClick={() => addTag(s.name)}
                  >
                    <Hash /> {s.name}
                    <span className="tag-suggestion-count">{s.questionCount} questions</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <button type="submit" className="btn btn-primary btn-lg" disabled={loading} id="ask-submit">
          {loading ? <span className="spinner" style={{ width: 20, height: 20 }} /> : <><Send /> Post Question</>}
        </button>
      </form>
    </div>
  );
}
