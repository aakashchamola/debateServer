import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  User, 
  Shield, 
  Bell, 
  Palette, 
  Lock,
  Save,
  Camera,
  Trash2
} from 'lucide-react';
import { Layout } from '@/components/layout';
import { Card, CardHeader, CardTitle, CardContent, Button, Input } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';

const profileSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Please enter a valid email'),
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
  location: z.string().max(100, 'Location must be less than 100 characters').optional(),
});

const notificationSchema = z.object({
  emailNotifications: z.boolean(),
  debateInvites: z.boolean(),
  debateResults: z.boolean(),
  achievements: z.boolean(),
  systemUpdates: z.boolean(),
});

const securitySchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export function ProfilePage() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<'profile' | 'notifications' | 'security' | 'appearance'>('profile');
  const [isLoading, setIsLoading] = useState(false);

  const profileForm = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: user?.username || '',
      email: user?.email || '',
      bio: '',
      location: '',
    },
  });

  const notificationForm = useForm({
    resolver: zodResolver(notificationSchema),
    defaultValues: {
      emailNotifications: true,
      debateInvites: true,
      debateResults: true,
      achievements: false,
      systemUpdates: true,
    },
  });

  const securityForm = useForm({
    resolver: zodResolver(securitySchema),
  });

  const onProfileSubmit = async (data: any) => {
    setIsLoading(true);
    try {
      // API call to update profile
      console.log('Updating profile:', data);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error('Failed to update profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onNotificationSubmit = async (data: any) => {
    setIsLoading(true);
    try {
      console.log('Updating notifications:', data);
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error('Failed to update notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onSecuritySubmit = async (data: any) => {
    setIsLoading(true);
    try {
      console.log('Updating password:', data);
      await new Promise(resolve => setTimeout(resolve, 1000));
      securityForm.reset();
    } catch (error) {
      console.error('Failed to update password:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const tabs = [
    { id: 'profile' as const, label: 'Profile', icon: User },
    { id: 'notifications' as const, label: 'Notifications', icon: Bell },
    { id: 'security' as const, label: 'Security', icon: Lock },
    { id: 'appearance' as const, label: 'Appearance', icon: Palette },
  ];

  return (
    <Layout>
      <div className="container py-8">
        <div className="profile-page">
          <div className="profile-header">
            <h1 className="page-title">Account Settings</h1>
            <p className="page-subtitle">
              Manage your account preferences and settings
            </p>
          </div>

          <div className="profile-layout">
            {/* Sidebar */}
            <div className="profile-sidebar">
              <Card>
                <CardContent className="p-0">
                  <nav className="profile-nav">
                    {tabs.map((tab) => {
                      const Icon = tab.icon;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id)}
                          className={`profile-nav-item ${activeTab === tab.id ? 'active' : ''}`}
                        >
                          <Icon className="h-4 w-4" />
                          {tab.label}
                        </button>
                      );
                    })}
                  </nav>
                </CardContent>
              </Card>
            </div>

            {/* Main Content */}
            <div className="profile-content">
              {activeTab === 'profile' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Profile Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="form-stack">
                      {/* Avatar Section */}
                      <div className="avatar-section">
                        <div className="avatar-large">
                          {user?.username ? user.username.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div className="avatar-actions">
                          <Button variant="outline" size="sm">
                            <Camera className="h-4 w-4 mr-2" />
                            Change Avatar
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Remove
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Input
                          label="Username"
                          {...profileForm.register('username')}
                          error={profileForm.formState.errors.username?.message}
                        />
                        <Input
                          label="Email"
                          type="email"
                          {...profileForm.register('email')}
                          error={profileForm.formState.errors.email?.message}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Input
                          label="Location (optional)"
                          placeholder="e.g., San Francisco, CA"
                          {...profileForm.register('location')}
                          error={profileForm.formState.errors.location?.message}
                        />
                        <div className="input-group">
                          <label className="input-label">Role</label>
                          <div className="role-badge">
                            {user?.role === 'MODERATOR' ? (
                              <>
                                <Shield className="h-4 w-4" />
                                Moderator
                              </>
                            ) : (
                              <>
                                <User className="h-4 w-4" />
                                Student
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="input-group">
                        <label className="input-label">Bio (optional)</label>
                        <textarea
                          className="textarea"
                          rows={4}
                          placeholder="Tell us about yourself..."
                          {...profileForm.register('bio')}
                        />
                        {profileForm.formState.errors.bio && (
                          <p className="input-error-text">{profileForm.formState.errors.bio.message}</p>
                        )}
                      </div>

                      <div className="form-actions">
                        <Button type="submit" isLoading={isLoading}>
                          <Save className="h-4 w-4 mr-2" />
                          Save Changes
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              )}

              {activeTab === 'notifications' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Bell className="h-5 w-5" />
                      Notification Preferences
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={notificationForm.handleSubmit(onNotificationSubmit)} className="form-stack">
                      <div className="notification-settings">
                        <div className="notification-group">
                          <h3 className="text-base font-semibold mb-4">Email Notifications</h3>
                          <div className="space-y-4">
                            <label className="checkbox-label">
                              <input
                                type="checkbox"
                                className="checkbox"
                                {...notificationForm.register('emailNotifications')}
                              />
                              <span className="checkbox-text">
                                <strong>Email notifications</strong>
                                <span className="text-secondary">Receive notifications via email</span>
                              </span>
                            </label>
                          </div>
                        </div>

                        <div className="notification-group">
                          <h3 className="text-base font-semibold mb-4">Debate Notifications</h3>
                          <div className="space-y-4">
                            <label className="checkbox-label">
                              <input
                                type="checkbox"
                                className="checkbox"
                                {...notificationForm.register('debateInvites')}
                              />
                              <span className="checkbox-text">
                                <strong>Debate invitations</strong>
                                <span className="text-secondary">Get notified when invited to debates</span>
                              </span>
                            </label>

                            <label className="checkbox-label">
                              <input
                                type="checkbox"
                                className="checkbox"
                                {...notificationForm.register('debateResults')}
                              />
                              <span className="checkbox-text">
                                <strong>Debate results</strong>
                                <span className="text-secondary">Get notified when debates conclude</span>
                              </span>
                            </label>
                          </div>
                        </div>

                        <div className="notification-group">
                          <h3 className="text-base font-semibold mb-4">Other Notifications</h3>
                          <div className="space-y-4">
                            <label className="checkbox-label">
                              <input
                                type="checkbox"
                                className="checkbox"
                                {...notificationForm.register('achievements')}
                              />
                              <span className="checkbox-text">
                                <strong>Achievements</strong>
                                <span className="text-secondary">Get notified about new achievements</span>
                              </span>
                            </label>

                            <label className="checkbox-label">
                              <input
                                type="checkbox"
                                className="checkbox"
                                {...notificationForm.register('systemUpdates')}
                              />
                              <span className="checkbox-text">
                                <strong>System updates</strong>
                                <span className="text-secondary">Get notified about platform updates</span>
                              </span>
                            </label>
                          </div>
                        </div>
                      </div>

                      <div className="form-actions">
                        <Button type="submit" isLoading={isLoading}>
                          <Save className="h-4 w-4 mr-2" />
                          Save Preferences
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              )}

              {activeTab === 'security' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Lock className="h-5 w-5" />
                      Security Settings
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={securityForm.handleSubmit(onSecuritySubmit)} className="form-stack">
                      <div className="security-info">
                        <div className="alert alert-info">
                          <p>Choose a strong password to keep your account secure</p>
                        </div>
                      </div>

                      <Input
                        label="Current Password"
                        type="password"
                        {...securityForm.register('currentPassword')}
                        error={securityForm.formState.errors.currentPassword?.message}
                      />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Input
                          label="New Password"
                          type="password"
                          {...securityForm.register('newPassword')}
                          error={securityForm.formState.errors.newPassword?.message}
                        />
                        <Input
                          label="Confirm New Password"
                          type="password"
                          {...securityForm.register('confirmPassword')}
                          error={securityForm.formState.errors.confirmPassword?.message}
                        />
                      </div>

                      <div className="form-actions">
                        <Button type="submit" isLoading={isLoading}>
                          <Save className="h-4 w-4 mr-2" />
                          Update Password
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              )}

              {activeTab === 'appearance' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Palette className="h-5 w-5" />
                      Appearance Settings
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="form-stack">
                      <div className="appearance-section">
                        <h3 className="text-base font-semibold mb-4">Theme</h3>
                        <div className="theme-selector">
                          <button
                            type="button"
                            onClick={toggleTheme}
                            className={`theme-option ${theme === 'light' ? 'active' : ''}`}
                          >
                            <div className="theme-preview theme-light"></div>
                            <span>Light</span>
                          </button>
                          <button
                            type="button"
                            onClick={toggleTheme}
                            className={`theme-option ${theme === 'dark' ? 'active' : ''}`}
                          >
                            <div className="theme-preview theme-dark"></div>
                            <span>Dark</span>
                          </button>
                        </div>
                      </div>

                      <div className="appearance-section">
                        <h3 className="text-base font-semibold mb-4">Language</h3>
                        <div className="input-group">
                          <select className="select">
                            <option value="en">English</option>
                            <option value="es">Español</option>
                            <option value="fr">Français</option>
                            <option value="de">Deutsch</option>
                          </select>
                        </div>
                      </div>

                      <div className="form-actions">
                        <Button>
                          <Save className="h-4 w-4 mr-2" />
                          Save Appearance
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
