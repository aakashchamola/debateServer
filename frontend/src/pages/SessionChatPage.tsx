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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  console.log('SessionChatPage rendered with sessionId:', sessionId, 'user:', user?.username);
  console.log('Component state:', { loading, error, session: !!session, messagesCount: messages.length });

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

  // Fetch session data and message history
  useEffect(() => {
    const fetchSessionAndMessages = async () => {
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
        
        // Fetch message history for participants
        if (sessionData.user_has_joined) {
          console.log('Fetching message history...');
          try {
            const messagesResponse = await apiService.getMessages(parseInt(sessionId));
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
        }
        
      } catch (error) {
        console.error('Failed to fetch session:', error);
        setError(`Failed to load session: ${error instanceof Error ? error.message : 'Unknown error'}`);
      } finally {
        setLoading(false);
      }
    };

    fetchSessionAndMessages();
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
            case 'typing_indicator':
              // Handle typing indicators (you can implement this later)
              break;
            case 'error':
              console.error('WebSocket error:', data.message);
              setError(data.message);
              break;
            case 'user_left':
              console.log('User left:', data.user.username);
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

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewMessage(e.target.value);
    
    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = '44px';
    const scrollHeight = textarea.scrollHeight;
    const maxHeight = 120;
    
    if (scrollHeight > 44) {
      textarea.style.height = Math.min(scrollHeight, maxHeight) + 'px';
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
    <Layout>
      {/* Full-screen chat layout with proper backgrounds */}
      <div className="flex flex-col h-screen bg-gray-50 dark:bg-slate-900">
        {/* Compact Header with clear contrast */}
        <div className="flex-shrink-0 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => navigate('/dashboard')}
                  className="flex items-center gap-2 px-3 py-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-all duration-200 font-medium"
                >
                  <ArrowLeft className="h-5 w-5" />
                  <span className="hidden sm:inline">Back</span>
                </button>
                <div className="border-l border-gray-200 dark:border-slate-600 pl-4">
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                    {session.topic.title}
                  </h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400 hidden sm:block">{session.topic.description}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="hidden sm:flex items-center gap-4">
                  <div className="text-center">
                    <div className="text-lg font-bold text-blue-600 dark:text-blue-400">{session.participants_count}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Participants</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-gray-700 dark:text-gray-300">{session.duration_minutes}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Minutes</div>
                  </div>
                </div>
                <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                  session.is_ongoing
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                }`}>
                  {session.is_ongoing ? 'Live' : 'Scheduled'}
                </div>
                <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                  wsConnected 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' 
                    : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                }`}>
                  <div className={`w-2 h-2 rounded-full ${
                    wsConnected ? 'bg-green-500' : 'bg-red-500'
                  }`}></div>
                  <span className="hidden sm:inline">{wsConnected ? 'Connected' : 'Connecting...'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Chat Container - Flexible height with proper backgrounds */}
        <div className="flex-1 flex overflow-hidden">
          {/* Chat Area - Primary focus with proper contrast */}
          <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-slate-800">
            {/* Chat Header with clear separation */}
            <div className="flex-shrink-0 flex items-center justify-between p-4 border-b border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex items-center justify-center">
                  <MessageCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Live Discussion</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {messages.length} {messages.length === 1 ? 'message' : 'messages'}
                  </p>
                </div>
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                session.is_ongoing
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                  : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
              }`}>
                {session.is_ongoing ? 'Active' : 'Scheduled'}
              </div>
            </div>

            {/* Messages Area - Perfect contrast and visibility */}
            <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-slate-900 relative">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-8">
                  <div className="w-16 h-16 bg-gray-200 dark:bg-slate-700 rounded-full flex items-center justify-center mb-4">
                    <MessageCircle className="h-8 w-8 text-gray-500 dark:text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    No messages yet
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 max-w-sm">
                    {session.user_has_joined 
                      ? "Be the first to share your thoughts and start the debate!"
                      : "Join the session to participate in the discussion"
                    }
                  </p>
                </div>
              ) : (
                <div className="p-6 space-y-6">
                  {messages.filter(message => message && message.user).map((message, index) => {
                    const isCurrentUser = message.user.id === user?.id;
                    const isModerator = message.user.role === 'MODERATOR';
                    const showAvatar = index === 0 || messages[index - 1]?.user?.id !== message.user.id;
                    const showTimestamp = index === 0 || 
                      messages[index - 1]?.user?.id !== message.user.id ||
                      new Date(message.timestamp).getTime() - new Date(messages[index - 1]?.timestamp || '').getTime() > 300000;
                    
                    return (
                      <div key={message.id} className={`flex gap-4 ${isCurrentUser ? 'flex-row-reverse' : ''}`}>
                        {/* Avatar with proper contrast */}
                        <div className="flex-shrink-0">
                          {showAvatar ? (
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold shadow-sm ${
                              isModerator 
                                ? 'bg-amber-100 text-amber-900 ring-2 ring-amber-300 dark:bg-amber-800 dark:text-amber-100 dark:ring-amber-600' 
                                : isCurrentUser
                                ? 'bg-blue-500 text-white dark:bg-blue-600'
                                : 'bg-gray-300 text-gray-800 dark:bg-slate-600 dark:text-gray-200'
                            }`}>
                              {getInitials(message.user.username)}
                            </div>
                          ) : (
                            <div className="w-12"></div>
                          )}
                        </div>

                        {/* Message Content with excellent contrast */}
                        <div className={`flex-1 min-w-0 max-w-2xl ${isCurrentUser ? 'text-right' : ''}`}>
                          {/* User info and timestamp */}
                          {showAvatar && (
                            <div className={`flex items-center gap-2 mb-2 ${isCurrentUser ? 'flex-row-reverse' : ''}`}>
                              <span className="font-bold text-gray-900 dark:text-white text-sm">
                                {isCurrentUser ? 'You' : message.user.username}
                              </span>
                              {isModerator && (
                                <span className="px-2 py-1 bg-amber-100 text-amber-900 dark:bg-amber-800 dark:text-amber-100 text-xs font-bold rounded-full border border-amber-300 dark:border-amber-600">
                                  MODERATOR
                                </span>
                              )}
                              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                                {safeFormatTime(message.timestamp)}
                              </span>
                            </div>
                          )}

                          {/* Message bubble with perfect visibility */}
                          <div className={`inline-block px-4 py-3 rounded-2xl max-w-full break-words shadow-md ${
                            isCurrentUser
                              ? 'bg-blue-600 text-white dark:bg-blue-500 dark:text-white'
                              : isModerator
                              ? 'bg-amber-50 text-amber-900 border-2 border-amber-200 dark:bg-amber-900/30 dark:text-amber-100 dark:border-amber-600/50'
                              : 'bg-white text-gray-900 border-2 border-gray-200 dark:bg-slate-700 dark:text-gray-100 dark:border-slate-500'
                          } ${showAvatar ? '' : 'mt-2'}`}>
                            <p className="text-sm leading-relaxed whitespace-pre-wrap font-medium">
                              {message.content}
                            </p>
                          </div>

                          {/* Timestamp for non-avatar messages */}
                          {!showAvatar && showTimestamp && (
                            <div className={`text-xs text-gray-500 dark:text-gray-400 mt-1 font-medium ${isCurrentUser ? 'mr-4' : 'ml-4'}`}>
                              {safeFormatTime(message.timestamp)}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Message Input - Clean and accessible */}
            {session.user_has_joined ? (
              <div className="flex-shrink-0 border-t border-gray-200 dark:border-slate-600 p-4 bg-white dark:bg-slate-800">
                <div className="flex gap-4">
                  {/* Current user avatar */}
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-blue-500 text-white dark:bg-blue-600 rounded-full flex items-center justify-center text-sm font-bold shadow-sm">
                      {getInitials(user?.username || '')}
                    </div>
                  </div>
                  
                  {/* Input area with perfect contrast */}
                  <div className="flex-1 relative">
                    <textarea
                      ref={inputRef}
                      value={newMessage}
                      onChange={handleInputChange}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          sendMessage();
                        }
                      }}
                      placeholder={wsConnected ? "Share your thoughts..." : "Connecting to chat..."}
                      disabled={!wsConnected || sending}
                      className="w-full px-4 py-3 pr-12 border-2 border-gray-300 dark:border-slate-600 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 shadow-sm font-medium"
                      style={{ minHeight: '44px', maxHeight: '120px' }}
                      rows={1}
                    />
                    
                    {/* Send button */}
                    <button
                      onClick={sendMessage}
                      disabled={!wsConnected || !newMessage.trim() || sending}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 w-8 h-8 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-full flex items-center justify-center transition-all duration-200 shadow-md"
                    >
                      {sending ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
                
                {/* Helper text with good contrast */}
                <div className="mt-2 text-xs text-gray-600 dark:text-gray-400 ml-14 font-medium">
                  Press Enter to send, Shift+Enter for new line
                </div>
              </div>
            ) : (
              <div className="flex-shrink-0 border-t border-gray-200 dark:border-slate-600 p-6 bg-gray-50 dark:bg-slate-700 text-center">
                <p className="text-gray-700 dark:text-gray-300 mb-4 font-medium">
                  You need to join this session to participate in the discussion
                </p>
                <button
                  onClick={async () => {
                    try {
                      await apiService.joinSession(parseInt(sessionId!));
                      window.location.reload();
                    } catch (error) {
                      console.error('Failed to join session:', error);
                      alert('Failed to join session. Please try again.');
                    }
                  }}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  Join Session
                </button>
              </div>
            )}
          </div>

          {/* Sidebar - Hidden on mobile, clean on desktop */}
          <div className="hidden lg:block w-80 flex-shrink-0 border-l border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800">
            <div className="p-6 space-y-6 h-full overflow-y-auto">
              {/* Session Status with clear contrast */}
              <Card className="bg-gray-50 dark:bg-slate-700 border-gray-200 dark:border-slate-600 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-gray-900 dark:text-white font-bold">Session Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold ${
                    session.is_ongoing 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' 
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                  }`}>
                    <div className={`w-2 h-2 rounded-full ${
                      session.is_ongoing ? 'bg-green-500' : 'bg-gray-500'
                    }`}></div>
                    {session.is_ongoing ? 'Live Discussion' : 'Scheduled'}
                  </div>
                </CardContent>
              </Card>

              {/* Session Info with better contrast */}
              <Card className="bg-gray-50 dark:bg-slate-700 border-gray-200 dark:border-slate-600 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-gray-900 dark:text-white font-bold">Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">Moderator</span>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-amber-100 text-amber-900 dark:bg-amber-800 dark:text-amber-100 rounded-full flex items-center justify-center text-xs font-bold">
                        {getInitials(session.created_by.username)}
                      </div>
                      <span className="text-sm font-bold text-gray-900 dark:text-white">
                        {session.created_by.username}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">Duration</span>
                    <span className="text-sm font-bold text-gray-900 dark:text-white">
                      {session.duration_minutes} minutes
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">Participants</span>
                    <span className="text-sm font-bold text-gray-900 dark:text-white">
                      {session.participants_count} / {session.max_participants}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">Your Status</span>
                    <span className={`text-sm font-bold ${
                      session.user_has_joined 
                        ? 'text-green-600 dark:text-green-400' 
                        : 'text-gray-600 dark:text-gray-400'
                    }`}>
                      {session.user_has_joined ? 'Joined' : 'Not Joined'}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Guidelines with perfect readability */}
              <Card className="bg-gray-50 dark:bg-slate-700 border-gray-200 dark:border-slate-600 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-gray-900 dark:text-white font-bold">Guidelines</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
                    <li className="flex items-start gap-3">
                      <span className="text-blue-600 dark:text-blue-400 mt-1 text-base">•</span>
                      <span className="font-medium">Be respectful and constructive</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-blue-600 dark:text-blue-400 mt-1 text-base">•</span>
                      <span className="font-medium">Support arguments with evidence</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-blue-600 dark:text-blue-400 mt-1 text-base">•</span>
                      <span className="font-medium">Stay focused on the topic</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-blue-600 dark:text-blue-400 mt-1 text-base">•</span>
                      <span className="font-medium">Listen to other perspectives</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
