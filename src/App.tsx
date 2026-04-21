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
              background: '#111111',
              color: '#f5f5f5',
              border: '1px solid rgba(255, 255, 255, 0.14)',
              borderRadius: '12px',
              fontSize: '14px',
            },
            success: {
              iconTheme: { primary: '#f2f2f2', secondary: '#111' },
            },
            error: {
              iconTheme: { primary: '#d8d8d8', secondary: '#111' },
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
