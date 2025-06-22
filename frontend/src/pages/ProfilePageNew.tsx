import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, Shield, Lock, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { Layout } from '@/components/layout';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
  CardFooter,
  Button,
  Input,
  Label,
} from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/utils';
import { useParams } from 'react-router-dom';
import { apiService } from '@/services/api';
import type { User as UserType } from '@/types';
import debounce from 'lodash.debounce';

const profileSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Please enter a valid email'),
});

const securitySchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type Tab = 'profile' | 'security';

export function ProfilePage() {
  const { user: authUser } = useAuth();
  const { userId } = useParams<{ userId: string }>();
  const [profileUser, setProfileUser] = useState<UserType | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingProfile, setIsFetchingProfile] = useState(true);
  const [usernameAvailable, setUsernameAvailable] = useState<null | boolean>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);

  const isOwnProfile = !userId || (authUser && authUser.id.toString() === userId);

  useEffect(() => {
    const fetchProfileUser = async () => {
      setIsFetchingProfile(true);
      try {
        if (isOwnProfile) {
          setProfileUser(authUser);
        } else {
          const response = await apiService.getUser(parseInt(userId!));
          setProfileUser(response.data);
        }
      } catch (error) {
        console.error('Failed to fetch profile user', error);
      } finally {
        setIsFetchingProfile(false);
      }
    };
    fetchProfileUser();
  }, [userId, authUser, isOwnProfile]);

  const profileForm = useForm({
    resolver: zodResolver(profileSchema),
    values: {
      username: profileUser?.username || '',
      email: profileUser?.email || '',
    },
  });

  const securityForm = useForm({
    resolver: zodResolver(securitySchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  // Debounced username check
  const checkUsername = debounce(async (username: string) => {
    if (!username || username === profileUser?.username) {
      setUsernameAvailable(null);
      setCheckingUsername(false);
      return;
    }
    setCheckingUsername(true);
    try {
      const available = await apiService.checkUsernameAvailability(username);
      setUsernameAvailable(available);
    } catch {
      setUsernameAvailable(null);
    } finally {
      setCheckingUsername(false);
    }
  }, 400);

  // Watch username field for changes
  useEffect(() => {
    if (!isOwnProfile) return;
    const subscription = profileForm.watch((value, { name }) => {
      if (name === 'username') {
        checkUsername(value.username ?? "");
      }
    });
    return () => subscription.unsubscribe();
  }, [profileForm, isOwnProfile, profileUser]);

  const onProfileSubmit = async (data: any) => {
    setIsLoading(true);
    try {
      const response = await apiService.updateProfile(data);
      console.log('Profile updated successfully:', response.data);
      setProfileUser(response.data);
    } catch (error) {
      console.error('Failed to update profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onSecuritySubmit = async (data: any) => {
    setIsLoading(true);
    try {
      await apiService.changePassword({
        current_password: data.currentPassword,
        new_password: data.newPassword
      });
      console.log('Password changed successfully');
      securityForm.reset();
    } catch (error) {
      console.error('Failed to change password:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const tabs = [
    { id: 'profile' as Tab, label: 'Profile', icon: User },
    { id: 'security' as Tab, label: 'Security', icon: Lock },
  ];

  if (isFetchingProfile) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </div>
      </Layout>
    );
  }

  if (!profileUser) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">User not found</h1>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center space-x-4">
              <div className="w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                <User className="w-10 h-10 text-gray-600 dark:text-gray-300" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  {profileUser.username}
                </h1>
                <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                  <Shield className={cn(
                    'w-4 h-4',
                    profileUser.role === 'MODERATOR' ? 'text-blue-500' : 'text-green-500'
                  )} />
                  <span className="capitalize">{profileUser.role.toLowerCase()}</span>
                </div>
              </div>
            </div>
          </div>

          {isOwnProfile && (
            <>
              {/* Tabs */}
              <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
                <nav className="-mb-px flex space-x-8">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={cn(
                          'py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2',
                          activeTab === tab.id
                            ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                        )}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </nav>
              </div>

              {/* Tab Content */}
              {activeTab === 'profile' && (
                <Card>
                  <form onSubmit={profileForm.handleSubmit(onProfileSubmit)}>
                    <CardHeader>
                      <CardTitle>Profile Information</CardTitle>
                      <CardDescription>
                        Update your account details and personal information.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="username">Username</Label>
                        <div className="relative">
                          <Input
                            id="username"
                            {...profileForm.register('username')}
                            className={cn(
                              profileForm.formState.errors.username && 'border-red-500'
                            )}
                          />
                          {checkingUsername && (
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                              <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                            </div>
                          )}
                          {!checkingUsername && usernameAvailable !== null && (
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                              {usernameAvailable ? (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              ) : (
                                <XCircle className="h-4 w-4 text-red-500" />
                              )}
                            </div>
                          )}
                        </div>
                        {profileForm.formState.errors.username && (
                          <p className="text-sm text-red-600">
                            {profileForm.formState.errors.username.message}
                          </p>
                        )}
                        {!checkingUsername && usernameAvailable === false && (
                          <p className="text-sm text-red-600">Username is already taken</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          {...profileForm.register('email')}
                          className={cn(
                            profileForm.formState.errors.email && 'border-red-500'
                          )}
                        />
                        {profileForm.formState.errors.email && (
                          <p className="text-sm text-red-600">
                            {profileForm.formState.errors.email.message}
                          </p>
                        )}
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button 
                        type="submit" 
                        disabled={isLoading || !profileForm.formState.isValid || usernameAvailable === false}
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          'Save Changes'
                        )}
                      </Button>
                    </CardFooter>
                  </form>
                </Card>
              )}

              {activeTab === 'security' && (
                <Card>
                  <form onSubmit={securityForm.handleSubmit(onSecuritySubmit)}>
                    <CardHeader>
                      <CardTitle>Change Password</CardTitle>
                      <CardDescription>
                        Update your password to keep your account secure.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="currentPassword">Current Password</Label>
                        <Input
                          id="currentPassword"
                          type="password"
                          {...securityForm.register('currentPassword')}
                          className={cn(
                            securityForm.formState.errors.currentPassword && 'border-red-500'
                          )}
                        />
                        {securityForm.formState.errors.currentPassword && (
                          <p className="text-sm text-red-600">
                            {securityForm.formState.errors.currentPassword.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="newPassword">New Password</Label>
                        <Input
                          id="newPassword"
                          type="password"
                          {...securityForm.register('newPassword')}
                          className={cn(
                            securityForm.formState.errors.newPassword && 'border-red-500'
                          )}
                        />
                        {securityForm.formState.errors.newPassword && (
                          <p className="text-sm text-red-600">
                            {securityForm.formState.errors.newPassword.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirm Password</Label>
                        <Input
                          id="confirmPassword"
                          type="password"
                          {...securityForm.register('confirmPassword')}
                          className={cn(
                            securityForm.formState.errors.confirmPassword && 'border-red-500'
                          )}
                        />
                        {securityForm.formState.errors.confirmPassword && (
                          <p className="text-sm text-red-600">
                            {securityForm.formState.errors.confirmPassword.message}
                          </p>
                        )}
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button 
                        type="submit" 
                        disabled={isLoading || !securityForm.formState.isValid}
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Changing Password...
                          </>
                        ) : (
                          'Change Password'
                        )}
                      </Button>
                    </CardFooter>
                  </form>
                </Card>
              )}
            </>
          )}

          {!isOwnProfile && (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-gray-600 dark:text-gray-400">
                    This is {profileUser.username}'s profile.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
}
