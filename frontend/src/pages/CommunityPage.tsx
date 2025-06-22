import { useEffect, useState } from 'react';
import { Layout } from '@/components/layout';
import { Card, CardContent, CardFooter } from '@/components/ui';
import { Input } from '@/components/ui';
import { Loader2, User, Shield, BarChart2, Trophy } from 'lucide-react';
import { apiService } from '@/services/api';
import type { User as UserType } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui';
import { Link } from 'react-router-dom';

export function CommunityPage() {
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const response = await apiService.getUsers();
        setUsers(response.data.results || []);
      } catch (error) {
        console.error('Failed to fetch users:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }

    if (filteredUsers.length === 0) {
      return (
        <div className="text-center py-20">
          <h3 className="text-xl font-semibold">No users found</h3>
          <p className="text-muted-foreground mt-2">
            Try adjusting your search.
          </p>
        </div>
      );
    }
    
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {filteredUsers.map(user => (
          <Card key={user.id} className="flex flex-col text-center">
            <CardContent className="flex-grow flex flex-col items-center p-6">
              <Avatar className="w-24 h-24 mb-4">
                <AvatarImage src={`https://api.dicebear.com/8.x/bottts-neutral/svg?seed=${user.username}`} />
                <AvatarFallback>{user.username.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <h4 className="font-semibold text-lg">{user.username}</h4>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                {user.role === 'MODERATOR' ? <Shield className="h-4 w-4 text-primary" /> : <User className="h-4 w-4" />}
                <span className="capitalize">{user.role.toLowerCase()}</span>
              </div>
              <div className="flex justify-around w-full text-sm text-muted-foreground border-t pt-4">
                <div className="text-center">
                  <p className="font-bold text-lg text-foreground">12</p>
                  <p className="text-xs">Debates</p>
                </div>
                <div className="text-center">
                  <p className="font-bold text-lg text-foreground">75%</p>
                  <p className="text-xs">Win Rate</p>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button asChild variant="outline" className="w-full">
                <Link to={`/profile/${user.id}`}>View Profile</Link>
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
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Community</h1>
          <p className="text-muted-foreground">
            Explore the community and find other users.
          </p>
        </div>
        
        <div className="w-full md:w-1/2 lg:w-1/3">
          <Input 
            placeholder="Search users..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        {renderContent()}
      </div>
    </Layout>
  );
}