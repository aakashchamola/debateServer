import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
import { Label } from '@/components/ui';
import { Textarea } from '@/components/ui';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui';
import { PlusCircle, Loader2 } from 'lucide-react';
import { apiService } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import type { DebateTopic, CreateTopicForm } from '@/types';
import { formatDate } from '@/utils';

const createTopicSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  description: z.string().min(20, 'Description must be at least 20 characters'),
});

export function TopicsPage() {
  const { user } = useAuth();
  const [topics, setTopics] = useState<DebateTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreateTopicForm>({
    resolver: zodResolver(createTopicSchema),
  });

  const fetchTopics = async () => {
    try {
      setLoading(true);
      const response = await apiService.getTopics();
      setTopics(response.data.results || []);
    } catch (error) {
      console.error('Failed to fetch topics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTopics();
  }, []);

  const handleCreateTopic = async (data: CreateTopicForm) => {
    try {
      const newTopic = await apiService.createTopic(data);
      setTopics(prev => [newTopic.data, ...prev]);
      reset();
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error('Failed to create topic:', error);
      // TODO: show error to user
    }
  };
  
  const filteredTopics = topics.filter(topic =>
    topic.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    topic.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }

    if (filteredTopics.length === 0) {
      return (
        <div className="text-center py-20">
          <h3 className="text-xl font-semibold">No topics found</h3>
          <p className="text-muted-foreground mt-2">
            Try adjusting your search or create a new topic.
          </p>
        </div>
      );
    }
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTopics.map(topic => (
          <Card key={topic.id} className="flex flex-col">
            <CardHeader>
              <CardTitle>{topic.title}</CardTitle>
              <CardDescription>By {topic.created_by.username} on {formatDate(topic.created_at)}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <p className="text-sm text-muted-foreground">{topic.description}</p>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full">View Debates</Button>
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
            <h1 className="text-3xl font-bold tracking-tight">Debate Topics</h1>
            <p className="text-muted-foreground">
              Browse and manage debate topics.
            </p>
          </div>
          {user?.role === 'MODERATOR' && (
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create Topic
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create a New Debate Topic</DialogTitle>
                  <DialogDescription>
                    Provide a title and a description for the new topic. It will be available for creating debate sessions immediately.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(handleCreateTopic)} className="space-y-4 py-4">
                  <div>
                    <Label htmlFor="title">Topic Title</Label>
                    <Input id="title" {...register('title')} />
                    {errors.title && <p className="text-sm text-red-500 mt-1">{errors.title.message}</p>}
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea id="description" {...register('description')} />
                    {errors.description && <p className="text-sm text-red-500 mt-1">{errors.description.message}</p>}
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="ghost" onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button>
                    <Button type="submit">Create Topic</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
        
        <div className="w-full md:w-1/2 lg:w-1/3">
          <Input 
            placeholder="Search topics..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        {renderContent()}
      </div>
    </Layout>
  );
} 