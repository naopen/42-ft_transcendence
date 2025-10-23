# ft_transcendence

A modern 3D Pong game with tournament support, built with TypeScript, Babylon.js, and Fastify.

## 🎮 Features

- **3D Pong Game** - Beautiful 3D graphics powered by Babylon.js
- **Local Tournaments** - Compete with friends on the same device (3-16 players)
- **Online Play** - Real-time multiplayer with WebSocket (Phase 2)
- **User Authentication** - Google OAuth 2.0 integration
- **Statistics Dashboard** - Track your performance with Chart.js
- **Multilingual** - Available in English, Japanese, and French (i18n)
- **Responsive Design** - Works on desktop and mobile devices

## 🏗️ Tech Stack

### Frontend
- **TypeScript** - Type-safe JavaScript
- **Babylon.js** - 3D rendering engine
- **Tailwind CSS** - Utility-first CSS framework
- **Vite** - Fast build tool
- **Chart.js** - Statistics visualization

### Backend
- **Fastify** - Fast and low overhead web framework
- **TypeScript** - Type-safe Node.js
- **SQLite** - Lightweight database
- **Passport.js** - Google OAuth 2.0 authentication

### Infrastructure
- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration
- **pnpm** - Fast, disk space efficient package manager

## 🚀 Quick Start

### Prerequisites

- Docker & Docker Compose
- Node.js 20+ (for local development)
- pnpm (install with `npm install -g pnpm`)

### 1. Clone the Repository

```bash
git clone <repository-url>
cd 42-ft_transcendence
```

### 2. Environment Setup

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` and configure:

```env
# Google OAuth 2.0 (optional for local tournament mode)
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# Session Secret (change this!)
SESSION_SECRET=change_this_to_a_random_secret

# Ports
BACKEND_PORT=3000
FRONTEND_PORT=8080
```

### 3. Start with Docker

Build and start all services:

```bash
docker-compose up --build
```

Or run in detached mode:

```bash
docker-compose up -d --build
```

### 4. Access the Application

- **Frontend**: http://localhost:8080
- **Backend API**: http://localhost:3000
- **API Docs**: http://localhost:3000/docs (Swagger UI)

## 🎯 Usage

### Local Tournament (No Authentication Required)

1. Open http://localhost:8080
2. Click **"Start Tournament"**
3. Enter tournament name and player names (3-16 players)
4. Click **"Create Tournament"**
5. Play matches by clicking **"Play Match"**
6. Use keyboard controls:
   - **Player 1**: `A` (left) / `D` (right)
   - **Player 2**: `←` (left) / `→` (right)

### Online Play (Authentication Required)

1. Configure Google OAuth credentials in `.env`
2. Click **"Sign in with Google"**
3. Navigate to **"Online Play"**
4. Find a match and play!

## 📦 Project Structure

```
42-ft_transcendence/
├── packages/
│   ├── backend/          # Fastify API server
│   │   ├── src/
│   │   │   ├── routes/   # API routes
│   │   │   ├── services/ # Business logic
│   │   │   ├── models/   # Database models
│   │   │   └── ...
│   │   └── Dockerfile
│   └── frontend/         # Vite + TypeScript SPA
│       ├── src/
│       │   ├── pages/    # Page components
│       │   ├── components/ # UI components
│       │   ├── game/     # Babylon.js game engine
│       │   ├── stores/   # State management
│       │   ├── services/ # API clients
│       │   ├── i18n/     # Translations
│       │   └── ...
│       └── Dockerfile
├── docker-compose.yml    # Docker services
├── .env                  # Environment variables
└── README.md
```

## 🧪 Testing

### Run Tests (Local Development)

```bash
# Install dependencies
pnpm install

# Run backend tests
cd packages/backend
pnpm test

# Run frontend tests
cd packages/frontend
pnpm test
```

### Manual Testing Checklist

#### Basic Functionality
- [ ] Homepage loads successfully
- [ ] Language switcher works (EN/JA/FR)
- [ ] Navigation links work

#### Local Tournament
- [ ] Create tournament with 3+ players
- [ ] Tournament bracket displays correctly
- [ ] Start match button works
- [ ] 3D game renders properly
- [ ] Keyboard controls work (A/D, ←/→)
- [ ] Ball physics work correctly
- [ ] Score updates properly
- [ ] Game ends at max score (default: 11)
- [ ] Next match loads automatically
- [ ] Tournament completes and shows winner

#### Authentication (if configured)
- [ ] Google OAuth login works
- [ ] User profile displays
- [ ] Dashboard shows statistics
- [ ] Logout works

## 🛠️ Development

### Local Development (without Docker)

#### Backend

```bash
cd packages/backend
pnpm install
pnpm dev
```

Backend runs on http://localhost:3000

#### Frontend

```bash
cd packages/frontend
pnpm install
pnpm dev
```

Frontend runs on http://localhost:5173 (Vite dev server)

### Build for Production

```bash
# Build both frontend and backend
pnpm --filter backend build
pnpm --filter frontend build
```

## 🐛 Troubleshooting

### Docker Issues

**Containers won't start:**
```bash
docker-compose down
docker-compose up --build --force-recreate
```

**Port conflicts:**
- Change `BACKEND_PORT` or `FRONTEND_PORT` in `.env`

### Database Issues

**Reset database:**
```bash
rm -rf data/database.sqlite
docker-compose restart backend
```

### Frontend Issues

**Babylon.js not loading:**
- Check browser console for errors
- Ensure WebGL is supported in your browser
- Try a different browser (Chrome, Firefox recommended)

**Game controls not working:**
- Click on the canvas to focus it
- Check if keyboard is properly connected

## 📝 API Documentation

Once the backend is running, visit:
- Swagger UI: http://localhost:3000/docs
- OpenAPI JSON: http://localhost:3000/docs/json

### Key Endpoints

#### Authentication
- `GET /api/auth/google` - Start Google OAuth flow
- `GET /api/auth/callback/google` - OAuth callback
- `GET /api/auth/status` - Check auth status
- `POST /api/auth/logout` - Logout

#### Tournaments
- `POST /api/tournaments` - Create tournament
- `GET /api/tournaments/:id` - Get tournament details
- `POST /api/tournaments/:id/start` - Start tournament
- `POST /api/tournaments/:id/matches/:matchId/complete` - Complete match

#### Games
- `POST /api/games` - Create game session
- `GET /api/games/:id` - Get game details
- `POST /api/games/:id/complete` - Complete game
- `GET /api/games/user/:userId/stats` - Get user statistics

## 🌍 Internationalization

The application supports three languages:
- **English (EN)** - Default
- **Japanese (JA)** - 日本語
- **French (FR)** - Français

Language files are located in:
```
packages/frontend/src/i18n/
├── en.json
├── ja.json
└── fr.json
```

## 📄 License

MIT

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📞 Support

For issues and questions, please open an issue on GitHub.

---

**Enjoy playing ft_transcendence! 🎮🏓**
