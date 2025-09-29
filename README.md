# Aurora IVR/AI Assistant

![Aurora](Aurora.png)

A complete full-stack personal IVR and AI assistant application with React frontend and Node.js backend. Features iOS native call merging, real-time audio streaming, AI-powered transcription and note-taking, plus secure user authentication and a modern web dashboard.

## ✨ Key Features

- **🍎 iOS Native Call Merging**: Works seamlessly with iOS "merge" button for 3-way calls
- **🎵 Real-time Audio Streaming**: Twilio Stream captures audio during merged calls without interference
- **🤖 AI Transcription**: Uses OpenAI Whisper for high-quality speech-to-text
- **📝 Smart Notes**: GPT-4 generates structured meeting notes with action items
- **🎧 Audio File Storage & Download**: Persistent call recordings with web dashboard download capability
- **🖥️ React Web Dashboard**: Modern frontend with real-time monitoring and management
- **🔐 Advanced Authentication**: JWT + Role-Based Access Control (RBAC) with admin features
- **📡 WebSocket Audio Processing**: Real-time μ-law audio conversion and processing
- **👥 Multi-user Support**: Complete user management with admin controls and system settings
- **⚙️ Dynamic Configuration**: Admin-controlled system settings (user registration, etc.)
- **📊 Real-time Dashboard**: Live call monitoring, statistics, and system health indicators
- **🐳 Docker Ready**: Multi-architecture support (x86_64, ARM64, ARM/Raspberry Pi)

## 🚀 Quick Start (Docker - Recommended)

**One-line deployment:**
```bash
# 1. Clone and configure
git clone <repository-url>
cd Aurora
cp .env.example .env
# Edit .env with your credentials (including JWT_SECRET)

# 2. Start with one command (works on x86, ARM64, Raspberry Pi)
./docker-start.sh
```

**Access your application:**
- **🖥️ Frontend Dashboard**: http://localhost:3001
- **🔧 Backend API**: http://localhost:3000/health
- **🗄️ Database**: mongodb://localhost:27017/aurora

## 📋 Environment Configuration

Required environment variables in `.env`:
```bash
# Twilio Configuration
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number

# OpenAI Configuration  
OPENAI_API_KEY=your_openai_api_key

# User Configuration
USER_PHONE_NUMBER=+1234567890

# Server Configuration
PORT=3000
NODE_ENV=production
WEBHOOK_BASE_URL=https://your-ngrok-url.ngrok.io

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/aurora

# Authentication Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d
```

## 🎯 How It Works

### iOS Native Call Merging Workflow
1. **Person A calls you** (personal number) → Put on hold using iOS
2. **You call your Aurora assistant** (Twilio number) → Audio streaming starts automatically  
3. **Use iOS "merge" button** → Creates 3-way call with assistant
4. **Assistant streams** entire merged conversation in real-time via WebSocket
5. **When call ends** → Auto-transcription with Whisper and AI note generation with GPT-4
6. **Access notes** → Login to web dashboard or use protected API endpoints

### User Experience
1. **Register/Login** → Create account at http://localhost:3001
2. **Dashboard** → View all your call notes and transcripts
3. **Search** → Find specific conversations or topics
4. **Manage** → End active calls, view call details, update profile

## 🛠️ Development Setup

### Prerequisites
- Node.js 18+
- MongoDB (or use Docker)
- Twilio account
- OpenAI API key

### Backend Development
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Or start production server
npm start
```

### Frontend Development  
```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Start React dev server
npm run dev

# Build for production
npm run build
```

### Database Setup
```bash
# Option 1: Use Docker for MongoDB only
docker run -d -p 27017:27017 --name aurora-mongo mongo:7-jammy

# Option 2: Install MongoDB locally (macOS)
brew install mongodb-community
brew services start mongodb-community
```

### Webhook Setup (Development)
```bash
# Install ngrok if you haven't
npm install -g ngrok

# In one terminal, start your server
npm run dev

# In another terminal, expose it via ngrok
ngrok http 3000

# Configure Twilio webhook URL: https://your-ngrok-url.ngrok.io/webhook
```

## 🔌 API Endpoints

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - User login
- `GET /auth/me` - Get current user profile
- `PUT /auth/me` - Update user profile
- `PUT /auth/change-password` - Change password
- `POST /auth/logout` - Logout (client-side token removal)

### Call Management (Protected)
- `GET /health` - Health check endpoint (public)
- `GET /active-calls` - List all active calls (requires auth)
- `POST /end-call/:callSid` - End specific call (requires auth)

### Notes & Transcription (Protected)
- `GET /call-notes/:callSid` - Get notes for specific call (requires auth)
- `GET /all-notes` - Get all call notes and transcripts (requires auth)

### Audio File Management (Protected)
- `GET /audio-files` - List all available audio files with metadata
- `GET /download-audio/:callSid` - Download audio file for specific call
- `HEAD /download-audio/:callSid` - Check if audio file exists

### Admin Management (Admin Only)
- `GET /admin/users` - List all users with search and filtering
- `POST /admin/settings/registration/toggle` - Toggle user registration on/off
- `GET /admin/stats` - System statistics and monitoring
- `POST /admin/users/bulk` - Bulk user operations

### Webhooks (Twilio)
- `POST /webhook` - Single unified webhook handling all Twilio events

## 🏗️ Technology Stack

### Backend
- **Runtime**: Node.js with Express and WebSocket server
- **Database**: MongoDB with Mongoose ODM for persistent storage
- **Authentication**: JWT tokens with bcrypt password hashing
- **Telephony**: Twilio Voice API with TwiML and Stream API
- **Audio Processing**: Real-time μ-law to WAV conversion
- **AI**: OpenAI (Whisper for transcription, GPT-4 for notes)

### Frontend
- **Framework**: React 18 with Vite build system
- **Routing**: React Router DOM for navigation
- **State Management**: Context API and custom hooks
- **HTTP Client**: Axios with automatic token handling
- **UI**: Custom components with responsive design

### Deployment
- **Containers**: Docker with multi-architecture support
- **Reverse Proxy**: Nginx for frontend serving and API proxying
- **Orchestration**: Docker Compose for multi-service deployment
- **Platforms**: x86_64, ARM64, ARM (Raspberry Pi compatible)

## 🐳 Docker Commands

```bash
# Start services
./docker-start.sh                    # One-command startup with validation
docker-compose up -d --build         # Manual startup

# View logs
docker-compose logs -f               # Follow all logs  
docker-compose logs -f aurora-backend    # Follow backend logs
docker-compose logs -f aurora-frontend   # Follow frontend logs

# Management
docker-compose restart               # Restart all services
docker-compose stop                  # Stop all services
docker-compose down                  # Stop and remove containers
docker-compose down -v               # Stop and remove containers + volumes

# Database
docker-compose exec mongo mongosh    # Access MongoDB shell
```

## 📁 File Structure

```
/Users/yoga/Projects/Aurora/
├── server.js              # Main application server
├── package.json           # Backend dependencies and scripts
├── Dockerfile             # Multi-architecture Docker image (backend)
├── docker-compose.yml     # Docker Compose configuration
├── docker-start.sh        # One-command startup script
├── models/                # MongoDB data models
│   ├── Call.js           # Call records model
│   ├── CallNote.js       # Call notes and transcripts model
│   ├── User.js           # User authentication model
│   └── SystemSettings.js # System configuration model
├── routes/                # API route handlers
│   ├── auth.js           # Authentication routes
│   └── admin.js          # Admin management routes
├── middleware/            # Express middleware
│   └── auth.js           # JWT authentication middleware
├── storage/               # Persistent file storage
│   └── audio/            # Audio file storage directory
├── database/              # Database configuration
│   └── connection.js     # MongoDB connection handler
├── frontend/              # React frontend application
│   ├── Dockerfile        # Multi-architecture Docker image (frontend)
│   ├── nginx.conf        # Nginx configuration
│   ├── package.json      # Frontend dependencies
│   ├── vite.config.js    # Vite build configuration
│   ├── index.html        # Entry HTML file
│   ├── public/           # Static assets
│   └── src/              # React source code
│       ├── components/   # Reusable React components
│       ├── pages/        # Page components
│       ├── hooks/        # Custom React hooks
│       ├── services/     # API service classes
│       └── utils/        # Utility functions
├── .env.example          # Environment template
├── .gitignore            # Git ignore rules
├── README.md             # This file - setup instructions
└── CLAUDE.md             # Development notes and technical details
```

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Security**: Bcrypt hashing with salt rounds
- **Rate Limiting**: Protection against brute force attacks
- **CORS Protection**: Configured for secure cross-origin requests
- **Input Validation**: Server-side validation for all user inputs
- **Secure Headers**: Nginx security headers in production
- **Environment Secrets**: All sensitive data in environment variables
- **Role-Based Access Control**: Admin and user roles with granular permissions

## 🔐 Role-Based Access Control (RBAC)

### User Roles

**👤 User Role:**
- Access to personal dashboard
- View own call notes and transcripts
- Search personal call history
- Update own profile and password

**🔧 Admin Role:**
- All user permissions plus:
- System-wide statistics and monitoring
- User management (create, update, deactivate, delete)
- View all calls and notes across the system
- System logs and activity monitoring
- Bulk user operations

### Default Admin Account

The system automatically creates a default admin account on first startup:
- **Username**: `admin`
- **Password**: `admin123`
- **⚠️ Important**: Change the default password immediately after first login

### Admin Dashboard Features

- **📊 System Overview**: Real-time statistics for users, calls, and notes
- **👥 User Management**: Complete user administration with search and filtering
- **📞 Calls Overview**: System-wide call monitoring and analytics
- **📝 System Logs**: Recent activity logs and system health monitoring
- **🔧 Bulk Operations**: Activate, deactivate, or delete multiple users

### API Endpoints by Role

**Public Endpoints:**
- `POST /auth/register` - User registration
- `POST /auth/login` - User authentication
- `GET /health` - System health check

**User Endpoints (Requires Authentication):**
- `GET /auth/me` - Get user profile
- `PUT /auth/me` - Update profile
- `PUT /auth/change-password` - Change password
- `GET /active-calls` - View user's active calls
- `GET /call-notes/:callSid` - Get specific call notes
- `GET /all-notes` - Get user's call notes
- `POST /end-call/:callSid` - End user's call

**Admin Endpoints (Requires Admin Role):**
- `GET /admin/stats` - System statistics
- `GET /admin/users` - User management
- `GET /admin/users/:userId` - Get specific user
- `PUT /admin/users/:userId` - Update user
- `DELETE /admin/users/:userId` - Delete user
- `GET /admin/calls` - All system calls
- `GET /admin/logs` - System logs
- `POST /admin/users/bulk` - Bulk user operations
- `POST /admin/settings/registration/toggle` - Toggle user registration

**Audio Management (Requires Authentication):**
- `GET /audio-files` - List available audio files
- `GET /download-audio/:callSid` - Download call audio file
- `HEAD /download-audio/:callSid` - Check audio file existence

## 🌍 Architecture Support

**Multi-Platform Docker Images:**
- ✅ **x86_64** (Intel/AMD servers, most cloud providers)
- ✅ **ARM64** (Apple Silicon Macs, ARM64 servers)  
- ✅ **ARM** (Raspberry Pi 3/4, ARM single-board computers)

**Deployment Options:**
- 🐳 **Docker Compose** (recommended) - One command deployment
- 🏠 **Local Development** - Node.js + MongoDB + React
- ☁️ **Cloud Deployment** - Any Docker-compatible platform
- 🥧 **Raspberry Pi** - Perfect for home/edge deployments

## 🎛️ Usage Examples

### Web Dashboard
1. **Register**: Create account at http://localhost:3001/register
2. **Login**: Access dashboard at http://localhost:3001/login
3. **Dashboard**: View calls and notes at http://localhost:3001/dashboard
4. **Search**: Find specific conversations or topics
5. **Manage**: End active calls, view transcripts, update profile

### API Usage (with authentication)
```bash
# Register new user
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"john","email":"john@example.com","password":"password123"}'

# Login to get token
TOKEN=$(curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"john","password":"password123"}' \
  | jq -r '.token')

# View all notes (protected endpoint)
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/all-notes

# Check active calls (protected endpoint)
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/active-calls
```

## 🔧 Troubleshooting

### Common Issues

**Docker Issues:**
```bash
# Check service status
docker-compose ps

# View logs
docker-compose logs aurora-backend
docker-compose logs aurora-frontend
docker-compose logs mongo

# Clean rebuild
docker-compose down -v
docker-compose up -d --build
```

**Authentication Issues:**
- Ensure JWT_SECRET is set in .env
- Check token expiration (default 7 days)
- Verify user account is active
- Clear browser localStorage if needed

**Call Issues:**
- Ensure USER_PHONE_NUMBER matches your actual number
- Verify Twilio webhook URL is accessible
- Check Twilio Console for webhook error logs
- Confirm OpenAI API key has sufficient credits

**Frontend Issues:**
- Clear browser cache and localStorage
- Check browser console for errors
- Verify API endpoints are accessible
- Ensure backend is running before frontend

### Performance Tips

**For Raspberry Pi:**
- Monitor memory usage: `docker stats`
- Consider external storage for audio processing
- Limit concurrent transcriptions
- Use lighter MongoDB configuration

**For Production:**
- Set up log rotation
- Configure MongoDB replication  
- Use HTTPS with SSL certificates
- Set up monitoring and alerts
- Configure backup strategies

## 🆕 Recent Improvements

### v2.1.1 (Latest) - Critical Fixes ⚡
- **🐛 FIXED: Call Status Database Updates**: Resolved critical issue where calls remained "ringing" after completion
- **🔧 Enhanced WebSocket Handlers**: Added proper database updates to audio stream stop events
- **📊 Improved Call Lifecycle**: Calls now properly transition: ringing → in-progress → completed
- **🛠️ Better Debugging**: Added comprehensive logging for database operations and call tracking
- **⚡ Performance**: Fixed async/await issues in WebSocket message handlers

### v2.1.0 - Major Feature Release

### ✅ New Features Added
- **🎵 Audio File Storage & Download**: Persistent call recordings with web dashboard download capability
- **⚙️ Dynamic System Settings**: Admin-controlled configuration (user registration toggle, etc.)
- **🔧 Enhanced Call Status Tracking**: Proper call lifecycle management with database updates
- **📁 Persistent Audio Storage**: Docker volume mapping prevents audio loss on container restart
- **🛡️ Improved Authentication**: Fixed audio download authentication and security
- **🚀 WebSocket Enhancements**: Better connection handling and retry logic
- **📱 SPA Routing Fix**: Proper nginx configuration for React Router

### 🐛 Bug Fixes (v2.1.0)
- Fixed call status not updating from "ringing" to "completed" in database
- Resolved audio download returning HTML instead of audio files
- Fixed audio files being lost on Docker container restart
- Corrected WebSocket connection race conditions
- Fixed nginx 404 errors on dashboard page refresh
- Resolved webhook 500 errors with proper variable declarations

## 🚀 Next Development Steps

- [x] Add role-based access control (admin/user)
- [x] Audio file storage and download system
- [x] Dynamic system settings management
- [x] Enhanced call status tracking
- [ ] Email notifications for call summaries
- [ ] Real-time dashboard updates via WebSocket
- [ ] Call analytics and reporting features
- [ ] Integration with calendar systems
- [ ] Mobile app for iOS/Android
- [ ] Advanced IVR flows and menus
- [ ] Multi-language support
- [ ] Voice activity detection
- [ ] Call recording backup to cloud storage

## 📞 Support

For issues, feature requests, or contributions, please check the project repository or contact the development team.

---

**Version**: 2.1.1
**Status**: Production Ready ✅
**Last Updated**: 2025-09-29