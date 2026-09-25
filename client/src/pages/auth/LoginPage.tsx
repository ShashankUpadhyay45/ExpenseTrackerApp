import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuthStore } from '@/store/authStore';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      login({ id: '1', name: 'Demo User', email: 'user@example.com' }, 'fake-jwt-token');
      navigate('/dashboard');
    }, 1000);
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <Input type="email" placeholder="you@example.com" required />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Password</label>
          <Input type="password" placeholder="••••••••" required />
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input
              id="remember-me"
              name="remember-me"
              type="checkbox"
              className="h-4 w-4 rounded border-surface-300 text-primary-600 focus:ring-primary-500"
            />
            <label htmlFor="remember-me" className="ml-2 block text-sm text-surface-900 dark:text-surface-100">
              Remember me
            </label>
          </div>

          <div className="text-sm">
            <Link to="/forgot-password" className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400">
              Forgot your password?
            </Link>
          </div>
        </div>

        <Button type="submit" className="w-full" isLoading={loading}>
          Sign in
        </Button>
      </form>
      <div className="mt-6 text-center text-sm">
        <span className="text-surface-500">Don't have an account? </span>
        <Link to="/register" className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400">
          Sign up
        </Link>
      </div>
    </div>
  );
}
