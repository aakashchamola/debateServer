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
import { PlusCircle, Loader2, Pencil, Trash2 } from 'lucide-react';
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
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<DebateTopic | null>(null);

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
  
  const handleUpdateTopic = async (data: CreateTopicForm) => {
    if (!selectedTopic) return;
    try {
      const updatedTopic = await apiService.updateTopic(selectedTopic.id, data);
      setTopics(topics.map(t => t.id === selectedTopic.id ? updatedTopic.data : t));
      setIsEditDialogOpen(false);
    } catch (error) {
      console.error('Failed to update topic:', error);
      // TODO: show error to user
    }
  };

  const handleDeleteTopic = async () => {
    if (!selectedTopic) return;
    try {
      await apiService.deleteTopic(selectedTopic.id);
      setTopics(topics.filter(t => t.id !== selectedTopic.id));
      setIsDeleteDialogOpen(false);
    } catch (error) {
      console.error('Failed to delete topic:', error);
      // TODO: show error to user
    }
  };

  const openEditDialog = (topic: DebateTopic) => {
    setSelectedTopic(topic);
    reset({ title: topic.title, description: topic.description });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (topic: DebateTopic) => {
    setSelectedTopic(topic);
    setIsDeleteDialogOpen(true);
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
            <CardFooter className="flex items-center justify-between">
              <Button variant="outline" className="flex-grow">View Debates</Button>
              {user?.role === 'MODERATOR' && (
                <div className="flex items-center ml-4 gap-2">
                  <Button variant="ghost" size="icon" onClick={() => openEditDialog(topic)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => openDeleteDialog(topic)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              )}
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

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Topic</DialogTitle>
              <DialogDescription>
                Update the details for your topic. Click save when you're done.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit(handleUpdateTopic)} className="space-y-4 py-4">
              <div>
                <Label htmlFor="edit-title">Topic Title</Label>
                <Input id="edit-title" {...register('title')} />
                {errors.title && <p className="text-sm text-red-500 mt-1">{errors.title.message}</p>}
              </div>
              <div>
                <Label htmlFor="edit-description">Description</Label>
                <Textarea id="edit-description" {...register('description')} />
                {errors.description && <p className="text-sm text-red-500 mt-1">{errors.description.message}</p>}
              </div>
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
                <Button type="submit">Save Changes</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Are you sure?</DialogTitle>
              <DialogDescription>
                This action cannot be undone. This will permanently delete the topic and all associated debates.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
              <Button variant="destructive" onClick={handleDeleteTopic}>Delete Topic</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
} 