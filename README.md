# ft_transcendence - 42 School Project

A full-stack real-time multiplayer Pong game with 3D graphics, tournaments, and comprehensive statistics tracking.

## 🎮 Features

### ✅ Mandatory Requirements
- **3D Pong Game** using Babylon.js with particle effects and smooth animations
- **Real-time Multiplayer** with WebSocket (Socket.IO) for remote play
- **OAuth 2.0 Authentication** via Google
- **Local Tournament System** with alias registration (no login required)
- **Responsive Design** supporting all device types
- **Multi-language Support** (English, Japanese, French)
- **Single Page Application** with browser history support
- **Docker Deployment** with single command setup

### 🚀 Technical Stack

#### Backend
- **Runtime**: Node.js with Fastify framework
- **Database**: SQLite with better-sqlite3
- **Real-time**: Socket.IO for WebSocket communication
- **Authentication**: Google OAuth 2.0 with JWT tokens
- **Session Management**: Secure cookie-based sessions

#### Frontend
- **Framework**: React with TypeScript
- **Styling**: Tailwind CSS with custom 42 intra-inspired design
- **3D Graphics**: Babylon.js for game rendering
- **State Management**: Zustand
- **Internationalization**: i18next
- **Charts**: Chart.js for statistics visualization
- **Build Tool**: Vite

## 📋 Evaluation Checklist

### ✅ General Requirements
- [x] No unhandled errors or warnings
- [x] Credentials stored in .env file (not in repository)
- [x] Docker compose at root directory
- [x] Single command deployment: `docker-compose up --build`

### ✅ Backend Requirements
- [x] Fastify with Node.js
- [x] SQLite database
- [x] Server-side validation and sanitization
- [x] Password hashing (for future use)
- [x] WebSocket support for real-time gameplay

### ✅ Frontend Requirements
- [x] TypeScript as base language
- [x] Tailwind CSS for styling
- [x] Single Page Application
- [x] Browser back/forward button support
- [x] Compatible with Mozilla Firefox (latest) and Chrome
- [x] Responsive design for all devices
- [x] Minimum 3 languages support

### ✅ Game Features
- [x] 3D Pong using Babylon.js
- [x] Remote multiplayer gameplay
- [x] Local tournament with alias registration
- [x] Matchmaking system
- [x] Lag and disconnect handling (30s reconnection window)
- [x] Game pause on disconnect

### ✅ Security
- [x] OAuth 2.0 authentication
- [x] Secure session management
- [x] Input validation and sanitization
- [x] HTTPS-ready configuration
- [x] No exposed credentials

### ✅ User Features
- [x] User profiles with avatars
- [x] Game history tracking
- [x] Detailed statistics dashboard
- [x] Leaderboard system
- [x] Win streaks tracking
- [x] Head-to-head records

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose installed
- Google OAuth 2.0 credentials (for authentication)

### Setup Instructions

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/42-ft_transcendence.git
cd 42-ft_transcendence
```

2. **Configure environment variables**
```bash
cp .env.example .env
# Edit .env and add your Google OAuth credentials
```

3. **Start the application**
```bash
docker-compose up --build
```

4. **Access the application**
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- Health check: http://localhost:3000/health

## 🎮 How to Play

### Online Match
1. Login with Google OAuth
2. Click "Play" → "Find Match"
3. Wait for opponent
4. Use W/S or Arrow keys to control paddle
5. First to 11 points wins

### Local Tournament
1. Click "Tournament" → "Create Tournament"
2. Enter tournament name and player aliases
3. Players take turns playing matches
4. Record scores after each match
5. Winners advance to next round
6. Last player standing wins the tournament

### Controls
- **Player 1**: W (up), S (down)
- **Player 2**: ↑ (up), ↓ (down)
- **Tournament Scoring**: Q (Player 1 scores), P (Player 2 scores)

## 📊 Statistics Features

### User Statistics
- Games played, won, and lost
- Win rate percentage
- Current and best win streaks
- Points scored and conceded
- Average game duration
- Monthly performance tracking

### Leaderboard
- Global rankings by win rate
- Top players display
- Detailed player comparisons
- Best win streak leaders

### Tournament System
- Single elimination format
- Automatic bracket generation
- BYE handling for odd players
- Real-time bracket updates
- Tournament history

## 🔧 Development

### Local Development (without Docker)

#### Backend
```bash
cd backend
npm install
npm run dev
```

#### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Database Schema
- **users**: User profiles and authentication
- **sessions**: Active user sessions
- **games**: Match history and results
- **tournaments**: Tournament information
- **tournament_games**: Tournament matches
- **tournament_players**: Tournament participants
- **user_stats**: Aggregated user statistics

## 🌍 Internationalization

The application supports three languages:
- **English** (en)
- **日本語** (ja)
- **Français** (fr)

Users can switch languages from the navigation bar. The preference is saved to their profile.

## 📱 Responsive Design

The application is fully responsive and optimized for:
- Desktop (1920x1080 and above)
- Laptop (1366x768)
- Tablet (768x1024)
- Mobile (375x667)

## 🔒 Security Considerations

- OAuth 2.0 for secure authentication
- JWT tokens for API authorization
- Secure cookie-based sessions
- Input validation on all forms
- SQL injection prevention
- XSS protection
- CORS properly configured

## 🐛 Error Handling

- Graceful error recovery
- User-friendly error messages
- Automatic reconnection on disconnect
- Game state preservation
- Comprehensive logging

## 📝 API Documentation

### Authentication Endpoints
- `GET /api/auth/google` - Initiate Google OAuth
- `GET /api/auth/google/callback` - OAuth callback
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/verify` - Verify session

### User Endpoints
- `GET /api/users/me` - Get current user
- `GET /api/users/:id` - Get user by ID
- `PATCH /api/users/me/locale` - Update language
- `GET /api/users/me/games` - Get user's games
- `GET /api/users/leaderboard` - Get leaderboard

### Game Endpoints
- `POST /api/games/match` - Start matchmaking
- `GET /api/games/:id` - Get game details
- `POST /api/games/tournament` - Create tournament
- `GET /api/games/tournament/:id` - Get tournament

### Statistics Endpoints
- `GET /api/stats/user/:id` - Get user statistics
- `GET /api/stats/global` - Get global statistics
- `GET /api/stats/tournament/:id` - Get tournament stats

## 🧪 Testing

The application has been tested on:
- Mozilla Firefox (latest stable)
- Google Chrome (latest stable)
- Safari (macOS)
- Mobile browsers (iOS Safari, Chrome Mobile)

## 📄 License

This project is created for educational purposes as part of the 42 School curriculum.

## 👥 Authors

42 School Student Project - ft_transcendence

## 🙏 Acknowledgments

- 42 School for the project requirements
- Babylon.js team for the 3D engine
- Socket.IO for real-time communication
- All open-source contributors

---

**Note**: This project strictly follows the 42 School evaluation criteria and all mandatory requirements have been implemented and tested.
