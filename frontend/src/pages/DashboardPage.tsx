import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout';
import { Card, CardContent } from '@/components/ui';
import { Button } from '@/components/ui';
import { apiService } from '@/services/api';
import { 
  Calendar, 
  MessageCircle, 
  Users, 
  Plus,
  Clock,
  Crown,
  Star,
  Activity,
  Target,
  Zap,
  Award,
  Trophy
} from 'lucide-react';

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
  end_time: string;
  duration_minutes: number;
  max_participants: number;
  participants_count: number;
  created_by: User;
  is_ongoing: boolean;
  user_has_joined: boolean;
  created_at: string;
}

interface DashboardStats {
  debates_participated: number;
  debates_won: number;
  current_rating: number;
  debates_this_week: number;
}

// Utility functions
const safeFormatDateTime = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid date';
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
};

const safeGetTimeAgo = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'recently';
    
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMinutes < 1) return 'just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return safeFormatDateTime(dateString);
  } catch (error) {
    console.error('Error calculating time ago:', error);
    return 'recently';
  }
};

export function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [debateSessions, setDebateSessions] = useState<DebateSession[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleJoinSession = async (sessionId: number) => {
    try {
      console.log('Attempting to join session:', sessionId);
      await apiService.joinSession(sessionId);
      console.log('Successfully joined session, navigating to chat...');
      // Successfully joined, navigate to chat
      navigate(`/debate/${sessionId}`);
      // Refresh the sessions to update participant count
      await fetchDashboardData();
    } catch (error) {
      console.error('Error joining session:', error);
      alert(`Failed to join session: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleContinueSession = (sessionId: number) => {
    console.log('Navigating to existing session:', sessionId);
    navigate(`/debate/${sessionId}`);
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const sessionsResponse = await apiService.getSessions();

      if (sessionsResponse.data) {
        setDebateSessions(sessionsResponse.data.results as any);
      }
      
      // Mock stats for now since the endpoint doesn't exist yet
      setStats({
        debates_participated: 5,
        debates_won: 3,
        current_rating: 1450,
        debates_this_week: 2
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getWinRate = () => {
    if (!stats || stats.debates_participated === 0) return 0;
    return Math.round((stats.debates_won / stats.debates_participated) * 100);
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 1800) return 'text-accent-500';
    if (rating >= 1500) return 'text-primary-500';
    if (rating >= 1200) return 'text-success-500';
    return 'text-secondary';
  };

  const getRatingLevel = (rating: number) => {
    if (rating >= 1800) return 'Expert';
    if (rating >= 1500) return 'Advanced';
    if (rating >= 1200) return 'Intermediate';
    return 'Beginner';
  };

  if (loading) {
    return (
      <Layout>
        <div className="dashboard">
          <div className="loading-container">
            <div className="loading-spinner large"></div>
            <p className="text-secondary-muted">Loading your dashboard...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="dashboard">
        {/* Welcome Header */}
        <div className="dashboard-header">
          <div className="welcome-section">
            <h1 className="dashboard-title">
              Welcome back, {user?.username}!
            </h1>
            <p className="dashboard-subtitle">
              Ready to engage in some thought-provoking debates?
            </p>
          </div>
          <div className="dashboard-actions">
            <Button 
              variant="primary" 
              size="lg"
              onClick={() => navigate('/debates/new')}
            >
              <Plus className="h-4 w-4 mr-2" />
              Start New Debate
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        {stats && (
          <div className="stats-grid">
            <Card className="stat-card primary">
              <CardContent>
                <div className="stat-content">
                  <div className="stat-icon">
                    <MessageCircle className="h-6 w-6" />
                  </div>
                  <div className="stat-info">
                    <div className="stat-value">{stats.debates_participated}</div>
                    <div className="stat-label">Total Debates</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="stat-card success">
              <CardContent>
                <div className="stat-content">
                  <div className="stat-icon">
                    <Trophy className="h-6 w-6" />
                  </div>
                  <div className="stat-info">
                    <div className="stat-value">{getWinRate()}%</div>
                    <div className="stat-label">Win Rate</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="stat-card accent">
              <CardContent>
                <div className="stat-content">
                  <div className="stat-icon">
                    <Star className="h-6 w-6" />
                  </div>
                  <div className="stat-info">
                    <div className={`stat-value ${getRatingColor(stats.current_rating)}`}>
                      {stats.current_rating}
                    </div>
                    <div className="stat-label">{getRatingLevel(stats.current_rating)}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="stat-card warning">
              <CardContent>
                <div className="stat-content">
                  <div className="stat-icon">
                    <Activity className="h-6 w-6" />
                  </div>
                  <div className="stat-info">
                    <div className="stat-value">{stats.debates_this_week}</div>
                    <div className="stat-label">This Week</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Content Grid */}
        <div className="dashboard-content">
          {/* Active Debates */}
          <div className="dashboard-section">
            <div className="section-header">
              <h2 className="section-title">Active Debates</h2>
              <Button variant="ghost" size="sm">
                View All
              </Button>
            </div>

            <div className="debates-grid">
              {debateSessions.length > 0 ? (
                debateSessions.slice(0, 6).map((session) => (
                  <Card key={session.id} className="debate-card">
                    <CardContent>
                      <div className="debate-header">
                        <div className="debate-status">
                          {session.is_ongoing ? (
                            <span className="status-badge live">
                              <Zap className="h-3 w-3" />
                              Live
                            </span>
                          ) : (
                            <span className="status-badge scheduled">
                              <Clock className="h-3 w-3" />
                              Scheduled
                            </span>
                          )}
                        </div>
                        <div className="debate-meta">
                          {safeGetTimeAgo(session.start_time)}
                        </div>
                      </div>

                      <h3 className="debate-title">{session.title}</h3>
                      <p className="debate-description">{session.description}</p>

                      <div className="debate-topic">
                        <Target className="h-4 w-4" />
                        <span>{session.topic.title}</span>
                      </div>

                      <div className="debate-footer">
                        <div className="participants-info">
                          <Users className="h-4 w-4" />
                          <span>{session.participants_count}/{session.max_participants}</span>
                        </div>

                        <div className="debate-actions">
                          {session.user_has_joined ? (
                            <Button 
                              variant="primary" 
                              size="sm"
                              onClick={() => handleContinueSession(session.id)}
                            >
                              Continue
                            </Button>
                          ) : (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleJoinSession(session.id)}
                              disabled={session.participants_count >= session.max_participants}
                            >
                              Join Debate
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="empty-state">
                  <MessageCircle className="h-12 w-12 text-secondary-muted" />
                  <h3 className="text-lg font-semibold text-secondary">No active debates</h3>
                  <p className="text-secondary-muted">Start a new debate or join an existing one to get started.</p>
                  <Button 
                    variant="primary" 
                    className="mt-4"
                    onClick={() => navigate('/debates/new')}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Debate
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <Card className="quick-actions-card">
            <CardContent>
              <h2 className="section-title mb-4">Quick Actions</h2>
              <div className="quick-actions-grid">
                <button 
                  className="quick-action"
                  onClick={() => navigate('/debates/browse')}
                >
                  <div className="quick-action-icon primary">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="quick-action-title">Browse Debates</div>
                    <div className="quick-action-desc">Find interesting topics</div>
                  </div>
                </button>

                <button 
                  className="quick-action"
                  onClick={() => navigate('/profile')}
                >
                  <div className="quick-action-icon success">
                    <Award className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="quick-action-title">View Progress</div>
                    <div className="quick-action-desc">Track your improvement</div>
                  </div>
                </button>

                <button 
                  className="quick-action"
                  onClick={() => navigate('/community')}
                >
                  <div className="quick-action-icon accent">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="quick-action-title">Community</div>
                    <div className="quick-action-desc">Connect with debaters</div>
                  </div>
                </button>

                {user?.role === 'MODERATOR' && (
                  <button 
                    className="quick-action"
                    onClick={() => navigate('/moderation')}
                  >
                    <div className="quick-action-icon warning">
                      <Crown className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="quick-action-title">Moderation</div>
                      <div className="quick-action-desc">Manage debates</div>
                    </div>
                  </button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
