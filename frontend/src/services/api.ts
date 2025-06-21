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
        const token = localStorage.getItem('accessToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
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
}

// Create singleton instance
export const apiService = new ApiService();
export default apiService;
