import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { MessageSquare, Eye, EyeOff, ArrowRight, Users, Shield } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button, Input, Card, CardContent } from '@/components/ui';
import type { RegisterRequest } from '@/types';

const registerSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  password_confirm: z.string(),
  role: z.enum(['STUDENT', 'MODERATOR']).default('STUDENT'),
}).refine((data) => data.password === data.password_confirm, {
  message: "Passwords don't match",
  path: ["password_confirm"],
});

export function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'STUDENT' | 'MODERATOR'>('STUDENT');
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    setValue,
  } = useForm<RegisterRequest>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: 'STUDENT',
    },
  });

  const onSubmit = async (data: RegisterRequest) => {
    try {
      setIsLoading(true);
      await registerUser(data);
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Registration error:', error);
      if (error.response?.data) {
        const errorData = error.response.data;
        if (errorData.username) {
          setError('username', { message: errorData.username[0] });
        }
        if (errorData.email) {
          setError('email', { message: errorData.email[0] });
        }
        if (errorData.password) {
          setError('password', { message: errorData.password[0] });
        }
      } else {
        setError('root', { message: 'Registration failed. Please try again.' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleSelect = (role: 'STUDENT' | 'MODERATOR') => {
    setSelectedRole(role);
    setValue('role', role);
  };

  return (
    <div className="auth-layout">
      {/* Left Panel - Branding */}
      <div className="auth-panel-left">
        <div className="auth-branding">
          <div className="auth-logo">
            <div className="w-12 h-12 bg-primary-600 rounded-xl flex items-center justify-center">
              <MessageSquare className="h-7 w-7 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-primary">DebateHub</h1>
          </div>
          
          <div className="auth-hero">
            <h2 className="text-4xl font-bold text-primary mb-4">
              Join the conversation
            </h2>
            <p className="text-lg text-secondary-muted">
              Create your account and start engaging in thoughtful debates 
              with like-minded individuals from around the world.
            </p>
          </div>

          <div className="auth-features">
            <div className="feature-item">
              <div className="feature-icon">🌟</div>
              <span>Build your reputation</span>
            </div>
            <div className="feature-item">
              <div className="feature-icon">🧠</div>
              <span>Sharpen critical thinking</span>
            </div>
            <div className="feature-item">
              <div className="feature-icon">🤝</div>
              <span>Connect with peers</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Register Form */}
      <div className="auth-panel-right">
        <div className="auth-form-container">
          <div className="auth-form-header">
            <h2 className="text-2xl font-bold text-primary">Create account</h2>
            <p className="text-secondary-muted">
              Fill in your details to get started
            </p>
          </div>

          <Card className="auth-card">
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Role Selection */}
                <div className="role-selector">
                  <label className="input-label">I want to join as</label>
                  <div className="role-options">
                    <button
                      type="button"
                      className={`role-option ${selectedRole === 'STUDENT' ? 'selected' : ''}`}
                      onClick={() => handleRoleSelect('STUDENT')}
                    >
                      <Users className="h-5 w-5" />
                      <div>
                        <div className="role-title">Student</div>
                        <div className="role-desc">Participate in debates and learn</div>
                      </div>
                    </button>
                    <button
                      type="button"
                      className={`role-option ${selectedRole === 'MODERATOR' ? 'selected' : ''}`}
                      onClick={() => handleRoleSelect('MODERATOR')}
                    >
                      <Shield className="h-5 w-5" />
                      <div>
                        <div className="role-title">Moderator</div>
                        <div className="role-desc">Facilitate and guide discussions</div>
                      </div>
                    </button>
                  </div>
                  <input type="hidden" {...register('role')} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Username"
                    type="text"
                    autoComplete="username"
                    placeholder="Choose a username"
                    error={errors.username?.message}
                    {...register('username')}
                  />

                  <Input
                    label="Email"
                    type="email"
                    autoComplete="email"
                    placeholder="your@email.com"
                    error={errors.email?.message}
                    {...register('email')}
                  />
                </div>

                <div className="relative">
                  <Input
                    label="Password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="Create a strong password"
                    error={errors.password?.message}
                    {...register('password')}
                  />
                  <button
                    type="button"
                    className="input-addon-right"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>

                <div className="relative">
                  <Input
                    label="Confirm Password"
                    type={showPasswordConfirm ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="Confirm your password"
                    error={errors.password_confirm?.message}
                    {...register('password_confirm')}
                  />
                  <button
                    type="button"
                    className="input-addon-right"
                    onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                    tabIndex={-1}
                  >
                    {showPasswordConfirm ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>

                {errors.root && (
                  <div className="alert alert-error">
                    {errors.root.message}
                  </div>
                )}

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-full"
                  isLoading={isLoading}
                >
                  {isLoading ? 'Creating account...' : (
                    <>
                      Create account
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>

                <div className="auth-divider">
                  <span>Already have an account?</span>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  className="w-full"
                  onClick={() => navigate('/login')}
                >
                  Sign in instead
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="auth-footer">
            <p className="text-sm text-secondary-muted text-center">
              By creating an account, you agree to our{' '}
              <Link to="/terms" className="link">Terms of Service</Link>
              {' '}and{' '}
              <Link to="/privacy" className="link">Privacy Policy</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
