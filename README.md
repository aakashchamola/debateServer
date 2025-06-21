# Online Debate Platform

A full-stack web application for conducting online debates with real-time messaging capabilities.

## 🏗️ **Project Structure**

```
debate-platform/
├── backend/                    # Django REST API + WebSocket server
│   ├── apps/                   # Django applications
│   │   ├── users/              # User management & authentication
│   │   ├── debates/            # Debate topics, sessions, messages
│   │   ├── moderation/         # Content moderation
│   │   ├── notifications/      # User notifications
│   │   └── voting/             # Voting system
│   ├── config/                 # Django settings and configuration
│   ├── requirements.txt        # Python dependencies
│   ├── manage.py              # Django management script
│   └── .env                   # Environment variables
│
├── frontend/                   # React.js client application
│   ├── public/                 # Static assets
│   ├── src/                    # React source code
│   │   ├── components/         # Reusable UI components
│   │   │   ├── ui/             # Base UI components (Button, Input, Card)
│   │   │   └── layout/         # Layout components (Header, Layout)
│   │   ├── pages/             # Page components (Login, Dashboard, etc.)
│   │   ├── services/          # API & WebSocket service layer
│   │   ├── context/           # React context providers (Auth)
│   │   ├── types/             # TypeScript type definitions
│   │   ├── utils/             # Utility functions
│   │   └── main.tsx           # Application entry point
│   ├── package.json           # Node.js dependencies
│   ├── tailwind.config.js     # Tailwind CSS configuration
│   ├── vite.config.ts         # Vite configuration
│   └── .env                   # Frontend environment variables
│
├── docs/                      # Project documentation
├── docker/                    # Docker configuration files
├── scripts/                   # Utility scripts
├── .gitignore                # Git ignore rules
├── README.md                 # Project documentation
└── docker-compose.yml       # Multi-container setup
```

## 🚀 **Tech Stack**

### Backend
- **Framework**: Django 5.2.3 + Django REST Framework
- **Real-time**: Django Channels + WebSockets
- **Authentication**: JWT (Simple JWT)
- **Database**: SQLite (dev) / PostgreSQL (prod)
- **API Documentation**: drf-spectacular (Swagger/OpenAPI)
- **Server**: Daphne (ASGI)

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Routing**: React Router v6
- **State Management**: React Context + TanStack Query
- **UI Framework**: Tailwind CSS
- **WebSocket**: Native WebSocket API
- **HTTP Client**: Axios
- **Form Handling**: React Hook Form + Zod validation
- **Icons**: Lucide React

## 🔧 **Development Setup**

### Prerequisites
- Python 3.9+
- Node.js 18+
- Git

### Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py create_sample_data
python manage.py createsuperuser
```

### Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

### Running Both Services
```bash
# Terminal 1 - Backend (Django + Channels)
cd backend
source venv/bin/activate
python manage.py runserver 8000

# Terminal 2 - Frontend (React + Vite)
cd frontend
npm run dev
```

Access the applications:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **Django Admin**: http://localhost:8000/admin
- **API Documentation**: http://localhost:8000/api/docs/

## 📡 **API Endpoints**

### Authentication
- `POST /api/users/login/` - User login
- `POST /api/users/register/` - User registration
- `POST /api/users/logout/` - User logout
- `POST /api/users/token/refresh/` - Refresh JWT token
- `GET /api/users/profile/` - Get current user profile

### Debates
- `GET /api/debates/topics/` - List debate topics
- `POST /api/debates/topics/` - Create topic (moderators only)
- `GET /api/debates/sessions/` - List debate sessions
- `POST /api/debates/sessions/` - Create session (moderators only)
- `POST /api/debates/sessions/{id}/join/` - Join session
- `GET /api/debates/messages/?session={id}` - Get session messages

### WebSocket
- `ws://localhost:8000/ws/debates/{session_id}/` - Real-time messaging

## 🔐 **Environment Variables**

### Backend (.env)
```env
SECRET_KEY=your-secret-key-for-development
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
```

### Frontend (.env)
```env
REACT_APP_API_URL=http://localhost:8001
REACT_APP_WS_URL=ws://localhost:8001
```

## 📚 **Documentation**

- [Admin Guide](backend/ADMIN_GUIDE.md) - Django admin panel usage
- [API Documentation](http://localhost:8001/api/docs/) - Swagger UI
- [WebSocket Testing](backend/test_websocket.html) - WebSocket test client

## 🚀 **Deployment**

### Production Backend
- Use PostgreSQL database
- Configure Redis for channel layers
- Set DEBUG=False
- Use environment variables for secrets

### Production Frontend
- Build with `npm run build`
- Serve static files with nginx
- Configure API URLs for production

## 🤝 **Contributing**

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request