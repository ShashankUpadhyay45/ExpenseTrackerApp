import os

base_dir = r"c:\Users\ASUS\Desktop\Projects\SpendSage\client\src"

dirs = [
    "api", "types", "schemas", "hooks", "store", "utils", "layouts",
    "components/layout", "components/ui",
    "pages/auth",
    "features/transactions", "features/budgets", "features/bills",
    "features/goals", "features/accounts", "features/ai",
    "features/import", "features/search", "features/notifications"
]

for d in dirs:
    os.makedirs(os.path.join(base_dir, d), exist_ok=True)

# cn.ts
with open(os.path.join(base_dir, "utils", "cn.ts"), "w", encoding="utf-8") as f:
    f.write("""import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
""")

# api client
with open(os.path.join(base_dir, "api", "client.ts"), "w", encoding="utf-8") as f:
    f.write("""import axios from 'axios';
import { useAuthStore } from '../store/authStore';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const response = await axios.post('/api/auth/refresh-token');
        const { token } = response.data;
        useAuthStore.getState().setToken(token);
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        useAuthStore.getState().logout();
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);
""")

print("Setup script completed.")
