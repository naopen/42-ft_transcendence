import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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

function App() {
  const { isAuthenticated, checkAuth } = useAuthStore();

  useEffect(() => {
    // Check authentication status on app load
    checkAuth();
    
    // Handle OAuth callback
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    if (token) {
      localStorage.setItem('token', token);
      window.history.replaceState({}, document.title, '/');
      checkAuth();
    }
  }, [checkAuth]);

  return (
    <Router>
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
    </Router>
  );
}

export default App;
