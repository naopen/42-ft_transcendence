import { useTranslation } from 'react-i18next';

function Login() {
  const { t } = useTranslation();

  const handleGoogleLogin = () => {
    window.location.href = `${import.meta.env.VITE_API_URL}/auth/google`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-42-dark via-42-gray to-42-dark flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8 animate-fadeIn">
        {/* Logo */}
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="w-24 h-24 bg-gradient-to-br from-42-primary to-42-secondary rounded-2xl flex items-center justify-center shadow-2xl animate-float">
              <span className="text-white font-bold text-5xl">42</span>
            </div>
          </div>
          <h1 className="text-5xl font-bold text-42-primary font-futura mb-2 neon-text">
            TRANSCENDENCE
          </h1>
          <p className="text-gray-400 text-lg">
            The Ultimate Pong Experience
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-42-gray rounded-2xl shadow-2xl p-8 space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-white text-center mb-2">
              {t('welcomeBack')}
            </h2>
            <p className="text-gray-400 text-center">
              {t('signInToContinue')}
            </p>
          </div>

          {/* Google OAuth Button */}
          <button
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center px-6 py-4 bg-white text-gray-700 rounded-lg font-semibold hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 hover:shadow-xl"
          >
            <svg className="w-6 h-6 mr-3" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            {t('signInWithGoogle')}
          </button>

          <div className="text-center text-sm text-gray-500">
            <p>Authentication is required to play</p>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-3 gap-4 mt-8">
          <div className="text-center">
            <div className="bg-42-gray rounded-lg p-4 mb-2">
              <svg className="w-8 h-8 mx-auto text-42-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
            </div>
            <p className="text-gray-400 text-sm">Real-time Multiplayer</p>
          </div>
          <div className="text-center">
            <div className="bg-42-gray rounded-lg p-4 mb-2">
              <svg className="w-8 h-8 mx-auto text-42-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <p className="text-gray-400 text-sm">Live Statistics</p>
          </div>
          <div className="text-center">
            <div className="bg-42-gray rounded-lg p-4 mb-2">
              <svg className="w-8 h-8 mx-auto text-42-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
              </svg>
            </div>
            <p className="text-gray-400 text-sm">Tournaments</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
