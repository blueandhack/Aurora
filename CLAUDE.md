# Aurora IVR/AI Assistant - Claude Code Notes

## Project Overview
Complete full-stack personal IVR and AI assistant application with React frontend and Node.js backend. Features iOS native call merging, real-time audio streaming, AI-powered transcription and note-taking, plus secure user authentication and a modern web dashboard.

**Version**: 2.1.1
**Status**: Production Ready ✅
**Architecture Support**: x86_64, ARM64, ARM (Raspberry Pi)
**Frontend**: React with modern UI and dashboard
**Authentication**: JWT with bcrypt password security + RBAC
**Storage**: MongoDB with persistent data and audio files

## Key Features
- **iOS Native Call Merging**: Works seamlessly with iOS "merge" button for 3-way calls
- **Real-time Audio Streaming**: Twilio Stream captures audio during merged calls without interference
- **AI Transcription**: Uses OpenAI Whisper for high-quality speech-to-text
- **Smart Notes**: GPT-4 generates structured meeting notes with action items
- **Audio File Storage & Download**: Persistent audio files with web dashboard download capability
- **Advanced Call Management**: Track active calls, automatic status updates, and robust lifecycle handling
- **WebSocket Audio Processing**: Real-time μ-law audio conversion and processing
- **System Settings Management**: Dynamic configuration with admin controls (user registration, etc.)
- **Real-time Dashboard**: Live call monitoring, statistics, and system management interface

## Technology Stack
- **Backend**: Node.js with Express and WebSocket server
- **Database**: MongoDB with Mongoose ODM for persistent storage
- **Telephony**: Twilio Voice API with TwiML and Stream API
- **Audio Processing**: Real-time μ-law to WAV conversion
- **AI**: OpenAI (Whisper for transcription, GPT-4 for notes)
- **Deployment**: Docker with multi-architecture support (x86_64, ARM64, ARM)
- **Dependencies**: express, twilio, openai, mongoose, ws, dotenv, cors, body-parser, uuid

## Workflow
1. **Person A calls you** (personal number) → Put on hold using iOS
2. **You call your Aurora assistant** (Twilio number) → Audio streaming starts automatically  
3. **Use iOS "merge" button** → Creates 3-way call with assistant
4. **Assistant streams** entire merged conversation in real-time via WebSocket
5. **When call ends** → Auto-transcription with Whisper and AI note generation with GPT-4
6. **Data stored permanently** in MongoDB with call metadata and full transcripts
7. **Retrieve notes** via API: `GET /all-notes` or `GET /call-notes/:callSid`

## Environment Setup
Required environment variables in `.env`:
```
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token  
TWILIO_PHONE_NUMBER=your_twilio_phone_number
OPENAI_API_KEY=your_openai_api_key
USER_PHONE_NUMBER=+1234567890
PORT=3000
NODE_ENV=production
WEBHOOK_BASE_URL=https://your-ngrok-url.ngrok.io
MONGODB_URI=mongodb://localhost:27017/aurora
```

## Twilio Webhook Configuration
- **Single Webhook URL**: `https://your-ngrok-url.ngrok.io/webhook`
- **HTTP Method**: POST
- Handles all events: incoming calls, call status, recording completion, conference events

## Development Commands

### Docker (Recommended)
- `./docker-start.sh` - One-command startup with validation
- `docker-compose up -d --build` - Build and start services
- `docker-compose logs -f` - View logs
- `docker-compose down` - Stop services

### Local Development
- `npm start` - Start production server
- `npm run dev` - Start with nodemon for development
- `ngrok http 3000` - Expose local server for Twilio webhooks

## API Endpoints

### Webhooks (Twilio)
- `POST /webhook` - Single unified webhook handling all Twilio events:
  - Incoming calls and call initiation
  - Call status changes and completion
  - Audio streaming events
  - WebSocket connections for real-time audio capture

### Call Management
- `GET /health` - Health check endpoint
- `GET /active-calls` - List all active calls
- `POST /end-call/:callSid` - End specific call

### Notes & Transcription
- `GET /call-notes/:callSid` - Get notes for specific call
- `GET /all-notes` - Get all call notes and transcripts

### Audio File Management
- `GET /audio-files` - List all available audio files with metadata
- `GET /download-audio/:callSid` - Download audio file for specific call
- `HEAD /download-audio/:callSid` - Check if audio file exists

### Authentication & User Management
- `POST /auth/login` - User authentication
- `POST /auth/register` - User registration (if enabled)
- `GET /auth/me` - Get current user profile
- `GET /admin/users` - List all users (admin only)
- `POST /admin/settings/registration/toggle` - Toggle user registration (admin only)

## File Structure
```
/Users/yoga/Projects/Aurora/
├── server.js              # Main application server
├── package.json           # Dependencies and scripts
├── Dockerfile             # Multi-architecture Docker image
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
├── middleware/            # Custom middleware
│   └── auth.js           # JWT authentication middleware
├── frontend/              # React frontend application
│   ├── src/              # React source code
│   ├── public/           # Static assets and test pages
│   ├── Dockerfile        # Frontend container image
│   └── nginx.conf        # Nginx configuration for SPA
├── storage/               # Persistent file storage
│   └── audio/            # Audio file storage directory
├── database/              # Database configuration
│   └── connection.js     # MongoDB connection handler
├── .env.example          # Environment template
├── .env.docker           # Docker environment example
├── .gitignore            # Git ignore rules
├── README.md             # Setup instructions
└── CLAUDE.md             # This file - development notes
```

## Development Status

### ✅ Completed Features
- [x] **Authentication System**: JWT-based auth with role-based access control (RBAC)
- [x] **Persistent Storage**: MongoDB with comprehensive data models
- [x] **Web Dashboard**: React frontend with real-time monitoring and management
- [x] **Audio File Management**: Persistent storage and download functionality
- [x] **Call Lifecycle Management**: Robust status tracking and cleanup
- [x] **System Administration**: Dynamic settings and user management
- [x] **Real-time Updates**: WebSocket-based live dashboard updates
- [x] **Multi-user Support**: Complete user management with admin controls

### 🚧 Next Development Steps
- [ ] Advanced IVR flows and call routing
- [ ] Calendar system integration
- [ ] Cloud storage backup for audio files
- [ ] Advanced analytics and reporting
- [ ] SMS/text message integration
- [ ] Mobile app companion
- [ ] API rate limiting and throttling
- [ ] Audit logging system

## Technical Notes

### Core Architecture
- **iOS Native Support**: Designed specifically for iOS call merging without programmatic interference
- **Streaming Architecture**: Uses Twilio Stream instead of recording to avoid call interruption
- **Audio Format**: Processes μ-law (G.711) 8-bit 8kHz audio from Twilio streams
- **Real-time Processing**: WebSocket connections handle live audio streaming with duplicate prevention
- **No Call Hangup Issues**: Stream-based approach eliminates recording-related call termination
- **Audio Conversion**: Custom μ-law WAV header creation for OpenAI Whisper compatibility

### Storage & Persistence
- **MongoDB Integration**: Comprehensive data persistence with proper indexing
- **Audio File Storage**: Persistent WAV files with Docker volume mapping (`./storage/audio:/app/storage/audio`)
- **Container Restart Resilience**: Audio files survive container rebuilds and restarts
- **Call Status Tracking**: Robust webhook handling for complete call lifecycle management

### Advanced Features
- **Authentication & Authorization**: JWT tokens with role-based access control (admin/user)
- **Dynamic Configuration**: System settings stored in database with admin controls
- **Real-time Dashboard**: WebSocket-based live updates for calls, stats, and system status
- **Multi-Architecture Support**: Docker images support x86_64, ARM64, and ARM platforms
- **Production Ready**: Health checks, graceful shutdowns, and comprehensive error handling

### Recent Improvements (v2.1.0)
- **Fixed Call Status Updates**: Calls now properly transition from "ringing" to "completed" in database
- **Audio Download System**: Direct download of call recordings through web dashboard
- **Enhanced Error Handling**: Improved webhook processing and container restart scenarios
- **User Registration Control**: Admin can dynamically enable/disable new user registrations
- **Persistent Volume Management**: Audio files stored on host filesystem for durability

## Quick Deployment Commands

### One-Command Start
```bash
./docker-start.sh  # Validates env vars, builds, and starts all services
```

### Manual Commands
```bash
# Start services
docker-compose up -d --build

# Monitor
docker-compose logs -f
docker-compose ps

# Database access
docker-compose exec mongo mongosh

# Cleanup
docker-compose down -v
```

## Role-Based Access Control (RBAC)

### Implementation Summary
Complete RBAC system implemented with admin and user roles:

**Backend RBAC Features:**
- Enhanced User model with role methods (`isAdmin()`, `canManageUsers()`, etc.)
- Comprehensive middleware suite (`requireAdmin`, `requireRole`, `requireUserManagement`, `requireSystemAccess`, `requireSelfOrAdmin`)
- Admin-only API endpoints for system management
- Default admin user creation on startup

**Frontend RBAC Features:**
- Role-aware authentication context with helper functions
- Admin navigation and dashboard access controls
- Complete admin dashboard with tabs (Overview, Users, Calls, Logs)
- User management interface with bulk operations
- Real-time system statistics and monitoring

**Security Features:**
- JWT token-based authentication with role claims
- Protected routes with role verification
- Self-or-admin access patterns for user data
- Rate limiting on authentication endpoints
- Secure admin operations (prevent last admin deletion, self-deletion)

### Admin Dashboard Components
- **AdminStats**: System overview with user, call, and note statistics
- **UserManagement**: Complete user CRUD with search, filtering, bulk operations
- **CallsOverview**: System-wide call monitoring and analytics
- **SystemLogs**: Recent activity logs and system health indicators

### Default Admin Account
- Username: `admin`
- Password: `admin123` (change on first login)
- Created automatically if no admin users exist

## Data Models

### Call Record Schema
```javascript
{
  callSid: String,           // Twilio call identifier
  from: String,              // Caller phone number
  to: String,                // Called phone number
  status: String,            // Call status (ringing, in-progress, completed, etc.)
  startTime: Date,           // Call start timestamp
  endTime: Date,             // Call end timestamp (optional)
  duration: Number,          // Call duration in milliseconds
  isAssistantCall: Boolean   // True if call from USER_PHONE_NUMBER
}
```

### Call Notes Schema
```javascript
{
  callSid: String,           // Associated call identifier
  transcript: String,        // Full conversation transcript
  notes: String,             // AI-generated structured notes
  source: String,            // 'audio_stream' or 'recording'
  audioChunks: Number,       // Number of audio chunks processed
  audioSize: Number,         // Total audio data size in bytes
  audioFilePath: String,     // Path to stored audio file (NEW)
  audioFileName: String,     // Name of stored audio file (NEW)
  createdAt: Date,           // Auto-generated timestamp
  updatedAt: Date            // Auto-generated timestamp
}
```

### User Schema
```javascript
{
  username: String,          // Unique username (3-50 chars)
  email: String,             // Unique email address
  password: String,          // Bcrypt hashed password (min 6 chars)
  role: String,              // 'admin' or 'user' (default: 'user')
  isActive: Boolean,         // Account active status (default: true)
  lastLogin: Date,           // Last login timestamp
  createdAt: Date,           // Account creation timestamp
  updatedAt: Date            // Last update timestamp
}
```

### System Settings Schema
```javascript
{
  setting: String,           // Setting name (unique)
  value: Mixed,              // Setting value (any type)
  description: String,       // Human-readable description
  updatedBy: ObjectId,       // User who last updated (ref: User)
  createdAt: Date,           // Setting creation timestamp
  updatedAt: Date            // Last update timestamp
}
```

## Recent Bug Fixes & Improvements

### v2.1.1 (Latest) - Critical Call Status Fix
- **🐛 Fixed Critical Call Status Database Update Issue**: Resolved calls not properly ending in database
- **🔧 Enhanced WebSocket Audio Stream Handling**: Added proper database updates to audio stream stop events
- **📊 Improved Debugging**: Added comprehensive logging for call lifecycle tracking
- **⚡ Performance**: Fixed async/await issues in WebSocket handlers

### v2.1.0 - Major Feature Release

### 🐛 Call Status Update Fix (Critical)
**Problem**: Calls remained in "ringing" status after completion, causing dashboard to show active calls indefinitely.

**Root Cause**: Calls were ending through WebSocket audio stream 'stop' events, but only the Twilio webhook handlers had database update logic. The WebSocket handler was broadcasting 'callEnded' events but not updating the database.

**Solution**: Enhanced both webhook and WebSocket processing to properly update database records:
- **WebSocket Handler Fix**: Added database update to audio stream 'stop' event handler (server.js:197-225)
- **Enhanced Webhook Processing**: Improved dual-path handling for calls in memory vs. post-restart scenarios
- **Async Function Fix**: Made WebSocket message handler async to support await database operations
- **Comprehensive Debugging**: Added detailed logging to track database updates in both code paths

**Technical Details**:
```javascript
// Added to WebSocket 'stop' event handler
const updatedCall = await Call.findOneAndUpdate(
  { callSid },
  { status: 'completed', endTime: new Date() },
  { new: true }
);
```

### 🎵 Audio File Storage & Download System
**Features Added**:
- Persistent audio file storage with Docker volume mapping
- Download endpoints with proper authentication and error handling
- Dashboard integration with download buttons for call notes
- File existence validation and proper HTTP headers for downloads

**Technical Implementation**:
- Modified audio processing to save files permanently instead of temporary cleanup
- Added `audioFilePath` and `audioFileName` fields to CallNote model
- Created secure download APIs with JWT authentication
- Fixed frontend download service to handle authentication properly

### ⚙️ System Settings Management
**Features Added**:
- Dynamic system configuration stored in MongoDB
- Admin interface for toggling user registration
- Extensible settings framework for future configurations
- Real-time updates through admin dashboard