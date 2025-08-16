import { ReactNode, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/authStore';

interface LayoutProps {
  children: ReactNode;
}

function Layout({ children }: LayoutProps) {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, updateLocale } = useAuthStore();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  const handleLanguageChange = async (lang: string) => {
    i18n.changeLanguage(lang);
    await updateLocale(lang);
    setShowLangMenu(false);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-42-dark">
      {/* Navigation */}
      <nav className="bg-42-gray shadow-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Logo and main nav */}
            <div className="flex items-center">
              <Link to="/" className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-gradient-to-br from-42-primary to-42-secondary rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xl">42</span>
                </div>
                <span className="text-42-primary font-futura font-bold text-xl">TRANSCENDENCE</span>
              </Link>

              {/* Main navigation */}
              <div className="hidden md:flex items-center space-x-8 ml-10">
                <Link
                  to="/"
                  className={`px-3 py-2 text-sm font-medium transition-colors ${
                    isActive('/') 
                      ? 'text-42-primary border-b-2 border-42-primary' 
                      : 'text-gray-300 hover:text-white'
                  }`}
                >
                  {t('home')}
                </Link>
                <Link
                  to="/game"
                  className={`px-3 py-2 text-sm font-medium transition-colors ${
                    location.pathname.startsWith('/game')
                      ? 'text-42-primary border-b-2 border-42-primary'
                      : 'text-gray-300 hover:text-white'
                  }`}
                >
                  {t('play')}
                </Link>
                <Link
                  to="/tournament"
                  className={`px-3 py-2 text-sm font-medium transition-colors ${
                    location.pathname.startsWith('/tournament')
                      ? 'text-42-primary border-b-2 border-42-primary'
                      : 'text-gray-300 hover:text-white'
                  }`}
                >
                  {t('tournament')}
                </Link>
                <Link
                  to="/leaderboard"
                  className={`px-3 py-2 text-sm font-medium transition-colors ${
                    isActive('/leaderboard')
                      ? 'text-42-primary border-b-2 border-42-primary'
                      : 'text-gray-300 hover:text-white'
                  }`}
                >
                  {t('leaderboard')}
                </Link>
              </div>
            </div>

            {/* Right side menu */}
            <div className="flex items-center space-x-4">
              {/* Language selector */}
              <div className="relative">
                <button
                  onClick={() => setShowLangMenu(!showLangMenu)}
                  className="flex items-center text-gray-300 hover:text-white transition-colors"
                >
                  <span className="text-sm font-medium">{i18n.language.toUpperCase()}</span>
                  <svg className="ml-1 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>

                {showLangMenu && (
                  <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-42-gray ring-1 ring-black ring-opacity-5">
                    <div className="py-1">
                      <button
                        onClick={() => handleLanguageChange('en')}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-42-dark hover:text-white"
                      >
                        English
                      </button>
                      <button
                        onClick={() => handleLanguageChange('ja')}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-42-dark hover:text-white"
                      >
                        日本語
                      </button>
                      <button
                        onClick={() => handleLanguageChange('fr')}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-42-dark hover:text-white"
                      >
                        Français
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* User menu */}
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors"
                >
                  {user?.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.displayName}
                      className="w-8 h-8 rounded-full"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-42-primary rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-bold">
                        {user?.username?.[0]?.toUpperCase()}
                      </span>
                    </div>
                  )}
                  <span className="text-sm font-medium hidden md:block">{user?.displayName || user?.username}</span>
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-42-gray ring-1 ring-black ring-opacity-5">
                    <div className="py-1">
                      <Link
                        to={`/profile/${user?.id}`}
                        className="block px-4 py-2 text-sm text-gray-300 hover:bg-42-dark hover:text-white"
                        onClick={() => setShowUserMenu(false)}
                      >
                        {t('profile')}
                      </Link>
                      <Link
                        to={`/stats/${user?.id}`}
                        className="block px-4 py-2 text-sm text-gray-300 hover:bg-42-dark hover:text-white"
                        onClick={() => setShowUserMenu(false)}
                      >
                        {t('statistics')}
                      </Link>
                      <hr className="my-1 border-gray-600" />
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-42-dark hover:text-red-300"
                      >
                        {t('logout')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        <div className="md:hidden border-t border-gray-600">
          <div className="px-2 pt-2 pb-3 space-y-1">
            <Link
              to="/"
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                isActive('/') 
                  ? 'text-42-primary bg-42-dark' 
                  : 'text-gray-300 hover:text-white hover:bg-42-dark'
              }`}
            >
              {t('home')}
            </Link>
            <Link
              to="/game"
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                location.pathname.startsWith('/game')
                  ? 'text-42-primary bg-42-dark'
                  : 'text-gray-300 hover:text-white hover:bg-42-dark'
              }`}
            >
              {t('play')}
            </Link>
            <Link
              to="/tournament"
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                location.pathname.startsWith('/tournament')
                  ? 'text-42-primary bg-42-dark'
                  : 'text-gray-300 hover:text-white hover:bg-42-dark'
              }`}
            >
              {t('tournament')}
            </Link>
            <Link
              to="/leaderboard"
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                isActive('/leaderboard')
                  ? 'text-42-primary bg-42-dark'
                  : 'text-gray-300 hover:text-white hover:bg-42-dark'
              }`}
            >
              {t('leaderboard')}
            </Link>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}

export default Layout;
