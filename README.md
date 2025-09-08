# AgentX - AI Assistant Platform

AgentX is a comprehensive AI assistant platform that allows users to upload documents, create custom AI models, and interact with intelligent chatbots. Built with React.js frontend and Express.js backend, integrated with Google Gemini AI.

## Features

- 🤖 **AI Chat Interface**: Interactive chat with Google Gemini AI
- 📄 **Document Upload**: Upload and process PDF/text documents  
- 💾 **Custom AI Models**: Save and manage personalized AI assistants
- 👤 **User Authentication**: Secure signup and login system
- 📊 **Dashboard**: Manage your AI assistants and documents
- 🎨 **Modern UI**: Beautiful, responsive interface with animations

## Tech Stack

### Frontend
- React.js
- Framer Motion (animations)
- Tailwind CSS (styling)
- Lucide React (icons)

### Backend
- Express.js
- Google Generative AI (Gemini)
- Multer (file uploads)
- PDF parsing
- JSON-based data storage

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- Google Gemini API key

### Installation

1. Clone the repository:
```bash
git clone https://github.com/rishu685/agent.git
cd agent
```

2. Set up the backend:
```bash
cd backend
npm install
```

3. Set up the frontend:
```bash
cd ../App
npm install
```

4. Configure environment variables:
Create a `.env` file in the root directory:
```
GEMINI_API_KEY=your_gemini_api_key_here
```

### Running the Application

1. Start the backend server:
```bash
cd backend
node server.js
```
The backend will run on http://localhost:5000

2. Start the frontend (in a new terminal):
```bash
cd App
npm start
```
The frontend will run on http://localhost:3000

## Usage

1. **Sign Up**: Create a new account
2. **Upload Documents**: Upload PDF or text files for AI processing
3. **Chat with AI**: Ask questions about your documents or general queries
4. **Save Custom AI**: Save specialized AI assistants for specific tasks
5. **Manage Dashboard**: View and manage your AI assistants

## API Endpoints

### Authentication
- `POST /signup` - Create new user account
- `POST /login` - User login

### AI & Documents
- `POST /query` - Send query to AI assistant
- `POST /upload` - Upload documents for processing
- `GET /get-user-llms` - Get user's saved AI assistants
- `POST /save-llm` - Save custom AI assistant

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/new-feature`)
3. Commit your changes (`git commit -m 'Add new feature'`)
4. Push to the branch (`git push origin feature/new-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Support

For support, please open an issue on GitHub or contact the maintainer.
