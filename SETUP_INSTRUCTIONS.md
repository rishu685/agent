# AgentX Setup Instructions

## Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- Google Gemini API Key

## Setup Steps

### 1. Environment Configuration

#### Google Gemini API Key
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Create a `.env` file in the root directory
4. Add your API key:
```
GEMINI_API_KEY=your_gemini_api_key_here
```

### 2. Installation

#### Install Dependencies
1. Install backend dependencies:
```bash
cd backend
npm install
```

2. Install frontend dependencies:
```bash
cd ../App
npm install
```

### 3. Running the Project

#### Option 1: Use the startup script (Recommended)
```bash
chmod +x start_project.sh
./start_project.sh
```

#### Option 2: Manual startup
1. Start the Express.js backend:
```bash
cd backend
node server.js
```

2. In a new terminal, start the React frontend:
```bash
cd App
npm start
```

### 4. Access the Application
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## Features

### User Authentication
- Sign up with email and password
- Login to access personalized features

### Document Upload & Processing
- Upload PDF and text files
- Automatic text extraction and processing
- Document-based AI conversations

### AI Chat Interface
- Interactive chat with Google Gemini AI
- Context-aware responses using uploaded documents
- Conversation history

### Custom AI Assistants
- Save personalized AI configurations
- Manage multiple AI assistants
- Task-specific AI models

## API Endpoints

### Authentication
- `POST /signup` - User registration
- `POST /login` - User login

### AI & Documents
- `POST /query` - Send queries to AI
- `POST /upload` - Upload documents
- `GET /get-user-llms` - Get user's AI assistants
- `POST /save-llm` - Save custom AI assistant
- `GET /documents` - Get user's documents

### System
- `GET /health` - Health check

## Troubleshooting

### Common Issues

1. **Port already in use**
   - Kill existing processes: `pkill -f "node.*server.js"`
   - Or use different ports in configuration

2. **Gemini API errors**
   - Verify your API key is correct
   - Check if you have sufficient quota
   - Ensure API key has proper permissions

3. **File upload issues**
   - Check file size limits (10MB max)
   - Ensure only PDF/text files are uploaded
   - Verify backend permissions for file writing

4. **Frontend build issues**
   - Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`
   - Clear npm cache: `npm cache clean --force`

## Development

### Project Structure
```
AgentX/
├── App/                 # React frontend
│   ├── src/
│   ├── public/
│   └── package.json
├── backend/             # Express.js backend
│   ├── routes/
│   ├── server.js
│   └── package.json
├── .env                 # Environment variables
├── start_project.sh     # Startup script
└── README.md
```

### Environment Variables
- `GEMINI_API_KEY` - Google Gemini AI API key
- `PORT` - Backend server port (default: 5000)

For more detailed information, see the main README.md file.
