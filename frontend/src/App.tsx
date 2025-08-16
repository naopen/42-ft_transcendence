import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthStore } from './store/authStore';
import Layout from './components/Layout';
import Home from './pages/Home';
import Login from './pages/Login';
import Game from './pages/Game';
import Tournament from './pages/Tournament';
import Leaderboard from './pages/Leaderboard';
import Profile from './pages/Profile';
import Stats from './pages/Stats';

function AppContent() {
  const { isAuthenticated, checkAuth, loading } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Handle OAuth callback
    const urlParams = new URLSearchParams(location.search);
    const token = urlParams.get('token');
    const redirect = urlParams.get('redirect');
    const error = urlParams.get('error');

    if (error) {
      // Clear URL parameters and show error
      window.history.replaceState({}, document.title, location.pathname);
      console.error('Authentication error:', error);
      // Optionally show user-friendly error message
      return;
    }

    if (token) {
      localStorage.setItem('token', token);
      // Clear URL parameters
      window.history.replaceState({}, document.title, location.pathname);

      // Check auth and then redirect
      checkAuth().then((isAuthSuccess) => {
        if (isAuthSuccess) {
          if (redirect === 'game') {
            navigate('/game');
          } else {
            navigate('/');
          }
        }
      });
    } else {
      // Check authentication status on app load
      checkAuth();
    }
  }, [checkAuth, navigate, location]);

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-42-dark via-42-gray to-42-dark flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-42-primary"></div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/" />} />
      <Route
        path="/"
        element={
          isAuthenticated ? (
            <Layout>
              <Home />
            </Layout>
          ) : (
            <Navigate to="/login" />
          )
        }
      />
      <Route
        path="/game/:id?"
        element={
          isAuthenticated ? (
            <Layout>
              <Game />
            </Layout>
          ) : (
            <Navigate to="/login" />
          )
        }
      />
      <Route
        path="/tournament/:id?"
        element={
          isAuthenticated ? (
            <Layout>
              <Tournament />
            </Layout>
          ) : (
            <Navigate to="/login" />
          )
        }
      />
      <Route
        path="/leaderboard"
        element={
          isAuthenticated ? (
            <Layout>
              <Leaderboard />
            </Layout>
          ) : (
            <Navigate to="/login" />
          )
        }
      />
      <Route
        path="/profile/:id?"
        element={
          isAuthenticated ? (
            <Layout>
              <Profile />
            </Layout>
          ) : (
            <Navigate to="/login" />
          )
        }
      />
      <Route
        path="/stats/:id?"
        element={
          isAuthenticated ? (
            <Layout>
              <Stats />
            </Layout>
          ) : (
            <Navigate to="/login" />
          )
        }
      />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
