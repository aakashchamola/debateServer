import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  User as UserIcon, 
  Shield, 
  Calendar, 
  BarChart3,
  ArrowLeft
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/context/AuthContext';
import { apiService } from '@/services/api';
import type { User, UserStats } from '@/types';

export function UserProfilePage() {
  const { username } = useParams<{ username: string }>();
  const { user: currentUser } = useAuth();
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [followers, setFollowers] = useState<User[]>([]);
  const [following, setFollowing] = useState<User[]>([]);
  const [activeTab, setActiveTab] = useState<'followers' | 'following'>('followers');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (username) {
      fetchUserProfile();
    }
  }, [username]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      // First, search for the user by username to get their ID
      const searchResponse = await apiService.searchUsers(username!);
      const foundUser = searchResponse.data.results.find(
        u => u.username.toLowerCase() === username!.toLowerCase()
      );

      if (!foundUser) {
        setError('User not found');
        return;
      }

      // Get full user profile
      const userResponse = await apiService.getUser(foundUser.id);
      setProfileUser(userResponse.data);

      // Get user stats
      const statsResponse = await apiService.getUserStats(foundUser.id);
      setUserStats(statsResponse.data);

      // Get followers and following
      const [followersResponse, followingResponse] = await Promise.all([
        apiService.getUserFollowers(foundUser.id),
        apiService.getUserFollowing(foundUser.id)
      ]);
      
      setFollowers(followersResponse.data.results);
      setFollowing(followingResponse.data.results);

    } catch (error) {
      console.error('Error fetching user profile:', error);
      setError('Failed to load user profile');
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    if (!profileUser) return;
    
    try {
      await apiService.followUser(profileUser.id);
      setProfileUser(prev => prev ? { ...prev, is_following: true, followers_count: prev.followers_count + 1 } : null);
    } catch (error) {
      console.error('Error following user:', error);
    }
  };

  const handleUnfollow = async () => {
    if (!profileUser) return;
    
    try {
      await apiService.unfollowUser(profileUser.id);
      setProfileUser(prev => prev ? { ...prev, is_following: false, followers_count: prev.followers_count - 1 } : null);
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

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center min-h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (error || !profileUser) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold mb-2">User Not Found</h2>
            <p className="text-gray-600 mb-4">
              {error || "The user you're looking for doesn't exist."}
            </p>
            <Link to="/community">
              <Button>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Community
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isOwnProfile = currentUser?.id === profileUser.id;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back Button */}
      <div className="mb-6">
        <Link to="/community">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Community
          </Button>
        </Link>
      </div>

      {/* Profile Header */}
      <Card className="mb-8">
        <CardContent className="p-8">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <Avatar className="h-24 w-24">
              <AvatarFallback className="bg-primary/10 text-2xl">
                {profileUser.username[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4">
                <h1 className="text-3xl font-bold">{profileUser.username}</h1>
                <Badge variant="outline" className={getRoleColor(profileUser.role)}>
                  {profileUser.role === 'MODERATOR' ? (
                    <><Shield className="h-4 w-4 mr-1" /> {profileUser.role}</>
                  ) : (
                    <><UserIcon className="h-4 w-4 mr-1" /> {profileUser.role}</>
                  )}
                </Badge>
              </div>

              <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-4">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Joined {new Date(profileUser.date_joined).toLocaleDateString()}
                </div>
                <div className={`font-semibold ${getRatingColor(profileUser.rating)}`}>
                  {profileUser.rating} rating
                </div>
              </div>

              {profileUser.bio && (
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  {profileUser.bio}
                </p>
              )}

              <div className="flex items-center gap-6 text-sm">
                <div>
                  <span className="font-semibold">{profileUser.following_count}</span>
                  <span className="text-gray-600 ml-1">Following</span>
                </div>
                <div>
                  <span className="font-semibold">{profileUser.followers_count}</span>
                  <span className="text-gray-600 ml-1">Followers</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              {!isOwnProfile && (
                <Button
                  onClick={profileUser.is_following ? handleUnfollow : handleFollow}
                  variant={profileUser.is_following ? "outline" : "default"}
                >
                  {profileUser.is_following ? 'Unfollow' : 'Follow'}
                </Button>
              )}
              {isOwnProfile && (
                <Link to="/profile">
                  <Button variant="outline">Edit Profile</Button>
                </Link>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Stats Cards */}
        <div className="lg:col-span-2 space-y-6">
          {userStats && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Debate Statistics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {userStats.total_debates}
                    </div>
                    <div className="text-sm text-gray-500">Total Debates</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {userStats.debates_won}
                    </div>
                    <div className="text-sm text-gray-500">Won</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {userStats.debates_lost}
                    </div>
                    <div className="text-sm text-gray-500">Lost</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">
                      {userStats.win_rate.toFixed(1)}%
                    </div>
                    <div className="text-sm text-gray-500">Win Rate</div>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-6 text-center">
                    <div>
                      <div className="text-lg font-semibold">{userStats.total_messages}</div>
                      <div className="text-sm text-gray-500">Messages Sent</div>
                    </div>
                    <div>
                      <div className="text-lg font-semibold">{userStats.likes_received}</div>
                      <div className="text-sm text-gray-500">Likes Received</div>
                    </div>
                    <div>
                      <div className="text-lg font-semibold">{userStats.highest_rating}</div>
                      <div className="text-sm text-gray-500">Highest Rating</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Network Tabs */}
          <div className="w-full">
            <div className="flex gap-2 mb-6">
              <Button
                variant={activeTab === 'followers' ? 'default' : 'outline'}
                onClick={() => setActiveTab('followers')}
              >
                Followers ({followers.length})
              </Button>
              <Button
                variant={activeTab === 'following' ? 'default' : 'outline'}
                onClick={() => setActiveTab('following')}
              >
                Following ({following.length})
              </Button>
            </div>
            
            {activeTab === 'followers' && (
              <Card>
                <CardHeader>
                  <CardTitle>Followers</CardTitle>
                </CardHeader>
                <CardContent>
                  {followers.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No followers yet
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {followers.map((follower) => (
                        <div key={follower.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarFallback className="bg-primary/10">
                                {follower.username[0].toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <Link 
                                to={`/profile/${follower.username}`}
                                className="font-medium hover:text-primary"
                              >
                                {follower.username}
                              </Link>
                              <div className="text-sm text-gray-600">
                                <Badge variant="outline" className={getRoleColor(follower.role)}>
                                  {follower.role}
                                </Badge>
                                <span className="ml-2">{follower.rating} rating</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {activeTab === 'following' && (
              <Card>
                <CardHeader>
                  <CardTitle>Following</CardTitle>
                </CardHeader>
                <CardContent>
                  {following.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      Not following anyone yet
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {following.map((followedUser) => (
                        <div key={followedUser.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarFallback className="bg-primary/10">
                                {followedUser.username[0].toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <Link 
                                to={`/profile/${followedUser.username}`}
                                className="font-medium hover:text-primary"
                              >
                                {followedUser.username}
                              </Link>
                              <div className="text-sm text-gray-600">
                                <Badge variant="outline" className={getRoleColor(followedUser.role)}>
                                  {followedUser.role}
                                </Badge>
                                <span className="ml-2">{followedUser.rating} rating</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Quick Stats Sidebar */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg">
                <div className={`text-3xl font-bold ${getRatingColor(profileUser.rating)}`}>
                  {profileUser.rating}
                </div>
                <div className="text-sm text-gray-500">Current Rating</div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Current Rating</span>
                  <span className={`font-semibold ${getRatingColor(profileUser.rating)}`}>
                    {profileUser.rating}
                  </span>
                </div>
                {userStats && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Highest Rating</span>
                      <span className="font-semibold text-yellow-600">
                        {userStats.highest_rating}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Win Rate</span>
                      <span className="font-semibold text-green-600">
                        {userStats.win_rate.toFixed(1)}%
                      </span>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
