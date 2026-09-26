import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { authApi } from '../../api/endpoints';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { ArrowLeft, CheckCircle2, KeyRound } from 'lucide-react';
import { toast } from 'sonner';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const mutation = useMutation({
    mutationFn: (emailStr: string) => authApi.forgotPassword(emailStr),
    onSuccess: () => {
      setSubmitted(true);
      toast.success('Reset email requested');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Error requesting reset');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    mutation.mutate(email);
  };

  if (submitted) {
    return (
      <div className="text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-surface-900 dark:text-white">Check Your Email</h2>
        <p className="text-sm text-surface-500 max-w-xs mx-auto">
          If an account exists for <strong>{email}</strong>, we have sent instructions to reset your password.
        </p>
        <div className="pt-4">
          <Link to="/login" className="inline-flex items-center gap-2 text-sm font-semibold text-primary-600 hover:text-primary-700">
            <ArrowLeft className="w-4 h-4" /> Back to Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-1">
        <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center mx-auto mb-2">
          <KeyRound className="w-5 h-5" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-surface-900 dark:text-white">Forgot Password?</h1>
        <p className="text-sm text-surface-500">Enter your registered email address to receive password reset instructions.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email Address"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <Button type="submit" className="w-full" disabled={mutation.isPending}>
          {mutation.isPending ? 'Sending...' : 'Send Reset Instructions'}
        </Button>
      </form>

      <div className="text-center pt-2">
        <Link to="/login" className="inline-flex items-center gap-1.5 text-xs font-semibold text-surface-500 hover:text-surface-900 dark:hover:text-white">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
        </Link>
      </div>
    </div>
  );
}
