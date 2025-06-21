import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Layout } from '@/components/layout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button } from '@/components/ui';
import { Calendar, MessageCircle, Users, Plus, Clock } from 'lucide-react';
import { apiService } from '@/services/api';
import { formatDateTime, getTimeAgo } from '@/utils';
import type { DebateTopic, DebateSession } from '@/types';

export function DashboardPage() {
  const { user } = useAuth();
  const [topics, setTopics] = useState<DebateTopic[]>([]);
  const [sessions, setSessions] = useState<DebateSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('Fetching dashboard data...');
        const [topicsResponse, sessionsResponse] = await Promise.all([
          apiService.getTopics(),
          apiService.getSessions(),
        ]);

        console.log('Topics response:', topicsResponse.data);
        console.log('Sessions response:', sessionsResponse.data);

        setTopics(topicsResponse.data.results || []);
        setSessions(sessionsResponse.data.results || []);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
        setError(`Failed to load data: ${error instanceof Error ? error.message : 'Unknown error'}`);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
          >
            Retry
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8">
        {/* Welcome Section */}
        <div>
          <h1 className="text-3xl font-bold text-secondary-900">
            Welcome back, {user?.username}!
          </h1>
          <p className="mt-2 text-secondary-600">
            Here's what's happening in your debate community.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="flex items-center p-6">
              <div className="flex items-center">
                <MessageCircle className="h-8 w-8 text-primary-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-secondary-600">Total Topics</p>
                  <p className="text-2xl font-bold text-secondary-900">{topics.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center p-6">
              <div className="flex items-center">
                <Calendar className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-secondary-600">Active Sessions</p>
                  <p className="text-2xl font-bold text-secondary-900">
                    {sessions.filter(s => s.is_ongoing).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-secondary-600">Your Role</p>
                  <p className="text-2xl font-bold text-secondary-900">
                    {user?.role === 'MODERATOR' ? 'Moderator' : 'Student'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Topics Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Recent Topics</CardTitle>
                  <CardDescription>Latest debate topics created</CardDescription>
                </div>
                {user?.role === 'MODERATOR' && (
                  <Link to="/topics/create">
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      New Topic
                    </Button>
                  </Link>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {topics.length > 0 ? (
                <div className="space-y-4">
                  {topics.slice(0, 3).map((topic) => (
                    <div key={topic.id} className="border-l-4 border-primary-500 pl-4">
                      <h3 className="font-medium text-secondary-900">{topic.title}</h3>
                      <p className="text-sm text-secondary-600 mt-1">
                        {topic.description.length > 100 
                          ? `${topic.description.substring(0, 100)}...`
                          : topic.description
                        }
                      </p>
                      <p className="text-xs text-secondary-500 mt-2">
                        Created {getTimeAgo(topic.created_at)} by {topic.created_by.username}
                      </p>
                    </div>
                  ))}
                  <div className="text-center">
                    <Link to="/topics">
                      <Button variant="outline" size="sm">
                        View All Topics
                      </Button>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <MessageCircle className="h-12 w-12 text-secondary-400 mx-auto mb-4" />
                  <p className="text-secondary-500">No topics yet</p>
                  {user?.role === 'MODERATOR' && (
                    <Link to="/topics/create" className="mt-2 inline-block">
                      <Button size="sm">Create First Topic</Button>
                    </Link>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Sessions Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Recent Sessions</CardTitle>
                  <CardDescription>Debate sessions you can join</CardDescription>
                </div>
                {user?.role === 'MODERATOR' && (
                  <Link to="/sessions/create">
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      New Session
                    </Button>
                  </Link>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {sessions.length > 0 ? (
                <div className="space-y-4">
                  {sessions.slice(0, 3).map((session) => (
                    <div key={session.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-secondary-900">
                            {session.topic.title}
                          </h3>
                          <div className="flex items-center text-sm text-secondary-600 mt-1">
                            <Clock className="h-4 w-4 mr-1" />
                            {formatDateTime(session.start_time)}
                          </div>
                          <p className="text-xs text-secondary-500 mt-1">
                            Max participants: {session.max_participants}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          {session.is_ongoing && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Live
                            </span>
                          )}
                          <Link to={`/sessions/${session.id}`}>
                            <Button size="sm">
                              {session.is_ongoing ? 'Join' : 'View'}
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="text-center">
                    <Link to="/sessions">
                      <Button variant="outline" size="sm">
                        View All Sessions
                      </Button>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-secondary-400 mx-auto mb-4" />
                  <p className="text-secondary-500">No sessions yet</p>
                  {user?.role === 'MODERATOR' && (
                    <Link to="/sessions/create" className="mt-2 inline-block">
                      <Button size="sm">Schedule First Session</Button>
                    </Link>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
