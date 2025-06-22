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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui';
import { PlusCircle, Loader2, Users, Calendar, ArrowRight } from 'lucide-react';
import { apiService } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import type { DebateSession, CreateSessionForm, DebateTopic } from '@/types';
import { formatDateTime } from '@/utils';
import { Link } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Label } from '@/components/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const createSessionSchema = z.object({
  topic_id: z.number().min(1, 'Please select a topic'),
  start_time: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid date' }),
  end_time: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid date' }),
  max_participants: z.number().min(2, 'Must have at least 2 participants').max(20, 'Cannot exceed 20 participants'),
});

export function SessionsPage() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<DebateSession[]>([]);
  const [topics, setTopics] = useState<DebateTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'upcoming' | 'ended'>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreateSessionForm>({
    resolver: zodResolver(createSessionSchema),
    defaultValues: {
      max_participants: 10,
    }
  });

  const fetchSessionsAndTopics = async () => {
    try {
      setLoading(true);
      const [sessionsResponse, topicsResponse] = await Promise.all([
        apiService.getSessions(),
        apiService.getTopics(),
      ]);
      setSessions(sessionsResponse.data.results || []);
      setTopics(topicsResponse.data.results || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessionsAndTopics();
  }, []);
  
  const handleCreateSession = async (data: CreateSessionForm) => {
    try {
      const formattedData = {
        ...data,
        start_time: new Date(data.start_time).toISOString(),
        end_time: new Date(data.end_time).toISOString(),
      };
      const newSession = await apiService.createSession(formattedData);
      setSessions(prev => [newSession.data, ...prev]);
      reset();
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error('Failed to create session:', error);
      // TODO: show error to user
    }
  };

  const filteredSessions = sessions
    .filter(session => {
      const now = new Date();
      const startTime = new Date(session.start_time);
      const endTime = new Date(session.end_time);

      if (filter === 'active') return session.is_ongoing;
      if (filter === 'upcoming') return startTime > now;
      if (filter === 'ended') return endTime < now;
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
        {filteredSessions.map(session => {
          const now = new Date();
          const startTime = new Date(session.start_time);
          const endTime = new Date(session.end_time);
          let statusBadge;

          if (session.is_ongoing) {
            statusBadge = <Badge className="absolute top-4 right-4" variant="default">Live</Badge>;
          } else if (startTime > now) {
            statusBadge = <Badge className="absolute top-4 right-4" variant="secondary">Upcoming</Badge>;
          } else {
            statusBadge = <Badge className="absolute top-4 right-4" variant="outline">Ended</Badge>;
          }
          
          return (
            <Card key={session.id} className="flex flex-col">
              <CardHeader>
                {statusBadge}
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
          );
        })}
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
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create Session
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Session</DialogTitle>
                  <DialogDescription>
                    Schedule a new debate session for an existing topic.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(handleCreateSession)} className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="topic_id">Topic</Label>
                    <Controller
                      name="topic_id"
                      control={control}
                      render={({ field }) => (
                        <Select onValueChange={(value) => field.onChange(parseInt(value))} defaultValue={field.value?.toString()}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a topic" />
                          </SelectTrigger>
                          <SelectContent>
                            {topics.map(topic => (
                              <SelectItem key={topic.id} value={topic.id.toString()}>{topic.title}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {errors.topic_id && <p className="text-sm text-red-500 mt-1">{errors.topic_id.message}</p>}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="start_time">Start Time</Label>
                      <Input id="start_time" type="datetime-local" {...register('start_time')} />
                      {errors.start_time && <p className="text-sm text-red-500 mt-1">{errors.start_time.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="end_time">End Time</Label>
                      <Input id="end_time" type="datetime-local" {...register('end_time')} />
                      {errors.end_time && <p className="text-sm text-red-500 mt-1">{errors.end_time.message}</p>}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="max_participants">Max Participants</Label>
                    <Input id="max_participants" type="number" {...register('max_participants', { valueAsNumber: true })} />
                    {errors.max_participants && <p className="text-sm text-red-500 mt-1">{errors.max_participants.message}</p>}
                  </div>

                  <DialogFooter>
                    <Button type="button" variant="ghost" onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button>
                    <Button type="submit">Create Session</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
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
                <Button variant={filter === 'ended' ? 'default' : 'outline'} onClick={() => setFilter('ended')}>Ended</Button>
            </div>
        </div>

        {renderContent()}
      </div>
    </Layout>
  );
} 