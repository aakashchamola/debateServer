import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { MessageSquare, Users, Shield } from 'lucide-react';

import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/Card';
import type { RegisterRequest } from '@/types';
import { cn } from '@/utils';

const registerSchema = z
  .object({
    username: z.string().min(3, 'Username must be at least 3 characters'),
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    password_confirm: z.string(),
    role: z.enum(['STUDENT', 'MODERATOR']).default('STUDENT'),
  })
  .refine((data) => data.password === data.password_confirm, {
    message: "Passwords don't match",
    path: ['password_confirm'],
  });

export function RegisterPage() {
  const [isLoading, setIsLoading] = useState(false);
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    setValue,
    watch,
  } = useForm<RegisterRequest>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: 'STUDENT',
    },
  });

  const selectedRole = watch('role');

  const onSubmit = async (data: RegisterRequest) => {
    setIsLoading(true);
    try {
      await registerUser(data);
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Registration error:', error);
      if (error.response?.data) {
        const errorData = error.response.data;
        Object.keys(errorData).forEach((key) => {
          if (key === 'username' || key === 'email' || key === 'password') {
            setError(key, { message: errorData[key][0] });
          }
        });
      } else {
        setError('root', { message: 'An unknown error occurred. Please try again.' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
      <div className="w-full max-w-lg p-8 space-y-8">
        <div className="text-center">
          <MessageSquare className="mx-auto h-12 w-12 text-primary" />
          <h1 className="mt-6 text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-50">
            Create your DebateHub account
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Join the community and start debating.
          </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Sign Up</CardTitle>
            <CardDescription>
              Choose your role and fill in your details to get started.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label>Choose your role</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div
                    className={cn(
                      'p-4 rounded-lg border-2 cursor-pointer transition-all',
                      selectedRole === 'STUDENT' ? 'border-primary bg-primary/10' : 'hover:border-primary/50'
                    )}
                    onClick={() => setValue('role', 'STUDENT')}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <Users className="h-6 w-6 text-primary" />
                      <h3 className="font-semibold">Student</h3>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Participate in debates, vote, and build your reputation.
                    </p>
                  </div>
                  <div
                    className={cn(
                      'p-4 rounded-lg border-2 cursor-pointer transition-all',
                      selectedRole === 'MODERATOR' ? 'border-primary bg-primary/10' : 'hover:border-primary/50'
                    )}
                    onClick={() => setValue('role', 'MODERATOR')}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <Shield className="h-6 w-6 text-primary" />
                      <h3 className="font-semibold">Moderator</h3>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Create topics, manage sessions, and moderate discussions.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input id="username" {...register('username')} disabled={isLoading} />
                  {errors.username && <p className="text-sm text-red-500">{errors.username.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" {...register('email')} disabled={isLoading} />
                  {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" type="password" {...register('password')} disabled={isLoading} />
                  {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password_confirm">Confirm Password</Label>
                  <Input id="password_confirm" type="password" {...register('password_confirm')} disabled={isLoading} />
                  {errors.password_confirm && <p className="text-sm text-red-500">{errors.password_confirm.message}</p>}
                </div>
              </div>

              {errors.root && (
                <p className="text-sm text-red-500 text-center">{errors.root.message}</p>
              )}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Creating Account...' : 'Create Account'}
              </Button>
            </form>
          </CardContent>
        </Card>
        <div className="text-center text-sm text-gray-600 dark:text-gray-400">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-primary hover:underline">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
