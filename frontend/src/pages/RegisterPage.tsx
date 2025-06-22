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
    <div className="w-full lg:grid lg:min-h-[100vh] lg:grid-cols-2 xl:min-h-[100vh]">
      <div className="flex items-center justify-center py-12">
        <div className="mx-auto grid w-[400px] gap-6">
          <div className="grid gap-2 text-center">
            <h1 className="text-3xl font-bold">Create an account</h1>
            <p className="text-balance text-muted-foreground">
              Enter your information to create an account
            </p>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                placeholder="Your username"
                {...register('username')}
                disabled={isLoading}
              />
              {errors.username && (
                <p className="text-sm text-red-500">{errors.username.message}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                {...register('email')}
                disabled={isLoading}
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email.message}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label>Role</Label>
              <div className="grid grid-cols-2 gap-4">
                <Button
                  type="button"
                  variant={selectedRole === 'STUDENT' ? 'default' : 'outline'}
                  onClick={() => setValue('role', 'STUDENT')}
                >
                  <Users className="mr-2 h-4 w-4" />
                  Student
                </Button>
                <Button
                  type="button"
                  variant={
                    selectedRole === 'MODERATOR' ? 'default' : 'outline'
                  }
                  onClick={() => setValue('role', 'MODERATOR')}
                >
                  <Shield className="mr-2 h-4 w-4" />
                  Moderator
                </Button>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                {...register('password')}
                disabled={isLoading}
              />
              {errors.password && (
                <p className="text-sm text-red-500">{errors.password.message}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password_confirm">Confirm Password</Label>
              <Input
                id="password_confirm"
                type="password"
                {...register('password_confirm')}
                disabled={isLoading}
              />
              {errors.password_confirm && (
                <p className="text-sm text-red-500">
                  {errors.password_confirm.message}
                </p>
              )}
            </div>
            {errors.root && (
              <p className="text-sm text-red-500 text-center">
                {errors.root.message}
              </p>
            )}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Creating account...' : 'Create account'}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            Already have an account?{' '}
            <Link to="/login" className="underline">
              Sign in
            </Link>
          </div>
        </div>
      </div>
      <div className="hidden bg-muted lg:flex lg:items-center lg:justify-center p-8">
        <div className="text-center">
            <MessageSquare className="mx-auto h-16 w-16 text-primary" />
          <h2 className="mt-6 text-3xl font-bold text-primary">
            Join the Conversation
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Engage in discussions that matter. Share your perspective.
          </p>
        </div>
      </div>
    </div>
  );
}
