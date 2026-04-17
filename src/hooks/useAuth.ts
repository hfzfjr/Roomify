import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData {
  nama: string;
  email: string;
  password: string;
}

export function useAuth() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const login = async (credentials: LoginCredentials) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Login gagal.');
      }

      localStorage.setItem('token', 'roomify-session');
      localStorage.setItem('user', JSON.stringify(result.user));
      
      // Redirect berdasarkan role
      const role = result.user.role;
      const dashboardMap: { [key: string]: string } = {
        'customer': '/customer/dashboard',
        'owner': '/owner/dashboard',
        'admin': '/admin/dashboard',
      };
      
      const redirectPath = dashboardMap[role] || '/customer/dashboard';
      router.push(redirectPath);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Login gagal.',
      };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterData) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Pendaftaran gagal.');
      }

      localStorage.setItem('token', 'roomify-session');
      router.push('/customer/dashboard');
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Pendaftaran gagal.',
      };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/auth/login');
  };

  return { login, register, logout, isLoading };
}