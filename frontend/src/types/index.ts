// User types
export interface User {
  id: number;
  username: string;
  email: string;
  role: 'STUDENT' | 'MODERATOR';
  first_name?: string;
  last_name?: string;
  is_active: boolean;
  date_joined: string;
  notifications_enabled?: boolean; // Read-only, always true
  rating: number;
  bio?: string;
  followers_count: number;
  following_count: number;
  is_following?: boolean; // Only present in public profiles
}

export interface UserStats {
  total_debates: number;
  debates_won: number;
  debates_lost: number;
  debates_drawn: number;
  total_messages: number;
  avg_message_length: number;
  likes_received: number;
  likes_given: number;
  highest_rating: number;
  lowest_rating: number;
  last_active: string;
  win_rate: number;
  loss_rate: number;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  password_confirm: string;
  role?: 'STUDENT' | 'MODERATOR';
}

// Debate types
export interface DebateTopic {
  id: number;
  title: string;
  description: string;
  created_by: User;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface DebateSession {
  id: number;
  topic: DebateTopic;
  start_time: string;
  end_time: string;
  created_by: User;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  max_participants: number;
  is_ongoing?: boolean;
  has_started?: boolean;
  has_ended?: boolean;
  status?: 'scheduled' | 'ongoing' | 'ended';
  participants_count?: number;
  user_has_joined?: boolean;
  duration_minutes?: number;
}

export interface Participant {
  id: number;
  user: User;
  session: DebateSession;
  joined_at: string;
  is_active: boolean;
  is_deleted: boolean;
}

export interface Message {
  id: number;
  session: number; // session ID
  sender: User;
  content: string;
  timestamp: string;
  is_deleted: boolean;
}

// WebSocket message types
export interface WebSocketMessage {
  type: 'message' | 'user_joined' | 'user_left' | 'session_started' | 'session_ended';
  data: any;
  timestamp: string;
  session_id: number;
}

export interface ChatMessage {
  id?: number;
  content: string;
  sender: User;
  timestamp: string;
  session_id: number;
}

// API Response types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  status: 'success' | 'error';
  results: T[];
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface DashboardStats {
  debates_participated: number;
  debates_won: number;
  current_rating: number;
  debates_this_week: number;
}

// Notification types
export interface Notification {
  id: number;
  title: string;
  message: string;
  notification_type: 'debate_message' | 'debate_invite' | 'debate_result' | 'achievement' | 'system' | 'moderation';
  is_read: boolean;
  action_url?: string;
  timestamp: string;
  time_ago: string;
}

// Form types
export interface CreateTopicForm {
  title: string;
  description: string;
}

export interface CreateSessionForm {
  topic_id: number;
  start_time: string;
  end_time: string;
  max_participants: number;
}

// UI State types
export interface LoadingState {
  isLoading: boolean;
  error: string | null;
}

export interface DialogState {
  isOpen: boolean;
  title?: string;
  content?: string;
}

// Navigation types
export interface NavItem {
  label: string;
  href: string;
  icon?: string;
  roles?: ('STUDENT' | 'MODERATOR')[];
}

// Filter and sort types
export interface DebateFilters {
  is_active?: boolean;
  created_by?: number;
  search?: string;
  ordering?: string;
}

export interface SessionFilters {
  topic?: number;
  is_active?: boolean;
  is_ongoing?: boolean;
  ordering?: string;
}
