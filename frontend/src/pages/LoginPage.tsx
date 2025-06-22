import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { MessageSquare, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button, Input, Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui';
import type { LoginRequest } from '@/types';

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

export function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<LoginRequest>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginRequest) => {
    try {
      setIsLoading(true);
      await login(data);
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Login error:', error);
      if (error.response?.status === 401) {
        setError('root', { message: 'Invalid username or password' });
      } else {
        setError('root', { message: 'An error occurred. Please try again.' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <div className="auth-brand">
            <div className="auth-logo">
              <MessageSquare className="h-12 w-12" />
            </div>
            <h1 className="auth-title">Welcome Back</h1>
            <p className="auth-subtitle">
              Sign in to continue to DebateHub
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
            <CardDescription>
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="form-stack">
              <Input
                label="Username"
                type="text"
                autoComplete="username"
                placeholder="Enter your username"
                error={errors.username?.message}
                {...register('username')}
              />

              <div className="input-group">
                <Input
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  error={errors.password?.message}
                  {...register('password')}
                />
                <button
                  type="button"
                  className="input-action-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>

              {errors.root && (
                <div className="alert alert-error">
                  <p>{errors.root.message}</p>
                </div>
              )}

              <div className="flex items-center justify-between">
                <Link
                  to="/forgot-password"
                  className="link link-sm"
                >
                  Forgot your password?
                </Link>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full"
                isLoading={isLoading}
                disabled={isLoading}
              >
                {isLoading ? 'Signing in...' : 'Sign in'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="auth-footer">
          <p className="text-center text-secondary">
            Don't have an account?{' '}
            <Link to="/register" className="link">
              Create one here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
