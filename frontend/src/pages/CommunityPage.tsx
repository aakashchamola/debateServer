import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Trophy, Users, UserPlus, Loader2, Shield, User as UserIcon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/context/AuthContext';
import { apiService } from '@/services/api';
import type { User } from '@/types';

export function CommunityPage() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [following, setFollowing] = useState<User[]>([]);
  const [leaderboard, setLeaderboard] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeView, setActiveView] = useState<'search' | 'following' | 'leaderboard'>('following');

  useEffect(() => {
    fetchFollowing();
    fetchLeaderboard();
  }, []);

  const fetchFollowing = async () => {
    try {
      const response = await apiService.getMyFollowing();
      setFollowing(response.data.results);
    } catch (error) {
      console.error('Error fetching following:', error);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const response = await apiService.getLeaderboard();
      setLeaderboard(response.data.results);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setLoading(true);
      const response = await apiService.searchUsers(query, '-rating');
      setSearchResults(response.data.results);
      setActiveView('search');
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async (userId: number) => {
    try {
      await apiService.followUser(userId);
      // Update the user in search results
      setSearchResults(prev => 
        prev.map(u => u.id === userId ? { ...u, is_following: true } : u)
      );
      // Refresh following list
      fetchFollowing();
    } catch (error) {
      console.error('Error following user:', error);
    }
  };

  const handleUnfollow = async (userId: number) => {
    try {
      await apiService.unfollowUser(userId);
      // Update the user in search results
      setSearchResults(prev => 
        prev.map(u => u.id === userId ? { ...u, is_following: false } : u)
      );
      // Refresh following list
      fetchFollowing();
    } catch (error) {
      console.error('Error unfollowing user:', error);
    }
  };

  const getRoleColor = (role: string) => {
    return role === 'MODERATOR' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800';
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 800) return 'text-yellow-600';
    if (rating >= 600) return 'text-green-600';
    if (rating >= 400) return 'text-blue-600';
    return 'text-gray-600';
  };

  const renderUserCard = (userItem: User, showFollowButton: boolean = true) => (
    <div key={userItem.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
      <div className="flex items-center gap-3">
        <Avatar className="h-12 w-12">
          <AvatarFallback className="bg-primary/10">
            {userItem.username[0].toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div>
          <Link 
            to={`/profile/${userItem.username}`}
            className="font-medium hover:text-primary transition-colors"
          >
            {userItem.username}
          </Link>
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Badge variant="outline" className={getRoleColor(userItem.role)}>
              {userItem.role === 'MODERATOR' ? (
                <><Shield className="h-3 w-3 mr-1" /> {userItem.role}</>
              ) : (
                <><UserIcon className="h-3 w-3 mr-1" /> {userItem.role}</>
              )}
            </Badge>
            <span className={`font-medium ${getRatingColor(userItem.rating)}`}>
              {userItem.rating} rating
            </span>
            <span>• {userItem.followers_count} followers</span>
          </div>
          {userItem.bio && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-md">
              {userItem.bio}
            </p>
          )}
        </div>
      </div>
      {showFollowButton && userItem.id !== user?.id && (
        <Button
          size="sm"
          variant={userItem.is_following ? "outline" : "default"}
          onClick={() => userItem.is_following 
            ? handleUnfollow(userItem.id) 
            : handleFollow(userItem.id)
          }
        >
          {userItem.is_following ? 'Unfollow' : 'Follow'}
        </Button>
      )}
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-50 mb-2">
          Community
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Connect with other debaters, discover new perspectives, and climb the leaderboard
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Search Section */}
        <div className="lg:col-span-3">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Search Users
              </CardTitle>
              <CardDescription>
                Find and connect with other debaters
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <Input
                  placeholder="Search by username or bio..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>
            </CardContent>
          </Card>

          {/* Navigation Tabs */}
          <div className="flex gap-2 mb-6">
            <Button
              variant={activeView === 'following' ? 'default' : 'outline'}
              onClick={() => setActiveView('following')}
              className="flex items-center gap-2"
            >
              <Users className="h-4 w-4" />
              Following ({following.length})
            </Button>
            <Button
              variant={activeView === 'leaderboard' ? 'default' : 'outline'}
              onClick={() => setActiveView('leaderboard')}
              className="flex items-center gap-2"
            >
              <Trophy className="h-4 w-4" />
              Leaderboard
            </Button>
          </div>

          {/* Content Area */}
          <Card>
            <CardContent className="p-6">
              {activeView === 'search' && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Search Results</h3>
                  {loading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : searchResults.length > 0 ? (
                    <div className="space-y-3">
                      {searchResults.map((searchUser) => renderUserCard(searchUser))}
                    </div>
                  ) : searchQuery ? (
                    <div className="text-center py-8 text-gray-500">
                      No users found for "{searchQuery}"
                    </div>
                  ) : null}
                </div>
              )}

              {activeView === 'following' && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">People You Follow</h3>
                  {following.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <UserPlus className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>You're not following anyone yet</p>
                      <p className="text-sm">Search for users above to start building your network</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {following.map((followedUser) => renderUserCard(followedUser))}
                    </div>
                  )}
                </div>
              )}

              {activeView === 'leaderboard' && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Top Debaters</h3>
                  <div className="space-y-3">
                    {leaderboard.map((topUser, index) => (
                      <div key={topUser.id} className="flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary font-bold">
                          {index + 1}
                        </div>
                        <Avatar className="h-12 w-12">
                          <AvatarFallback className="bg-primary/10">
                            {topUser.username[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <Link 
                            to={`/profile/${topUser.username}`}
                            className="font-medium hover:text-primary transition-colors"
                          >
                            {topUser.username}
                          </Link>
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <Badge variant="outline" className={getRoleColor(topUser.role)}>
                              {topUser.role === 'MODERATOR' ? (
                                <><Shield className="h-3 w-3 mr-1" /> {topUser.role}</>
                              ) : (
                                <><UserIcon className="h-3 w-3 mr-1" /> {topUser.role}</>
                              )}
                            </Badge>
                            <span>• {topUser.followers_count} followers</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`text-xl font-bold ${getRatingColor(topUser.rating)}`}>
                            {topUser.rating}
                          </div>
                          <div className="text-sm text-gray-500">rating</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Your Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className={`text-3xl font-bold ${getRatingColor(user?.rating || 500)}`}>
                  {user?.rating || 500}
                </div>
                <div className="text-sm text-gray-500">Your Rating</div>
              </div>
              
              <div className="grid grid-cols-1 gap-4 text-center">
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="text-lg font-semibold text-blue-600">
                    {user?.following_count || 0}
                  </div>
                  <div className="text-sm text-gray-500">Following</div>
                </div>
                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="text-lg font-semibold text-green-600">
                    {user?.followers_count || 0}
                  </div>
                  <div className="text-sm text-gray-500">Followers</div>
                </div>
              </div>

              <Link to="/profile" className="block">
                <Button className="w-full" variant="outline">
                  View Full Profile
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}