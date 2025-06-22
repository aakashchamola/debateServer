import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, Shield, Bell, Palette, Lock, Save, Camera, Trash2, Loader2 } from 'lucide-react';
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
  Switch,
} from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { cn } from '@/utils';
import { useParams } from 'react-router-dom';
import { apiService } from '@/services/api';
import type { User as UserType } from '@/types';

const profileSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Please enter a valid email'),
  // bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
  // location: z.string().max(100, 'Location must be less than 100 characters').optional(),
});

const notificationSchema = z.object({
  debateInvites: z.boolean().default(true),
  debateResults: z.boolean().default(true),
  achievements: z.boolean().default(false),
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

type Tab = 'profile' | 'notifications' | 'security' | 'appearance';

export function ProfilePage() {
  const { user: authUser } = useAuth();
  const { userId } = useParams<{ userId: string }>();
  const [profileUser, setProfileUser] = useState<UserType | null>(null);
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingProfile, setIsFetchingProfile] = useState(true);

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

  const notificationForm = useForm({
    resolver: zodResolver(notificationSchema),
    defaultValues: {
      debateInvites: true,
      debateResults: true,
      achievements: false,
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

  const onProfileSubmit = async (data: any) => {
    setIsLoading(true);
    console.log('Updating profile:', data);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsLoading(false);
  };

  const onNotificationSubmit = async (data: any) => {
    setIsLoading(true);
    console.log('Updating notifications:', data);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsLoading(false);
  };

  const onSecuritySubmit = async (data: any) => {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('Security data submitted:', data);
    securityForm.reset();
    setIsLoading(false);
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
                Update your account's profile information and email address.
              </CardDescription>
            </CardHeader>
            <form onSubmit={profileForm.handleSubmit(onProfileSubmit)}>
              <CardContent className="space-y-8">
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center text-4xl font-bold text-muted-foreground">
                      {profileUser?.username ? profileUser.username.charAt(0).toUpperCase() : 'U'}
                    </div>
                    {isOwnProfile && (
                      <Button size="icon" className="absolute bottom-0 right-0 rounded-full">
                        <Camera className="h-4 w-4" />
                      </Button>
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
                  <Input id="username" {...profileForm.register('username')} disabled={!isOwnProfile} />
                  {profileForm.formState.errors.username && (
                    <p className="text-sm text-red-500">{profileForm.formState.errors.username.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" {...profileForm.register('email')} disabled={!isOwnProfile} />
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
                {[
                  { id: 'debateInvites', title: 'Debate Invitations', description: 'Get notified when you are invited to a debate.' },
                  { id: 'debateResults', title: 'Debate Results', description: 'Receive results when a debate you participated in concludes.' },
                  { id: 'achievements', title: 'Achievements', description: 'Get notified when you unlock a new achievement.' },
                ].map(item => (
                  <Controller
                    key={item.id}
                    control={notificationForm.control}
                    name={item.id as keyof z.infer<typeof notificationSchema>}
                    render={({ field }) => (
                      <div className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <Label className="text-base" htmlFor={item.id}>{item.title}</Label>
                          <p className="text-sm text-muted-foreground">{item.description}</p>
                        </div>
                        <Switch id={item.id} checked={field.value} onCheckedChange={field.onChange} />
                      </div>
                    )}
                  />
                ))}
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
