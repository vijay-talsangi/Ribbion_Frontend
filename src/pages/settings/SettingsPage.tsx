import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSave, FiUser } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { usersApi, ApiError } from '../../services/api';
import toast from 'react-hot-toast';
import './SettingsPage.css';

export default function SettingsPage() {
  const { user, refreshUser, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    displayName: user?.displayName || '',
    bio: '',
    avatarUrl: '',
  });
  const [loading, setLoading] = useState(false);

  if (!isAuthenticated) {
    navigate('/login');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const updateData: Record<string, string> = {};
      if (formData.displayName) updateData.displayName = formData.displayName;
      if (formData.bio) updateData.bio = formData.bio;
      if (formData.avatarUrl) updateData.avatarUrl = formData.avatarUrl;

      await usersApi.updateMe(updateData);
      await refreshUser();
      toast.success('Profile updated!');
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message);
      else toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="settings-page animate-fade-in">
      <h1 className="settings-title">
        <FiUser /> Edit Profile
      </h1>

      <form onSubmit={handleSubmit} className="settings-form glass-card">
        <div className="form-group">
          <label className="form-label">Display Name</label>
          <input
            type="text"
            className="form-input"
            value={formData.displayName}
            onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
            maxLength={50}
            placeholder="Your display name"
            id="settings-displayname"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Avatar URL</label>
          <input
            type="url"
            className="form-input"
            value={formData.avatarUrl}
            onChange={(e) => setFormData({ ...formData, avatarUrl: e.target.value })}
            placeholder="https://example.com/avatar.png"
            id="settings-avatar"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Bio</label>
          <textarea
            className="form-input form-textarea"
            value={formData.bio}
            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
            maxLength={500}
            rows={4}
            placeholder="Tell us about yourself..."
            id="settings-bio"
          />
          <span className="char-count">{formData.bio.length}/500</span>
        </div>

        <button type="submit" className="btn btn-primary btn-lg" disabled={loading} id="settings-submit">
          {loading ? <span className="spinner" style={{ width: 20, height: 20 }} /> : <><FiSave /> Save Changes</>}
        </button>
      </form>
    </div>
  );
}
