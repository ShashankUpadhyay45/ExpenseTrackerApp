import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sparkles } from 'lucide-react';

export default function AuthLayout() {
  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-surface-50 dark:bg-surface-900">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center text-primary-600 dark:text-primary-500">
          <Sparkles className="h-12 w-12" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-surface-900 dark:text-white">
          SpendSage
        </h2>
        <p className="mt-2 text-center text-sm text-surface-600 dark:text-surface-400">
          Your personal finance copilot
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 dark:bg-surface-950 dark:border dark:border-surface-800">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
