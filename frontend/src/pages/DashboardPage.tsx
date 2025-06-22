import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Layout } from '@/components/layout';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui';
import { Button } from '@/components/ui';
import { Input } from '@/components/ui';
import { Label } from '@/components/ui';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui';
import { apiService } from '@/services/api';
import { cn } from '@/utils';
import {
  Plus,
  ArrowRight,
  MessageSquare,
  Trophy,
  Star,
  Calendar,
  Clock,
  Users as UsersIcon,
  FileText,
  Shield,
} from 'lucide-react';
import type { DebateSession, DebateTopic, CreateSessionForm, DashboardStats } from '@/types';

export function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [debateSessions, setDebateSessions] = useState<DebateSession[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [newTopic, setNewTopic] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [userCount, setUserCount] = useState(0);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Use different endpoints based on user role
      const [sessionsResponse, statsResponse] = await Promise.all([
        user?.role === 'MODERATOR' 
          ? apiService.getSessions() // Moderators see all sessions
          : apiService.mySessions(), // Students see only their sessions
        apiService.myStats(), // Use real stats endpoint
      ]);

      if (sessionsResponse.data) {
        setDebateSessions(sessionsResponse.data.results);
      }
      setStats(statsResponse.data);

      if (user?.role === 'MODERATOR') {
        const usersResponse = await apiService.getUsers();
        setUserCount(usersResponse.data.count);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDebate = async () => {
    if (!newTopic.trim()) {
      // Add some validation feedback
      return;
    }
    try {
      const topicResponse = await apiService.createTopic({
        title: newTopic,
        description: newDescription,
      });
      const newDebateTopic: DebateTopic = topicResponse.data;

      const sessionData: CreateSessionForm = {
        topic_id: newDebateTopic.id,
        start_time: new Date().toISOString(),
        end_time: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        max_participants: 2,
      };

      const sessionResponse = await apiService.createSession(sessionData);
      const newSession: DebateSession = sessionResponse.data;

      navigate(`/debate/${newSession.id}`);
    } catch (error) {
      console.error('Error creating debate:', error);
      // Add user-friendly error handling
    }
  };

  const winRate = stats
    ? stats.debates_participated > 0
      ? Math.round((stats.debates_won / stats.debates_participated) * 100)
      : 0
    : 0;

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
            <p className="text-muted-foreground">Loading your dashboard...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex flex-col gap-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">
              Welcome back, {user?.username}!
            </h1>
            <p className="text-muted-foreground">
              {user?.role === 'MODERATOR'
                ? "Here's the platform's activity overview."
                : "Here's your debate activity overview."}
            </p>
          </div>
          {user?.role === 'MODERATOR' && (
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create New Debate
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Create New Debate</DialogTitle>
                  <DialogDescription>
                    Start a new debate by providing a topic and an optional
                    description.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="topic" className="text-right">
                      Topic
                    </Label>
                    <Input
                      id="topic"
                      value={newTopic}
                      onChange={(e) => setNewTopic(e.target.value)}
                      className="col-span-3"
                      placeholder="e.g., Is universal basic income a viable solution?"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="description" className="text-right">
                      Description
                    </Label>
                    <Input
                      id="description"
                      value={newDescription}
                      onChange={(e) => setNewDescription(e.target.value)}
                      className="col-span-3"
                      placeholder="(Optional) A brief description of the topic."
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" onClick={handleCreateDebate}>
                    Create and Start Debate
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {user?.role === 'MODERATOR' ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Active Sessions
                </CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {debateSessions.filter((s) => s.is_ongoing).length}
                </div>
                <p className="text-xs text-muted-foreground">
                  of {debateSessions.length} total sessions
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <UsersIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{userCount}</div>
                <p className="text-xs text-muted-foreground">
                  Students and Moderators
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Topics to Review
                </CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">5</div>
                <p className="text-xs text-muted-foreground">Pending approval</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Your Role</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Moderator</div>
                <p className="text-xs text-muted-foreground">
                  Platform administrator
                </p>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Debates
                </CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats?.debates_participated ?? 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats?.debates_this_week ?? 0} this week
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
                <Trophy className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{winRate}%</div>
                <p className="text-xs text-muted-foreground">
                  Based on {stats?.debates_participated ?? 0} debates
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Current Rating
                </CardTitle>
                <Star className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats?.current_rating ?? 1200}
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats?.current_rating ? 'Your skill level' : 'Starting rating'}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Your Sessions
                </CardTitle>
                <UsersIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {debateSessions.length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Sessions you've joined
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            {user?.role === 'MODERATOR' ? 'All Debate Sessions' : 'Your Debate Sessions'}
          </h2>
          <p className="text-muted-foreground">
            {user?.role === 'MODERATOR' 
              ? 'Manage all debate sessions on the platform.'
              : 'Your participated debate sessions and available sessions to join.'
            }
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {debateSessions.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
              <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {user?.role === 'MODERATOR' ? 'No sessions created yet' : 'No sessions joined yet'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {user?.role === 'MODERATOR' 
                  ? 'Create your first debate session to get started.'
                  : 'Browse available sessions to join your first debate.'
                }
              </p>
              {user?.role !== 'MODERATOR' && (
                <Button asChild>
                  <Link to="/sessions">
                    Browse Sessions
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              )}
            </div>
          ) : (
            debateSessions.map((session) => (
              <Card key={session.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex-1">{session.topic.title}</CardTitle>
                    <Badge 
                      variant={
                        session.status === 'ongoing' 
                          ? 'default' 
                          : session.status === 'ended' 
                            ? 'secondary' 
                            : 'outline'
                      }
                      className={cn(
                        session.status === 'ongoing' && 'bg-green-500 hover:bg-green-600',
                        session.status === 'ended' && 'bg-gray-500',
                        session.status === 'scheduled' && 'bg-blue-500'
                      )}
                    >
                      {session.status === 'ongoing' 
                        ? 'Live' 
                        : session.status === 'ended' 
                          ? 'Ended' 
                          : 'Scheduled'
                      }
                    </Badge>
                  </div>
                  <CardDescription>
                    Hosted by {session.created_by.username}
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date(session.start_time).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>
                      {session.status === 'ended' 
                        ? 'Session Ended'
                        : session.status === 'ongoing' 
                          ? 'Live Now' 
                          : `Starts ${new Date(session.start_time).toLocaleTimeString()}`
                      }
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <UsersIcon className="h-4 w-4" />
                    <span>
                      {session.participants_count ?? 0} / {session.max_participants}{' '}
                      participants
                    </span>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    asChild 
                    className={cn(
                      "w-full",
                      session.status === 'scheduled' && "opacity-50 pointer-events-none",
                      session.status === 'ended' && "opacity-40"
                    )}
                    disabled={session.status === 'scheduled' || session.status === 'ended'}
                  >
                    <Link to={`/debate/${session.id}`}>
                      {session.status === 'ended' 
                        ? 'View Results'
                        : session.user_has_joined 
                          ? 'Enter Debate Chat' 
                          : 'Join & Enter Chat'
                      }
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            ))
          )}
        </div>
      </div>
    </Layout>
  );
}
