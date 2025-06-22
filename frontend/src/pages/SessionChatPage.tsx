import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Layout } from '@/components/layout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui';
import { Send, ArrowLeft, MessageCircle } from 'lucide-react';
import { apiService } from '@/services/api';

// Local type definitions
interface User {
  id: number;
  username: string;
  email: string;
  role: 'STUDENT' | 'MODERATOR';
  is_active: boolean;
  date_joined: string;
}

interface DebateTopic {
  id: number;
  title: string;
  description: string;
  created_by: User;
  created_at: string;
  updated_at: string;
}

interface DebateSession {
  id: number;
  topic: DebateTopic;
  title: string;
  description: string;
  start_time: string;
  duration_minutes: number;
  max_participants: number;
  participants_count: number;
  created_by: User;
  is_ongoing: boolean;
  user_has_joined: boolean;
  created_at: string;
}

interface EnterChatResponse {
  session: DebateSession;
  user_role: 'moderator' | 'participant';
  is_session_creator: boolean;
  message: string;
  participant?: any;
}

interface ChatMessage {
  id: string;
  user: User;
  content: string;
  timestamp: string;
  session_id: number;
}

const safeFormatTime = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (error) {
    console.error('Error formatting time:', error);
    return '';
  }
};

const getInitials = (name: string): string => {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

export function SessionChatPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [session, setSession] = useState<DebateSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [wsConnected, setWsConnected] = useState(false);
  const [sending, setSending] = useState(false);
  
  // Role and moderator status
  const [userRole, setUserRole] = useState<'moderator' | 'participant' | null>(null);
  const [isSessionCreator, setIsSessionCreator] = useState(false);
  
  // Online and typing state
  const [onlineCount, setOnlineCount] = useState(0);
  const [totalParticipants, setTotalParticipants] = useState(0);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  console.log('SessionChatPage rendered with sessionId:', sessionId, 'user:', user?.username);
  console.log('Component state:', { 
    loading, 
    error, 
    session: !!session, 
    messagesCount: messages.length,
    onlineCount,
    totalParticipants,
    typingUsers,
    userRole,
    isSessionCreator
  });

  // Early return for missing auth
  if (!user) {
    console.log('No user found, redirecting to auth');
    navigate('/auth/login');
    return null;
  }

  // Scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch session data and handle join/enter chat logic
  useEffect(() => {
    const fetchSessionAndSetupChat = async () => {
      if (!sessionId) {
        setError('Session ID not provided');
        setLoading(false);
        return;
      }

      try {
        console.log('Fetching session data for ID:', sessionId);
        
        // Fetch session details
        const sessionResponse = await apiService.getSession(parseInt(sessionId));
        const sessionData = sessionResponse.data as any;
        console.log('Session data:', sessionData);
        
        setSession(sessionData);
        
        // Check if user needs to join the session first (only for non-moderators)
        const isModerator = user?.role === 'MODERATOR' && sessionData.created_by.id === user.id;
        
        if (!sessionData.user_has_joined && !isModerator) {
          console.log('User not yet a participant, attempting to join...');
          try {
            await apiService.joinSession(parseInt(sessionId));
            console.log('Successfully joined session');
            
            // Refresh session data to get updated user_has_joined status
            const updatedSessionResponse = await apiService.getSession(parseInt(sessionId));
            const updatedSessionData = updatedSessionResponse.data as any;
            setSession(updatedSessionData);
            
          } catch (joinError: any) {
            console.error('Failed to join session:', joinError);
            if (joinError.response?.status === 400) {
              setError('Cannot join this session. It may be scheduled for later or not currently active.');
            } else {
              setError(`Failed to join session: ${joinError.message || 'Unknown error'}`);
            }
            setLoading(false);
            return;
          }
        }
        
        // Now enter the chat and get role information
        console.log('Entering chat...');
        try {
          const enterChatResponse = await apiService.enterChat(parseInt(sessionId));
          const chatData = enterChatResponse.data as EnterChatResponse;
          
          // Set role information
          setUserRole(chatData.user_role);
          setIsSessionCreator(chatData.is_session_creator);
          console.log('Chat role:', chatData.user_role, 'Is creator:', chatData.is_session_creator);
          
        } catch (enterError: any) {
          console.error('Failed to enter chat:', enterError);
          if (enterError.response?.status === 403) {
            setError('You do not have permission to access this chat.');
          } else {
            setError(`Failed to enter chat: ${enterError.message || 'Unknown error'}`);
          }
          setLoading(false);
          return;
        }
        
        // Fetch message history using the new endpoint
        console.log('Fetching message history...');
        try {
          const messagesResponse = await apiService.getSessionMessages(parseInt(sessionId));
          const messageHistory = messagesResponse.data.results || [];
          console.log('Message history:', messageHistory);
          
          // Transform API messages to match our ChatMessage interface
          const transformedMessages = messageHistory
            .filter((msg: any) => msg && msg.user && msg.content) // Filter out invalid messages
            .map((msg: any) => ({
              id: msg.id.toString(),
              user: {
                id: msg.user.id || 0,
                username: msg.user.username || 'Unknown User',
                email: msg.user.email || '',
                role: msg.user.role || 'STUDENT',
                is_active: msg.user.is_active || true,
                date_joined: msg.user.date_joined || new Date().toISOString()
              },
              content: msg.content,
              timestamp: msg.created_at || msg.timestamp || new Date().toISOString(),
              session_id: parseInt(sessionId)
            }));
          
          setMessages(transformedMessages);
        } catch (error) {
          console.error('Failed to fetch message history:', error);
          // Don't set error for message history failure, just log it
        }
        
      } catch (error) {
        console.error('Failed to fetch session:', error);
        setError(`Failed to load session: ${error instanceof Error ? error.message : 'Unknown error'}`);
      } finally {
        setLoading(false);
      }
    };

    fetchSessionAndSetupChat();
  }, [sessionId]);

  // WebSocket connection
  useEffect(() => {
    if (!session || !user) return;

    const connectWebSocket = () => {
      const token = localStorage.getItem('accessToken');
      const wsUrl = `ws://localhost:8001/ws/debate/${sessionId}/?token=${token}`;
      
      console.log('Connecting to WebSocket:', wsUrl);
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket connected');
        setWsConnected(true);
        setError(null);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('WebSocket message:', data);
          
          switch (data.type) {
            case 'connection_established':
              console.log('Connection established:', data.message);
              if (data.online_count !== undefined) {
                setOnlineCount(data.online_count);
              }
              if (data.total_participants !== undefined) {
                setTotalParticipants(data.total_participants);
              }
              break;
              
            case 'online_count_update':
              setOnlineCount(data.online_count);
              setTotalParticipants(data.total_participants);
              console.log(`Online count updated: ${data.online_count}/${data.total_participants}`);
              if (data.user_joined) {
                console.log(`${data.user_joined.username} joined the chat`);
              }
              if (data.user_left) {
                console.log(`${data.user_left.username} left the chat`);
              }
              break;
              
            case 'typing_indicator':
              handleTypingIndicator(data.user, data.is_typing);
              break;
              
            case 'chat_message':
              // Add new message
              setMessages(prev => {
                // Check for duplicates by ID
                const isDuplicate = prev.some(msg => msg.id === data.message.id.toString());
                
                if (isDuplicate) {
                  console.log('Duplicate message detected, ignoring');
                  return prev;
                }
                
                return [...prev, {
                  id: data.message.id.toString(),
                  user: data.message.user,
                  content: data.message.content,
                  timestamp: data.message.timestamp,
                  session_id: parseInt(sessionId!)
                }];
              });
              break;
              
            case 'error':
              console.error('WebSocket error:', data.message);
              setError(data.message);
              break;
              
            default:
              console.log('Unknown message type:', data.type);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason);
        setWsConnected(false);
        
        // Attempt to reconnect if not closed intentionally
        if (event.code !== 1000) {
          setTimeout(connectWebSocket, 3000);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setWsConnected(false);
        setError('Failed to connect to chat. Please try refreshing the page.');
      };
    };

    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close(1000, 'Component unmounting');
      }
    };
  }, [session, user, sessionId]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      return;
    }

    try {
      setSending(true);
      
      // Clear typing indicator
      setIsTyping(false);
      sendTypingIndicator(false);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      const messageData = {
        type: 'chat_message',
        content: newMessage.trim()
      };

      wsRef.current.send(JSON.stringify(messageData));
      setNewMessage('');
      
      // Reset textarea height
      if (inputRef.current) {
        inputRef.current.style.height = '44px';
        inputRef.current.focus();
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  // Helper functions
  const handleTypingIndicator = (username: string, isTyping: boolean) => {
    setTypingUsers(prev => {
      if (isTyping) {
        // Add user to typing list if not already there
        return prev.includes(username) ? prev : [...prev, username];
      } else {
        // Remove user from typing list
        return prev.filter(u => u !== username);
      }
    });
  };

  const sendTypingIndicator = (typing: boolean) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'typing',
        is_typing: typing
      }));
    }
  };

  const handleStartSessionNow = async () => {
    if (!session || userRole !== 'moderator') return;
    
    try {
      await apiService.startSessionNow(session.id);
      
      // Refresh session data
      const updatedSessionResponse = await apiService.getSession(session.id);
      setSession(updatedSessionResponse.data as any);
      
      alert('Session started successfully!');
      
    } catch (error) {
      console.error('Failed to start session:', error);
      alert('Failed to start session. Please try again.');
    }
  };

  const handleUpdateSessionTime = async (newStartTime: string) => {
    if (!session || userRole !== 'moderator') return;
    
    try {
      await apiService.rescheduleSession(session.id, newStartTime);
      
      // Refresh session data
      const updatedSessionResponse = await apiService.getSession(session.id);
      setSession(updatedSessionResponse.data as any);
      
      alert('Session rescheduled successfully!');
      
    } catch (error) {
      console.error('Failed to update session time:', error);
      alert('Failed to update session time. Please try again.');
    }
  };

  const handleUpdateMaxParticipants = async (newMaxParticipants: number) => {
    if (!session || userRole !== 'moderator') return;
    
    try {
      const updateData = {
        max_participants: newMaxParticipants
      };
      
      await apiService.updateSession(session.id, updateData);
      
      // Refresh session data
      const updatedSessionResponse = await apiService.getSession(session.id);
      setSession(updatedSessionResponse.data as any);
      
    } catch (error) {
      console.error('Failed to update max participants:', error);
      alert('Failed to update participant limit. Please try again.');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setNewMessage(value);

    // Handle typing indicator
    if (value.length > 0 && !isTyping) {
      setIsTyping(true);
      sendTypingIndicator(true);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set timeout to stop typing indicator after 1 second of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      sendTypingIndicator(false);
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (loading) {
    console.log('Showing loading state');
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="text-gray-600">Loading debate session...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    console.log('Showing error state:', error);
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-screen text-center">
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg mb-6 max-w-md">
            <h3 className="font-semibold mb-2">Unable to access chat</h3>
            <p className="text-sm">{error}</p>
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Return to Dashboard
          </button>
        </div>
      </Layout>
    );
  }

  if (!session) {
    console.log('No session found');
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-gray-500">Session not found</p>
        </div>
      </Layout>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] md:h-[calc(100vh-5rem)] font-sans bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-gray-100">
      <div className="flex flex-1 overflow-hidden">
        {/* --- Sidebar: Session Details --- */}
        <aside className="w-80 lg:w-96 flex-shrink-0 bg-white/95 dark:bg-slate-800/95 backdrop-blur-md border-r border-gray-200/80 dark:border-slate-700/80 hidden md:flex flex-col shadow-lg">
          <div className="flex-shrink-0 p-6 border-b border-gray-200/80 dark:border-slate-700/80">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 dark:hover:from-slate-700 dark:hover:to-slate-600 rounded-xl transition-all duration-200 w-full group"
            >
              <ArrowLeft className="h-5 w-5 transition-transform duration-200 group-hover:-translate-x-1" />
              <span>Back to Dashboard</span>
            </button>
          </div>

          <div className="flex-1 p-6 overflow-y-auto space-y-6 custom-scrollbar">
            <div className="space-y-3">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white leading-tight">{session.topic.title}</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{session.topic.description}</p>
            </div>

            <Card className="bg-gradient-to-br from-gray-50/80 to-blue-50/50 dark:from-slate-900/80 dark:to-slate-800/50 border-gray-200/80 dark:border-slate-700/80 shadow-md hover:shadow-lg transition-shadow duration-200">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  Session Info
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600 dark:text-gray-400 font-medium">Status</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold shadow-sm ${session.is_ongoing ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 dark:from-green-900/60 dark:to-emerald-900/60 dark:text-green-200' : 'bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-800 dark:from-yellow-900/60 dark:to-amber-900/60 dark:text-yellow-200'}`}>
                    {session.is_ongoing ? '🟢 Live' : '🟡 Scheduled'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600 dark:text-gray-400 font-medium">Participants</span>
                  <span className="font-semibold text-gray-800 dark:text-gray-200">{session.participants_count} / {session.max_participants}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600 dark:text-gray-400 font-medium">Online Now</span>
                  <span className="font-semibold text-green-600 dark:text-green-400 flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    {onlineCount} / {totalParticipants}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600 dark:text-gray-400 font-medium">Duration</span>
                  <span className="font-semibold text-gray-800 dark:text-gray-200">{session.duration_minutes} mins</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-amber-50/80 to-orange-50/50 dark:from-amber-900/30 dark:to-orange-900/30 border-amber-200/80 dark:border-amber-700/80 shadow-md hover:shadow-lg transition-shadow duration-200">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                  {userRole === 'moderator' && isSessionCreator ? 'You are the Moderator' : 'Moderator'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div 
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold shadow-lg"
                    style={{
                      background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
                    }}
                  >
                    {getInitials(session.created_by.username)}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white text-base">
                      {userRole === 'moderator' && isSessionCreator ? 'You' : session.created_by.username}
                    </p>
                    <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                      {userRole === 'moderator' && isSessionCreator ? 'Session Host (You)' : 'Session Host'}
                    </p>
                  </div>
                </div>
                
                {/* Moderator Controls */}
                {userRole === 'moderator' && isSessionCreator && (
                  <div className="mt-4 space-y-2">
                    <div className="text-xs text-amber-700 dark:text-amber-300 font-medium border-t border-amber-200 dark:border-amber-700 pt-3">
                      Moderator Controls:
                    </div>
                    
                    {!session.is_ongoing && (
                      <button
                        onClick={handleStartSessionNow}
                        className="w-full px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
                      >
                        🚀 Start Session Now
                      </button>
                    )}
                    
                    <button
                      onClick={() => {
                        const newTime = prompt('Enter new start time (YYYY-MM-DDTHH:MM format):');
                        if (newTime) handleUpdateSessionTime(newTime);
                      }}
                      className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      📅 Update Session Time
                    </button>
                    
                    <button
                      onClick={() => {
                        const newMaxParticipants = prompt('Enter new max participants:');
                        if (newMaxParticipants && !isNaN(parseInt(newMaxParticipants))) {
                          handleUpdateMaxParticipants(parseInt(newMaxParticipants));
                        }
                      }}
                      className="w-full px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      👥 Update Participant Limit
                    </button>
                    
                    <div className="text-xs text-amber-600 dark:text-amber-400 italic">
                      You have full control over this session
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Additional Moderator Panel */}
            {userRole === 'moderator' && isSessionCreator && (
              <Card className="bg-gradient-to-br from-red-50/80 to-pink-50/50 dark:from-red-900/30 dark:to-pink-900/30 border-red-200/80 dark:border-red-700/80 shadow-md hover:shadow-lg transition-shadow duration-200">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    Session Management
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-xs text-red-700 dark:text-red-300 font-medium">
                    Chat Moderation:
                  </div>
                  
                  <button
                    onClick={() => {
                      // In a real app, you'd implement this
                      console.log('Clear chat messages');
                      alert('Chat clearing feature - to be implemented');
                    }}
                    className="w-full px-3 py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    🧹 Clear Chat History
                  </button>
                  
                  <button
                    onClick={() => {
                      // In a real app, you'd implement this
                      console.log('Mute all participants');
                      alert('Mute all feature - to be implemented');
                    }}
                    className="w-full px-3 py-2 bg-yellow-600 hover:bg-yellow-700 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    🔇 Mute All Participants
                  </button>
                  
                  <button
                    onClick={() => {
                      if (confirm('Are you sure you want to end this session? This cannot be undone.')) {
                        // In a real app, you'd implement this
                        console.log('End session');
                        alert('End session feature - to be implemented');
                      }
                    }}
                    className="w-full px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    ⛔ End Session
                  </button>
                  
                  <div className="text-xs text-red-600 dark:text-red-400 italic">
                    Use with caution
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="flex-shrink-0 p-6 border-t border-gray-200/80 dark:border-slate-700/80">
            <div className={`flex items-center justify-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold shadow-sm transition-all duration-200 ${wsConnected ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 dark:from-green-900/60 dark:to-emerald-900/60 dark:text-green-200' : 'bg-gradient-to-r from-red-100 to-pink-100 text-red-800 dark:from-red-900/60 dark:to-pink-900/60 dark:text-red-200'}`}>
              <div className={`w-3 h-3 rounded-full ${wsConnected ? 'bg-green-500 animate-pulse shadow-md' : 'bg-red-500 shadow-md'}`}></div>
              <span>{wsConnected ? 'Connected' : 'Connecting...'}</span>
              {userRole === 'moderator' && isSessionCreator && (
                <span className="text-xs bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200 px-2 py-1 rounded-full">
                  MOD
                </span>
              )}
            </div>
          </div>
        </aside>

        {/* --- Main Chat Area --- */}
        <main className="flex-1 flex flex-col min-w-0 bg-slate-50 dark:bg-slate-800/50">
          <header className="flex items-center justify-between p-4 border-b border-gray-200/80 dark:border-slate-700/80 bg-white/95 dark:bg-slate-800/95 backdrop-blur-md sticky top-0 z-10 shadow-sm md:hidden">
            <button 
              onClick={() => navigate('/dashboard')} 
              className="p-2.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="text-center flex-1 mx-4">
              <h2 className="font-semibold text-base text-gray-900 dark:text-white truncate">{session.topic.title}</h2>
              <div className="flex items-center justify-center gap-2 mt-1">
                <p className="text-xs text-gray-500 dark:text-gray-400">{session.participants_count} participants</p>
                <span className="text-gray-300 dark:text-gray-600">•</span>
                <span className={`text-xs font-medium ${session.is_ongoing ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'}`}>
                  {session.is_ongoing ? 'Live' : 'Scheduled'}
                </span>
                {userRole === 'moderator' && isSessionCreator && (
                  <>
                    <span className="text-gray-300 dark:text-gray-600">•</span>
                    <span className="text-xs font-medium text-amber-600 dark:text-amber-400">Moderator</span>
                  </>
                )}
              </div>
            </div>
            <div className={`w-3 h-3 rounded-full flex-shrink-0 shadow-sm ${wsConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          </header>

          {/* Messages Container with dedicated scrollbar */}
          <div 
            className="flex-1 overflow-y-auto p-4 sm:p-6"
          >
            {/* Message container with enhanced background and spacing */}
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-slate-700 dark:to-slate-800 rounded-full flex items-center justify-center mb-6 shadow-lg">
                  <MessageCircle className="h-10 w-10 text-blue-500 dark:text-blue-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-3">Welcome to the debate!</h3>
                <p className="text-gray-600 dark:text-gray-400 max-w-md leading-relaxed">
                  {session.user_has_joined ? "Messages will appear here. Be the first to share your thoughts!" : "You must join the session to see and send messages."}
                </p>
              </div>
            ) : (
              <div className="space-y-4 pb-4">
                {messages.filter(msg => msg && msg.user).map((message, index) => {
                  const isCurrentUser = message.user.id === user?.id;
                  const isModerator = message.user.role === 'MODERATOR';
                  const isCurrentUserModerator = isCurrentUser && userRole === 'moderator';
                  const prevMessage = messages[index - 1];
                  const showHeader = !prevMessage || prevMessage.user.id !== message.user.id || new Date(message.timestamp).getTime() - new Date(prevMessage.timestamp).getTime() > 300000;

                  return (
                    <div key={message.id} className={`flex items-start gap-3 ${isCurrentUser ? 'flex-row-reverse' : 'flex-row'} ${showHeader ? 'mt-6' : 'mt-1'} transition-all duration-200 hover:scale-[1.01] group`}>
                      <div className="w-12 flex-shrink-0">
                        {showHeader && (
                          <div 
                            className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold shadow-lg transition-transform duration-200 group-hover:scale-110"
                            style={{
                              backgroundColor: isModerator ? '#f59e0b' : isCurrentUser ? '#1f2937' : '#7c3aed',
                              color: '#ffffff',
                              background: isModerator 
                                ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' 
                                : isCurrentUser 
                                ? 'linear-gradient(135deg, #1f2937 0%, #111827 100%)' 
                                : 'linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)'
                            }}
                          >
                            {getInitials(message.user.username)}
                          </div>
                        )}
                      </div>
                      
                      <div className={`max-w-lg w-fit ${isCurrentUser ? 'items-end' : 'items-start'} flex flex-col`}>
                        {showHeader && (
                          <div className={`mb-2 px-1 ${isCurrentUser ? 'text-right' : 'text-left'}`}>
                            <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                              {isCurrentUser ? (isCurrentUserModerator ? 'You (Moderator)' : 'You') : message.user.username}
                            </span>
                            {isModerator && !isCurrentUser && (
                              <span className="ml-2 px-2 py-0.5 bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200 text-xs font-medium rounded-full">
                                Moderator
                              </span>
                            )}
                            {isCurrentUserModerator && (
                              <span className="ml-2 px-2 py-0.5 bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200 text-xs font-medium rounded-full">
                                Moderator
                              </span>
                            )}
                            <div className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-0.5">
                              {safeFormatTime(message.timestamp)}
                            </div>
                          </div>
                        )}
                        
                        <div 
                          className="px-5 py-3 rounded-2xl shadow-lg transition-all duration-200 group-hover:shadow-xl relative"
                          style={{
                            backgroundColor: isCurrentUser ? '#1f2937' : isModerator ? '#f59e0b' : '#7c3aed',
                            color: '#ffffff',
                            background: isCurrentUser 
                              ? 'linear-gradient(135deg, #1f2937 0%, #111827 100%)' 
                              : isModerator 
                              ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' 
                              : 'linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)',
                            borderRadius: isCurrentUser ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                          }}
                        >
                          <p className="text-base break-words whitespace-pre-wrap font-medium leading-relaxed">
                            {message.content}
                          </p>
                          {/* Message tail */}
                          <div 
                            className="absolute w-3 h-3 transform rotate-45"
                            style={{
                              backgroundColor: isCurrentUser ? '#1f2937' : isModerator ? '#f59e0b' : '#7c3aed',
                              [isCurrentUser ? 'right' : 'left']: '-6px',
                              bottom: '12px',
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="flex-shrink-0 p-4 bg-white/95 dark:bg-slate-800/95 backdrop-blur-md border-t border-gray-200/80 dark:border-slate-700/80 shadow-lg">
            {/* Typing indicators */}
            {typingUsers.length > 0 && (
              <div className="mb-3 text-sm text-gray-500 dark:text-gray-400 italic flex items-center gap-2">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span>
                  {typingUsers.length === 1 
                    ? `${typingUsers[0]} is typing...`
                    : typingUsers.length === 2
                    ? `${typingUsers[0]} and ${typingUsers[1]} are typing...`
                    : `${typingUsers[0]} and ${typingUsers.length - 1} others are typing...`
                  }
                </span>
              </div>
            )}
            
            {session.user_has_joined || userRole === 'moderator' ? (
              <form onSubmit={(e) => { e.preventDefault(); sendMessage(); }} className="flex items-end gap-3">
                <div className="flex-1 relative">
                  <textarea 
                    ref={inputRef} 
                    value={newMessage} 
                    onChange={handleInputChange} 
                    onKeyDown={handleKeyPress}
                    placeholder={
                      userRole === 'moderator' 
                        ? "Type your message as moderator..." 
                        : "Type your message..."
                    }
                    className="w-full p-4 bg-gray-50 dark:bg-slate-700/80 rounded-2xl border-2 border-gray-200 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none resize-none transition-all duration-200 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-gray-100 shadow-sm hover:shadow-md focus:shadow-lg" 
                    rows={1} 
                    style={{ minHeight: '52px', maxHeight: '120px' }} 
                    disabled={!wsConnected || sending} 
                  />
                  {!wsConnected && (
                    <div className="absolute inset-0 bg-gray-100/80 dark:bg-slate-700/80 rounded-2xl flex items-center justify-center">
                      <span className="text-sm text-gray-500 dark:text-gray-400">Connecting...</span>
                    </div>
                  )}
                </div>
                <button 
                  type="submit" 
                  className="w-14 h-14 flex-shrink-0 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 dark:from-blue-500 dark:to-blue-600 dark:hover:from-blue-600 dark:hover:to-blue-700 text-white rounded-2xl flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95" 
                  disabled={!newMessage.trim() || !wsConnected || sending}
                >
                  {sending ? 
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div> : 
                    <Send className="h-6 w-6" />
                  }
                </button>
              </form>
            ) : (
              <div className="text-center p-4 bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/30 dark:to-amber-900/30 text-yellow-800 dark:text-yellow-200 rounded-2xl border border-yellow-200 dark:border-yellow-700/50 shadow-sm">
                <p className="font-medium text-sm">You have not joined this session. Please join to participate in the discussion.</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
