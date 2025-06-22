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

  // Load notification settings for own profile
  useEffect(() => {
    if (isOwnProfile && authUser) {
      const fetchNotificationSettings = async () => {
        try {
          const response = await apiService.getNotificationSettings();
          notificationForm.setValue('notificationsEnabled', response.data.notifications_enabled);
        } catch (error) {
          console.error('Failed to fetch notification settings', error);
        }
      };
      fetchNotificationSettings();
    }
  }, [isOwnProfile, authUser, notificationForm]);

  const onProfileSubmit = async (data: any) => {
    setIsLoading(true);
    try {
      const response = await apiService.updateProfile(data);
      console.log('Profile updated successfully:', response.data);
      // You might want to update the auth context with new user data
    } catch (error) {
      console.error('Failed to update profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onNotificationSubmit = async (data: any) => {
    setIsLoading(true);
    try {
      await apiService.updateNotificationSettings({
        notifications_enabled: data.notificationsEnabled
      });
      console.log('Notification settings saved:', data);
    } catch (error) {
      console.error('Failed to save notification settings:', error);
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

  const handleProfilePictureUpload = async (file: File) => {
    setIsLoading(true);
    try {
      const response = await apiService.uploadProfilePicture(file);
      setProfileUser(response.data);
      console.log('Profile picture uploaded successfully');
    } catch (error) {
      console.error('Failed to upload profile picture:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfilePictureChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleProfilePictureUpload(file);
    }
  };

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'profile', label: 'Profile', icon: User },
    ...(isOwnProfile
      ? ([
          { id: 'notifications', label: 'Notifications', icon: Bell },
          { id: 'security', label: 'Security', icon: Lock },
          { id: 'appearance', label: 'Appearance', icon: Palette },
        ] as { id: Tab; label: string; icon: React.ElementType }[])
      : []),
  ];

  if (isFetchingProfile) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </Layout>
    );
  }

  if (!profileUser) {
    return (
      <Layout>
        <div className="text-center py-20">
          <h2 className="text-2xl font-bold">User not found</h2>
        </div>
      </Layout>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Update your account's profile information and username.
              </CardDescription>
            </CardHeader>
            <form onSubmit={profileForm.handleSubmit(onProfileSubmit)}>
              <CardContent className="space-y-8">
                <div className="flex items-center gap-6">
                  <div className="relative">
                    {profileUser?.profile_picture ? (
                      <img 
                        src={profileUser.profile_picture} 
                        alt="Profile" 
                        className="w-24 h-24 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center text-4xl font-bold text-muted-foreground">
                        {profileUser?.username ? profileUser.username.charAt(0).toUpperCase() : 'U'}
                      </div>
                    )}
                    {isOwnProfile && (
                      <>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleProfilePictureChange}
                          className="hidden"
                          id="profile-picture-input"
                        />
                        <Button 
                          size="icon" 
                          className="absolute bottom-0 right-0 rounded-full"
                          type="button"
                          onClick={() => document.getElementById('profile-picture-input')?.click()}
                        >
                          <Camera className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">{profileUser?.username}</h3>
                    <p className="text-sm text-muted-foreground">{profileUser?.email}</p>
                    <div className="flex items-center gap-2 mt-2 text-xs font-medium text-muted-foreground">
                      {profileUser?.role === 'MODERATOR' ? <Shield className="h-4 w-4 text-primary" /> : <User className="h-4 w-4" />}
                      <span>{profileUser?.role}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <div className="relative flex items-center gap-2">
                    <Input id="username" {...profileForm.register('username')} disabled={!isOwnProfile} autoComplete="off" />
                    {checkingUsername && (
                      <span className="text-xs text-muted-foreground ml-2">Checking...</span>
                    )}
                    {usernameAvailable === true && !checkingUsername && (
                      <span className="flex items-center text-green-600 text-xs ml-2"><CheckCircle className="h-4 w-4 mr-1" />Available</span>
                    )}
                    {usernameAvailable === false && !checkingUsername && (
                      <span className="flex items-center text-red-500 text-xs ml-2"><XCircle className="h-4 w-4 mr-1" />Already taken</span>
                    )}
                  </div>
                  {profileForm.formState.errors.username && (
                    <p className="text-sm text-red-500">{profileForm.formState.errors.username.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" {...profileForm.register('email')} disabled />
                  {profileForm.formState.errors.email && (
                    <p className="text-sm text-red-500">{profileForm.formState.errors.email.message}</p>
                  )}
                </div>
              </CardContent>
              {isOwnProfile && (
                <CardFooter className="border-t px-6 py-4">
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? 'Saving...' : 'Save Changes'}
                  </Button>
                </CardFooter>
              )}
            </form>
          </Card>
        );
      case 'notifications':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>
                Manage how you receive notifications.
              </CardDescription>
            </CardHeader>
            <form onSubmit={notificationForm.handleSubmit(onNotificationSubmit)}>
              <CardContent className="space-y-6">
                <Controller
                  control={notificationForm.control}
                  name="notificationsEnabled"
                  render={({ field }) => (
                    <div className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <Label className="text-base" htmlFor="notifications">Enable Notifications</Label>
                        <p className="text-sm text-muted-foreground">
                          Receive notifications about debates, results, and platform updates.
                        </p>
                      </div>
                      <Switch id="notifications" checked={field.value} onCheckedChange={field.onChange} />
                    </div>
                  )}
                />
              </CardContent>
              <CardFooter className="border-t px-6 py-4">
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Saving...' : 'Save Preferences'}
                </Button>
              </CardFooter>
            </form>
          </Card>
        );
      case 'security':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Security</CardTitle>
              <CardDescription>
                Update your password.
              </CardDescription>
            </CardHeader>
            <form onSubmit={securityForm.handleSubmit(onSecuritySubmit)}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input id="currentPassword" type="password" {...securityForm.register('currentPassword')} />
                  {securityForm.formState.errors.currentPassword && (
                    <p className="text-sm text-red-500">{securityForm.formState.errors.currentPassword.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input id="newPassword" type="password" {...securityForm.register('newPassword')} />
                  {securityForm.formState.errors.newPassword && (
                    <p className="text-sm text-red-500">{securityForm.formState.errors.newPassword.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input id="confirmPassword" type="password" {...securityForm.register('confirmPassword')} />
                  {securityForm.formState.errors.confirmPassword && (
                    <p className="text-sm text-red-500">{securityForm.formState.errors.confirmPassword.message}</p>
                  )}
                </div>
              </CardContent>
              <CardFooter className="border-t px-6 py-4">
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Updating...' : 'Update Password'}
                </Button>
              </CardFooter>
            </form>
          </Card>
        );
      case 'appearance':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>
                Customize the look and feel of the application.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="text-base">Theme</Label>
                <p className="text-sm text-muted-foreground mb-4">Select the theme for the dashboard.</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div
                    className={cn(
                      'rounded-lg border-2 p-4 cursor-pointer',
                      theme === 'light' ? 'border-primary' : 'border-transparent'
                    )}
                    onClick={() => setTheme('light')}
                  >
                    <div className="space-y-2">
                      <div className="h-16 w-full rounded-md bg-gray-100" />
                      <p className="text-center text-sm font-medium">Light</p>
                    </div>
                  </div>
                  <div
                    className={cn(
                      'rounded-lg border-2 p-4 cursor-pointer',
                      theme === 'dark' ? 'border-primary' : 'border-transparent'
                    )}
                    onClick={() => setTheme('dark')}
                  >
                    <div className="space-y-2">
                      <div className="h-16 w-full rounded-md bg-gray-800" />
                      <p className="text-center text-sm font-medium">Dark</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      default:
        return null;
    }
  };

  return (
    <Layout>
      <div className="space-y-8 p-4 md:p-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Account Settings</h1>
          <p className="text-muted-foreground">
            Manage your account settings and set e-mail preferences.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <nav className="flex flex-col space-y-1 md:col-span-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <Button
                  key={tab.id}
                  variant={activeTab === tab.id ? 'default' : 'ghost'}
                  className="justify-start"
                  onClick={() => setActiveTab(tab.id)}
                >
                  <Icon className="mr-2 h-4 w-4" />
                  {tab.label}
                </Button>
              );
            })}
          </nav>
          <div className="md:col-span-3">
            {renderContent()}
          </div>
        </div>
      </div>
    </Layout>
  );
}
