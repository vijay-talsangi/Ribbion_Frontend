import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/layout/Layout';
import HomePage from './pages/home/HomePage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import AskQuestionPage from './pages/ask/AskQuestionPage';
import QuestionDetailPage from './pages/question/QuestionDetailPage';
import UserProfilePage from './pages/profile/UserProfilePage';
import TagsPage from './pages/tags/TagsPage';
import TaggedQuestionsPage from './pages/tagged/TaggedQuestionsPage';
import SearchPage from './pages/search/SearchPage';
import SettingsPage from './pages/settings/SettingsPage';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#1a2235',
              color: '#f1f5f9',
              border: '1px solid rgba(148, 163, 184, 0.1)',
              borderRadius: '12px',
              fontSize: '14px',
            },
            success: {
              iconTheme: { primary: '#10b981', secondary: '#fff' },
            },
            error: {
              iconTheme: { primary: '#ef4444', secondary: '#fff' },
            },
          }}
        />
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/ask" element={<AskQuestionPage />} />
            <Route path="/questions/:id" element={<QuestionDetailPage />} />
            <Route path="/questions/tagged/:tag" element={<TaggedQuestionsPage />} />
            <Route path="/users/:id" element={<UserProfilePage />} />
            <Route path="/tags" element={<TagsPage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
