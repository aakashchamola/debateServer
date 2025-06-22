import { useEffect, useState } from 'react';
import { Layout } from '@/components/layout';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
  CardFooter,
} from '@/components/ui';
import { Button } from '@/components/ui';
import { Input } from '@/components/ui';
import { Badge } from '@/components/ui';
import { PlusCircle, Loader2, Users, Calendar, ArrowRight } from 'lucide-react';
import { apiService } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import type { DebateSession } from '@/types';
import { formatDateTime } from '@/utils';
import { Link } from 'react-router-dom';

export function SessionsPage() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<DebateSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'upcoming'>('all');

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        setLoading(true);
        const response = await apiService.getSessions();
        setSessions(response.data.results || []);
      } catch (error) {
        console.error('Failed to fetch sessions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
  }, []);
  
  const filteredSessions = sessions
    .filter(session => {
      if (filter === 'active') return session.is_ongoing;
      if (filter === 'upcoming') return !session.is_ongoing; // This is a simplification
      return true;
    })
    .filter(session =>
      session.topic.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }

    if (filteredSessions.length === 0) {
      return (
        <div className="text-center py-20">
          <h3 className="text-xl font-semibold">No sessions found</h3>
          <p className="text-muted-foreground mt-2">
            Try adjusting your search or filters.
          </p>
        </div>
      );
    }
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSessions.map(session => (
          <Card key={session.id} className="flex flex-col">
            <CardHeader>
              {session.is_ongoing && <Badge className="absolute top-4 right-4">Live</Badge>}
              <CardTitle>{session.topic.title}</CardTitle>
              <CardDescription>Hosted by {session.created_by.username}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow grid gap-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>{formatDateTime(session.start_time)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>
                    {session.participants_count ?? 0} / {session.max_participants}{' '}
                    participants
                  </span>
                </div>
            </CardContent>
            <CardFooter>
              <Button asChild className="w-full">
                <Link to={`/debate/${session.id}`}>
                  {session.user_has_joined ? 'Continue' : 'Join'} Debate
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Debate Sessions</h1>
            <p className="text-muted-foreground">
              Browse and join active or upcoming debate sessions.
            </p>
          </div>
          {user?.role === 'MODERATOR' && (
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Session
            </Button>
          )}
        </div>
        
        <div className="flex flex-col md:flex-row gap-4">
            <div className="w-full md:w-1/2 lg:w-1/3">
                <Input 
                    placeholder="Search sessions by topic..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>
            <div className="flex items-center gap-2">
                <Button variant={filter === 'all' ? 'default' : 'outline'} onClick={() => setFilter('all')}>All</Button>
                <Button variant={filter === 'active' ? 'default' : 'outline'} onClick={() => setFilter('active')}>Active</Button>
                <Button variant={filter === 'upcoming' ? 'default' : 'outline'} onClick={() => setFilter('upcoming')}>Upcoming</Button>
            </div>
        </div>

        {renderContent()}
      </div>
    </Layout>
  );
} 