# Debate Platform Frontend

A modern React frontend for the Debate Platform, built with TypeScript, Vite, and Tailwind CSS.

## 🚀 Features

- **Modern React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for utility-first styling
- **React Router** for client-side routing
- **React Hook Form** with Zod validation
- **TanStack Query** for server state management
- **Axios** for API communication
- **WebSocket** support for real-time features
- **Responsive design** with mobile-first approach
- **JWT Authentication** with automatic token refresh
- **Modular component architecture**

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # Base UI components (Button, Input, Card, etc.)
│   └── layout/         # Layout components (Header, Layout)
├── pages/              # Page components
├── context/            # React contexts (Auth, etc.)
├── services/           # API and WebSocket services
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
└── main.tsx           # Application entry point
```

## 🛠️ Setup and Installation

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Backend server running on port 8000

### Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` file with your configuration:
   ```bash
   VITE_API_BASE_URL=http://localhost:8000
   VITE_WS_BASE_URL=ws://localhost:8000
   ```

3. **Start development server**:
   ```bash
   npm run dev
   ```

4. **Open your browser**:
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📦 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🔧 Development

### API Integration

The frontend uses a centralized API service (`src/services/api.ts`) that handles:
- Authentication (login, register, logout)
- JWT token management with automatic refresh
- All CRUD operations for debates, topics, sessions
- Error handling and request/response interceptors

### WebSocket Integration

Real-time features are handled by the WebSocket service (`src/services/websocket.ts`):
- Connection management with auto-reconnect
- Event-based messaging system
- Session-based room management

## 🔐 Authentication

The app implements JWT-based authentication with:
- Automatic token refresh
- Protected and public routes
- Role-based access control (Student/Moderator)
- Persistent login state

## 📱 Responsive Design

The UI is mobile-first and responsive with Tailwind CSS utilities.

## 📄 License

This project is licensed under the MIT License.
