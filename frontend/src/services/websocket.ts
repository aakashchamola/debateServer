import type { ChatMessage, User } from '@/types';

export interface WebSocketEvents {
  message: (data: ChatMessage) => void;
  user_joined: (data: { user: User; session_id: number }) => void;
  user_left: (data: { user: User; session_id: number }) => void;
  session_started: (data: { session_id: number }) => void;
  session_ended: (data: { session_id: number }) => void;
  connect: () => void;
  disconnect: () => void;
  error: (error: Error) => void;
}

type EventCallback = (...args: any[]) => void;

class WebSocketService {
  private ws: WebSocket | null = null;
  private readonly baseUrl: string;
  private eventListeners: Map<string, Set<EventCallback>> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  constructor() {
    this.baseUrl = import.meta.env.VITE_WS_BASE_URL || 'ws://localhost:8001';
  }

  /**
   * Connect to WebSocket server
   */
  connect(sessionId?: number, token?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        let wsUrl = `${this.baseUrl}/ws/debates/`;
        if (sessionId) {
          wsUrl += `${sessionId}/`;
        }
        if (token) {
          wsUrl += `?token=${token}`;
        }

        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          console.log('WebSocket connected');
          this.reconnectAttempts = 0;
          this.emit('connect');
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.handleMessage(data);
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        this.ws.onclose = (event) => {
          console.log('WebSocket disconnected:', event.code, event.reason);
          this.emit('disconnect');
          
          // Auto-reconnect if not closed intentionally
          if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.attemptReconnect(sessionId, token);
          }
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.emit('error', new Error('WebSocket connection error'));
          reject(error);
        };

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close(1000, 'Intentional disconnect');
      this.ws = null;
    }
    this.eventListeners.clear();
  }

  /**
   * Send a message through WebSocket
   */
  send(data: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    } else {
      console.warn('WebSocket is not connected');
    }
  }

  /**
   * Send a chat message
   */
  sendMessage(sessionId: number, content: string): void {
    this.send({
      type: 'send_message',
      data: {
        session_id: sessionId,
        content,
      },
    });
  }

  /**
   * Join a debate session
   */
  joinSession(sessionId: number): void {
    this.send({
      type: 'join_session',
      data: { session_id: sessionId },
    });
  }

  /**
   * Leave a debate session
   */
  leaveSession(sessionId: number): void {
    this.send({
      type: 'leave_session',
      data: { session_id: sessionId },
    });
  }

  /**
   * Subscribe to events
   */
  on(event: string, callback: EventCallback): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(callback);
  }

  /**
   * Unsubscribe from events
   */
  off(event: string, callback?: EventCallback): void {
    if (callback) {
      this.eventListeners.get(event)?.delete(callback);
    } else {
      this.eventListeners.delete(event);
    }
  }

  /**
   * Emit an event
   */
  private emit(event: string, ...args: any[]): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(...args);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Handle incoming WebSocket message
   */
  private handleMessage(data: any): void {
    const { type, ...payload } = data;
    
    switch (type) {
      case 'message':
        this.emit('message', payload);
        break;
      case 'user_joined':
        this.emit('user_joined', payload);
        break;
      case 'user_left':
        this.emit('user_left', payload);
        break;
      case 'session_started':
        this.emit('session_started', payload);
        break;
      case 'session_ended':
        this.emit('session_ended', payload);
        break;
      default:
        console.warn('Unknown message type:', type);
    }
  }

  /**
   * Attempt to reconnect
   */
  private attemptReconnect(sessionId?: number, token?: string): void {
    this.reconnectAttempts++;
    console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
    
    setTimeout(() => {
      this.connect(sessionId, token).catch(() => {
        // Reconnection failed, will try again if attempts remaining
      });
    }, this.reconnectDelay * this.reconnectAttempts);
  }

  /**
   * Check if WebSocket is connected
   */
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

// Create singleton instance
export const webSocketService = new WebSocketService();
export default webSocketService;
