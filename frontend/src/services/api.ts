import axios from 'axios';
import type { AxiosInstance, AxiosResponse } from 'axios';
import { getEnvVar } from '@/utils';

// Types
import type {
  User,
  AuthTokens,
  LoginRequest,
  RegisterRequest,
  DebateTopic,
  DebateSession,
  Message,
  PaginatedResponse,
  CreateTopicForm,
  CreateSessionForm,
  UserStats,
} from '@/types';

class ApiService {
  private api: AxiosInstance;
  private baseURL: string;

  constructor() {
    this.baseURL = getEnvVar('VITE_API_BASE_URL', 'http://localhost:8000');
    
    this.api = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      (config) => {
        // Don't add auth header to login/register/refresh endpoints
        const authExcludedPaths = ['/api/users/login/', '/api/users/register/', '/api/users/token/refresh/'];
        const isAuthExcluded = authExcludedPaths.some(path => config.url?.includes(path));
        
        if (!isAuthExcluded) {
          const token = localStorage.getItem('accessToken');
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for token refresh
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const refreshToken = localStorage.getItem('refreshToken');
            if (refreshToken) {
              const response = await this.refreshToken(refreshToken);
              localStorage.setItem('accessToken', response.data.access);
              
              // Retry original request with new token
              originalRequest.headers.Authorization = `Bearer ${response.data.access}`;
              return this.api(originalRequest);
            }
          } catch (refreshError) {
            // Refresh failed, redirect to login
            this.clearTokens();
            window.location.href = '/login';
          }
        }

        return Promise.reject(error);
      }
    );
  }

  // Auth methods
  async login(credentials: LoginRequest): Promise<AxiosResponse<AuthTokens>> {
    return this.api.post('/api/users/login/', credentials);
  }

  async register(userData: RegisterRequest): Promise<AxiosResponse<User>> {
    return this.api.post('/api/users/register/', userData);
  }

  async refreshToken(refresh: string): Promise<AxiosResponse<{ access: string }>> {
    return this.api.post('/api/users/token/refresh/', { refresh });
  }

  async logout(): Promise<AxiosResponse<any>> {
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      await this.api.post('/api/users/logout/', { refresh: refreshToken });
    }
    this.clearTokens();
    return Promise.resolve({ data: null } as AxiosResponse<any>);
  }

  async getCurrentUser(): Promise<AxiosResponse<User>> {
    return this.api.get('/api/users/profile/');
  }

  // User methods
  async getUsers(): Promise<AxiosResponse<PaginatedResponse<User>>> {
    return this.api.get('/api/users/');
  }

  async getUser(id: number): Promise<AxiosResponse<User>> {
    return this.api.get(`/api/users/${id}/`);
  }

  async searchUsers(query?: string, ordering?: string): Promise<AxiosResponse<PaginatedResponse<User>>> {
    const params = new URLSearchParams();
    if (query) params.append('search', query);
    if (ordering) params.append('ordering', ordering);
    return this.api.get(`/api/users/?${params.toString()}`);
  }

  async followUser(userId: number): Promise<AxiosResponse<{ message: string; user: User }>> {
    return this.api.post(`/api/users/${userId}/follow/`);
  }

  async unfollowUser(userId: number): Promise<AxiosResponse<{ message: string; user: User }>> {
    return this.api.post(`/api/users/${userId}/unfollow/`);
  }

  async getUserFollowers(userId: number): Promise<AxiosResponse<{ count: number; results: User[] }>> {
    return this.api.get(`/api/users/${userId}/followers/`);
  }

  async getUserFollowing(userId: number): Promise<AxiosResponse<{ count: number; results: User[] }>> {
    return this.api.get(`/api/users/${userId}/following/`);
  }

  async getMyFollowing(): Promise<AxiosResponse<{ count: number; results: User[] }>> {
    return this.api.get('/api/users/my_following/');
  }

  async getLeaderboard(): Promise<AxiosResponse<{ count: number; results: User[] }>> {
    return this.api.get('/api/users/leaderboard/');
  }

  async getUserStats(userId: number): Promise<AxiosResponse<UserStats>> {
    return this.api.get(`/api/users/${userId}/stats/`);
  }

  // Debate Topic methods
  async getTopics(): Promise<AxiosResponse<PaginatedResponse<DebateTopic>>> {
    return this.api.get('/api/debates/topics/');
  }

  async getTopic(id: number): Promise<AxiosResponse<DebateTopic>> {
    return this.api.get(`/api/debates/topics/${id}/`);
  }

  async createTopic(data: CreateTopicForm): Promise<AxiosResponse<DebateTopic>> {
    return this.api.post('/api/debates/topics/', data);
  }

  async updateTopic(id: number, data: Partial<CreateTopicForm>): Promise<AxiosResponse<DebateTopic>> {
    return this.api.patch(`/api/debates/topics/${id}/`, data);
  }

  async deleteTopic(id: number): Promise<AxiosResponse<any>> {
    return this.api.delete(`/api/debates/topics/${id}/`);
  }

  // Debate Session methods
  async getSessions(): Promise<AxiosResponse<PaginatedResponse<DebateSession>>> {
    return this.api.get('/api/debates/sessions/');
  }

  async getSession(id: number): Promise<AxiosResponse<DebateSession>> {
    return this.api.get(`/api/debates/sessions/${id}/`);
  }

  async createSession(data: CreateSessionForm): Promise<AxiosResponse<DebateSession>> {
    return this.api.post('/api/debates/sessions/', data);
  }

  async updateSession(id: number, data: Partial<CreateSessionForm>): Promise<AxiosResponse<DebateSession>> {
    return this.api.patch(`/api/debates/sessions/${id}/`, data);
  }

  async deleteSession(id: number): Promise<AxiosResponse<any>> {
    return this.api.delete(`/api/debates/sessions/${id}/`);
  }

  async joinSession(sessionId: number): Promise<AxiosResponse<any>> {
    return this.api.post(`/api/debates/sessions/${sessionId}/join/`);
  }

  async leaveSession(sessionId: number): Promise<AxiosResponse<any>> {
    return this.api.post(`/api/debates/sessions/${sessionId}/leave/`);
  }

  async enterChat(sessionId: number): Promise<AxiosResponse<any>> {
    return this.api.post(`/api/debates/sessions/${sessionId}/enter_chat/`);
  }

  async getSessionMessages(sessionId: number): Promise<AxiosResponse<PaginatedResponse<Message>>> {
    return this.api.get(`/api/debates/sessions/${sessionId}/messages/`);
  }

  // New dashboard endpoints
  async mySessions(): Promise<AxiosResponse<PaginatedResponse<DebateSession>>> {
    return this.api.get('/api/debates/sessions/my_sessions/');
  }

  async myStats(): Promise<AxiosResponse<any>> {
    return this.api.get('/api/debates/sessions/my_stats/');
  }

  // Notification methods
  async getNotifications(): Promise<AxiosResponse<PaginatedResponse<Notification>>> {
    return this.api.get('/api/notifications/');
  }

  async markNotificationRead(notificationId: number): Promise<AxiosResponse<any>> {
    return this.api.post(`/api/notifications/${notificationId}/mark_read/`);
  }

  async markAllNotificationsRead(): Promise<AxiosResponse<any>> {
    return this.api.post('/api/notifications/mark_all_read/');
  }

  async getUnreadNotificationCount(): Promise<AxiosResponse<{ unread_count: number }>> {
    return this.api.get('/api/notifications/unread_count/');
  }

  // User Profile methods
  async updateProfile(data: Partial<any>): Promise<AxiosResponse<any>> {
    return this.api.patch('/api/users/profile/', data);
  }

  async changePassword(data: { current_password: string; new_password: string }): Promise<AxiosResponse<any>> {
    return this.api.post('/api/users/change-password/', data);
  }

  // Message methods
  async getMessages(sessionId: number): Promise<AxiosResponse<PaginatedResponse<Message>>> {
    return this.api.get(`/api/debates/messages/?session=${sessionId}`);
  }

  async sendMessage(sessionId: number, content: string): Promise<AxiosResponse<Message>> {
    return this.api.post(`/api/debates/messages/`, { content, session: sessionId });
  }

  async deleteMessage(messageId: number): Promise<AxiosResponse<any>> {
    return this.api.delete(`/api/debates/messages/${messageId}/`);
  }

  // Utility methods
  private clearTokens(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }

  setTokens(tokens: AuthTokens): void {
    localStorage.setItem('accessToken', tokens.access);
    localStorage.setItem('refreshToken', tokens.refresh);
  }

  getAccessToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }

  async checkUsernameAvailability(username: string): Promise<boolean> {
    const res = await this.api.get(`/api/users/check-username/?username=${encodeURIComponent(username)}`);
    return res.data.available;
  }

  async checkEmailAvailability(email: string): Promise<boolean> {
    const res = await this.api.get(`/api/users/check-email/?email=${encodeURIComponent(email)}`);
    return res.data.available;
  }

  async getNotificationSettings(): Promise<AxiosResponse<{ notifications_enabled: boolean }>> {
    return this.api.get('/api/users/profile/');
  }

  async updateNotificationSettings(data: { notifications_enabled: boolean }): Promise<AxiosResponse<any>> {
    return this.api.patch('/api/users/profile/', data);
  }

  async uploadProfilePicture(file: File): Promise<AxiosResponse<User>> {
    const formData = new FormData();
    formData.append('profile_picture', file);
    return this.api.patch('/api/users/profile/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  // Moderator-specific session control methods
  async startSessionNow(sessionId: number): Promise<AxiosResponse<any>> {
    return this.api.post(`/api/debates/sessions/${sessionId}/start_now/`);
  }

  async rescheduleSession(sessionId: number, newStartTime: string): Promise<AxiosResponse<any>> {
    return this.api.post(`/api/debates/sessions/${sessionId}/reschedule/`, {
      start_time: newStartTime
    });
  }

  async moderateParticipant(sessionId: number, participantId: number, action: 'mute' | 'warn' | 'remove'): Promise<AxiosResponse<any>> {
    return this.api.post(`/api/debates/sessions/${sessionId}/moderate_participant/`, {
      participant_id: participantId,
      action: action
    });
  }
}

// Create singleton instance
export const apiService = new ApiService();
export default apiService;
