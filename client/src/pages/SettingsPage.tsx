import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userApi, categoriesApi, authApi, importsApi } from '../api/endpoints';
import { useAuthStore } from '../store/authStore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Tabs } from '../components/ui/Tabs';
import { User, Shield, Sliders, Tags, Moon, Sun, Trash2, Plus, Upload } from 'lucide-react';
import { toast } from 'sonner';

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const { user, setUser, logout } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'profile' | 'preferences' | 'security' | 'categories' | 'data'>('profile');

  // Profile Form state
  const [profileForm, setProfileForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || ''
  });

  // Password Form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Category state
  const [newCatName, setNewCatName] = useState('');
  const [newCatType, setNewCatType] = useState<'expense' | 'income'>('expense');

  // Preferences query
  const { data: prefRes } = useQuery({
    queryKey: ['preferences'],
    queryFn: () => userApi.getPreferences()
  });

  const { data: categoriesRes } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.getAll()
  });

  const categories = categoriesRes?.data?.data || [];
  const preferences = prefRes?.data?.data || { currency: 'USD', locale: 'en-US', theme: 'light' };

  const [theme, setTheme] = useState(preferences.theme || 'light');
  const [currency, setCurrency] = useState(preferences.currency || 'USD');

  useEffect(() => {
    if (prefRes?.data?.data) {
      setTheme(prefRes.data.data.theme || 'light');
      setCurrency(prefRes.data.data.currency || 'USD');
    }
  }, [prefRes]);

  // Mutations
  const updateProfileMutation = useMutation({
    mutationFn: (data: any) => userApi.updateProfile(data),
    onSuccess: (res) => {
      setUser(res.data.data);
      toast.success('Profile updated successfully');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to update profile')
  });

  const changePasswordMutation = useMutation({
    mutationFn: (data: any) => authApi.changePassword(data),
    onSuccess: () => {
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      toast.success('Password changed successfully');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to change password')
  });

  const updatePreferencesMutation = useMutation({
    mutationFn: (data: any) => userApi.updatePreferences(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['preferences'] });
      toast.success('Preferences saved');
    }
  });

  const addCategoryMutation = useMutation({
    mutationFn: (data: any) => categoriesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setNewCatName('');
      toast.success('Category added');
    }
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: (id: string) => categoriesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Category removed');
    }
  });

  const deleteAccountMutation = useMutation({
    mutationFn: () => userApi.deleteAccount(),
    onSuccess: () => {
      logout();
      window.location.href = '/login';
    }
  });

  const toggleTheme = (newTheme: string) => {
    setTheme(newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    updatePreferencesMutation.mutate({ theme: newTheme, currency });
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      return toast.error('New passwords do not match');
    }
    if (passwordForm.newPassword.length < 8) {
      return toast.error('Password must be at least 8 characters long');
    }
    changePasswordMutation.mutate({
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword
    });
  };

  const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      toast.info('Processing CSV import...');
      await importsApi.uploadCSV(file);
      queryClient.invalidateQueries();
      toast.success('CSV imported successfully!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to import CSV');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-surface-900 dark:text-white">Settings & Preferences</h1>
        <p className="text-sm text-surface-500">Manage your profile, display preferences, categories, and security.</p>
      </div>

      {/* Tabs */}
      <Tabs
        tabs={[
          { id: 'profile', label: 'Profile' },
          { id: 'preferences', label: 'Display & Currency' },
          { id: 'security', label: 'Security' },
          { id: 'categories', label: 'Categories' },
          { id: 'data', label: 'Data & Privacy' }
        ]}
        activeTab={activeTab}
        onChange={(id: any) => setActiveTab(id)}
      />

      {/* Tab 1: Profile */}
      {activeTab === 'profile' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <User className="w-5 h-5 text-primary-600" /> Personal Profile
            </CardTitle>
            <CardDescription>Update your personal information associated with your account.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={(e) => { e.preventDefault(); updateProfileMutation.mutate(profileForm); }} className="space-y-4 max-w-md">
              <Input
                label="First Name"
                value={profileForm.firstName}
                onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
                required
              />
              <Input
                label="Last Name"
                value={profileForm.lastName}
                onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
                required
              />
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-surface-500 mb-1.5">Email Address</label>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full h-10 px-3 rounded-lg border border-surface-200 dark:border-surface-700 bg-surface-100 dark:bg-surface-800 text-surface-400 text-sm cursor-not-allowed"
                />
                <span className="text-[11px] text-surface-400 mt-1 block">Email is permanently bound to your user vault.</span>
              </div>
              <Button type="submit" disabled={updateProfileMutation.isPending}>Save Profile</Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Tab 2: Preferences */}
      {activeTab === 'preferences' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Sliders className="w-5 h-5 text-indigo-500" /> Display & Localization
            </CardTitle>
            <CardDescription>Customize currency formatting and visual theme.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 max-w-md">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-surface-500 mb-2">Display Theme</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => toggleTheme('light')}
                  className={`p-3 rounded-xl border flex items-center justify-center gap-2 text-sm font-semibold transition-all ${
                    theme === 'light'
                      ? 'border-primary-600 bg-primary-50 text-primary-700 dark:bg-primary-950/40'
                      : 'border-surface-200 dark:border-surface-700 text-surface-600'
                  }`}
                >
                  <Sun className="w-4 h-4 text-amber-500" /> Light Mode
                </button>
                <button
                  type="button"
                  onClick={() => toggleTheme('dark')}
                  className={`p-3 rounded-xl border flex items-center justify-center gap-2 text-sm font-semibold transition-all ${
                    theme === 'dark'
                      ? 'border-primary-600 bg-primary-50 text-primary-700 dark:bg-primary-950/40'
                      : 'border-surface-200 dark:border-surface-700 text-surface-600'
                  }`}
                >
                  <Moon className="w-4 h-4 text-indigo-400" /> Dark Mode
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-surface-500 mb-1.5">Primary Currency</label>
              <select
                value={currency}
                onChange={(e) => {
                  setCurrency(e.target.value);
                  updatePreferencesMutation.mutate({ currency: e.target.value, theme });
                }}
                className="w-full h-10 px-3 rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="USD">USD ($) - US Dollar</option>
                <option value="INR">INR (₹) - Indian Rupee</option>
                <option value="EUR">EUR (€) - Euro</option>
                <option value="GBP">GBP (£) - British Pound</option>
                <option value="CAD">CAD ($) - Canadian Dollar</option>
                <option value="AUD">AUD ($) - Australian Dollar</option>
              </select>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tab 3: Security */}
      {activeTab === 'security' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="w-5 h-5 text-emerald-500" /> Security & Password
            </CardTitle>
            <CardDescription>Ensure your financial vault stays protected with a strong passphrase.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-md">
              <Input
                label="Current Password"
                type="password"
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                required
              />
              <Input
                label="New Password"
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                required
              />
              <Input
                label="Confirm New Password"
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                required
              />
              <Button type="submit" disabled={changePasswordMutation.isPending}>Update Password</Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Tab 4: Categories */}
      {activeTab === 'categories' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Tags className="w-5 h-5 text-amber-500" /> Custom Spending & Income Categories
            </CardTitle>
            <CardDescription>Manage the tags and buckets used for categorizing your transactions.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (newCatName.trim()) {
                  addCategoryMutation.mutate({ name: newCatName.trim(), type: newCatType });
                }
              }}
              className="flex gap-3 max-w-md"
            >
              <input
                type="text"
                placeholder="New Category Name..."
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                className="flex-1 h-10 px-3 rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
              <select
                value={newCatType}
                onChange={(e) => setNewCatType(e.target.value as any)}
                className="h-10 px-3 rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-xs"
              >
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
              <Button type="submit" disabled={addCategoryMutation.isPending} className="gap-1">
                <Plus className="w-4 h-4" /> Add
              </Button>
            </form>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2">
              {categories.map((c: any) => (
                <div
                  key={c._id}
                  className="flex items-center justify-between p-2.5 rounded-lg border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 text-sm"
                >
                  <div>
                    <span className="font-medium text-surface-900 dark:text-white">{c.name}</span>
                    <span className="text-[10px] text-surface-400 capitalize block">{c.type}</span>
                  </div>
                  <button
                    onClick={() => deleteCategoryMutation.mutate(c._id)}
                    className="p-1 text-surface-400 hover:text-rose-500 rounded"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tab 5: Data & Privacy */}
      {activeTab === 'data' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Upload className="w-5 h-5 text-indigo-500" /> Import External Data
              </CardTitle>
              <CardDescription>Bulk upload bank statements or spreadsheets (.csv format).</CardDescription>
            </CardHeader>
            <CardContent>
              <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-sm font-semibold cursor-pointer hover:bg-surface-50">
                <Upload className="w-4 h-4 text-primary-600" /> Select CSV Statement File
                <input type="file" accept=".csv" onChange={handleCSVUpload} className="hidden" />
              </label>
              <p className="text-xs text-surface-400 mt-2">
                Supported columns: Date, Description, Category, Amount, Type. Duplicates are automatically flagged.
              </p>
            </CardContent>
          </Card>

          <Card className="border-rose-200 dark:border-rose-900/50">
            <CardHeader>
              <CardTitle className="text-base text-rose-600 flex items-center gap-2">
                <Trash2 className="w-5 h-5" /> Danger Zone • Permanent Account Deletion
              </CardTitle>
              <CardDescription>
                Irrevocably deletes your user profile, financial records, linked accounts, transactions, and budgets.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="danger"
                onClick={() => {
                  if (confirm("WARNING: This will permanently delete your account and all associated financial records. This action CANNOT be undone! Type OK to proceed.")) {
                    deleteAccountMutation.mutate();
                  }
                }}
              >
                Permanently Delete My Account
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
