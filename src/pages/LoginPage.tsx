import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Smartphone, Shield, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import GlassButton from '../components/ui/GlassButton';
import GlassCard from '../components/ui/GlassCard';
import { whatsappService } from '../services/whatsappService';

const LoginPage: React.FC = () => {
  // Add state for email, default to recent email from localStorage
  const [email, setEmail] = useState(() => localStorage.getItem('recent_login_email') || '');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, error, clearError, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();

  // Autofill from localStorage if available
  useEffect(() => {
    const lastEmail = localStorage.getItem('last_login_email') || '';
    const lastPassword = localStorage.getItem('last_login_password') || '';
    if (lastEmail) setEmail(lastEmail);
    if (lastPassword) setPassword(lastPassword);
  }, []);

  // Redirect to last visited page if already authenticated
  useEffect(() => {
    if (!loading && isAuthenticated) {
      const redirectPath = localStorage.getItem('postLoginRedirect') || '/dashboard';
      localStorage.removeItem('postLoginRedirect');
      navigate(redirectPath);
    }
  }, [isAuthenticated, loading, navigate]);

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center p-4" style={{ backgroundColor: 'transparent' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Don't render login form if already authenticated
  if (isAuthenticated) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    
    if (!email.trim() || !password.trim()) {
      return;
    }
    
    setIsLoading(true);
    const success = await login(email, password);
    setIsLoading(false);
    
    if (success) {
      // Save last used email and password for autofill
      localStorage.setItem('last_login_email', email);
      localStorage.setItem('last_login_password', password);
      // On successful login, save email to localStorage
      localStorage.setItem('recent_login_email', email);
      // Send WhatsApp message to your number
      whatsappService.sendMessage('255746605561@c.us', `Login successful: ${email}`, 'text');
      const redirectPath = localStorage.getItem('postLoginRedirect') || '/dashboard';
      localStorage.removeItem('postLoginRedirect');
      navigate(redirectPath);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4" style={{ backgroundColor: 'transparent' }}>
      <div className="relative max-w-md w-full">
        <GlassCard className="backdrop-blur-xl bg-white/60 p-8">
          <div className="flex justify-center mb-6">
            <div className="rounded-full bg-blue-500/80 p-3 backdrop-blur-sm">
              <Smartphone className="h-10 w-10 text-white" />
            </div>
          </div>
          
          <h1 className="text-2xl font-bold text-center text-gray-900 mb-2">
            Repair Shop Management
          </h1>
          <p className="text-center text-gray-600 mb-8">
            Sign in with your email and password
          </p>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-gray-700 mb-2 font-medium">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full py-3 px-4 bg-white/50 backdrop-blur-md border border-white/40 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all duration-300"
                placeholder="Enter your email"
                required
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-gray-700 mb-2 font-medium">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full py-3 px-4 pr-12 bg-white/50 backdrop-blur-md border border-white/40 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all duration-300"
                  placeholder="Enter your password"
                  required
                />
              </div>
            </div>
            
            {error && (
              <div className="p-3 bg-rose-100/50 text-rose-700 rounded-lg border border-rose-200">
                {error}
              </div>
            )}
            
            <GlassButton
              type="submit"
              size="lg"
              className="w-full"
              icon={<Shield className="h-5 w-5" />}
              disabled={isLoading}
            >
              {isLoading ? 'Signing In...' : 'Sign In'}
            </GlassButton>
          </form>
        </GlassCard>
      </div>
    </div>
  );
};

export default LoginPage;