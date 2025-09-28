import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Smartphone, Shield, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import GlassButton from '../components/ui/GlassButton';
import GlassCard from '../components/ui/GlassCard';
import { PageErrorWrapper } from '../components/PageErrorWrapper';
import { useErrorHandler } from '../../../hooks/useErrorHandler';


const LoginPage: React.FC = () => {
  // Add state for email, default to recent email from localStorage
  const [email, setEmail] = useState(() => localStorage.getItem('recent_login_email') || '');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login, error, clearError, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();

  // Error handling
  const { handleError, withErrorHandling } = useErrorHandler({
    maxRetries: 3,
    showToast: true,
    logToConsole: true
  });

  // Helper function to get the last visited page from navigation history
  const getLastVisitedPage = (): string => {
    console.log('🔍 LoginPage: Determining redirect destination...');
    
    // First check if there's a specific post-login redirect set
    const postLoginRedirect = localStorage.getItem('postLoginRedirect');
    if (postLoginRedirect) {
      console.log('✅ LoginPage: Found postLoginRedirect:', postLoginRedirect);
      localStorage.removeItem('postLoginRedirect');
      return postLoginRedirect;
    }

    // Then check navigation history for the last visited page
    const savedHistory = localStorage.getItem('navigationHistory');
    if (savedHistory) {
      try {
        const history: string[] = JSON.parse(savedHistory);
        console.log('📚 LoginPage: Navigation history found:', history);
        
        // Get the last page from history (excluding login page)
        const lastPage = history[history.length - 1];
        if (lastPage && lastPage !== '/login' && lastPage !== '/') {
          console.log('✅ LoginPage: Using last page from history:', lastPage);
          return lastPage;
        }
        // If last page was login or root, try the second to last page
        if (history.length > 1) {
          const secondLastPage = history[history.length - 2];
          if (secondLastPage && secondLastPage !== '/login' && secondLastPage !== '/') {
            console.log('✅ LoginPage: Using second to last page from history:', secondLastPage);
            return secondLastPage;
          }
        }
      } catch (error) {
        console.error('❌ LoginPage: Error parsing navigation history:', error);
      }
    }

    // Fallback to dashboard if no valid history found
    console.log('🔄 LoginPage: No valid history found, falling back to dashboard');
    return '/dashboard';
  };

  // Autofill from localStorage if available
  useEffect(() => {
    const loadSavedCredentials = async () => {
      await withErrorHandling(async () => {
        const lastEmail = localStorage.getItem('last_login_email') || '';
        const lastPassword = localStorage.getItem('last_login_password') || '';
        if (lastEmail) setEmail(lastEmail);
        if (lastPassword) setPassword(lastPassword);
      }, 'Loading saved credentials');
    };

    loadSavedCredentials();
  }, [withErrorHandling]);

  // Redirect to last visited page if already authenticated (with debouncing)
  useEffect(() => {
    if (!loading && isAuthenticated) {
      // Add a small delay to prevent rapid navigation changes
      const redirectTimer = setTimeout(() => {
        const redirectPath = getLastVisitedPage();
        console.log('🔄 LoginPage: Redirecting to:', redirectPath);
        navigate(redirectPath);
      }, 100); // 100ms delay to prevent rapid redirects
      
      return () => clearTimeout(redirectTimer);
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
    
    if (!email.trim() || !password.trim()) {
      handleError(new Error('Please enter both email and password'), 'Form validation');
      return;
    }
    
    await withErrorHandling(async () => {
      setIsLoading(true);
      clearError();
      
      const success = await login(email, password);
      
      if (success) {
        // Save last used email and password for autofill
        localStorage.setItem('last_login_email', email);
        localStorage.setItem('last_login_password', password);
        // On successful login, save email to localStorage
        localStorage.setItem('recent_login_email', email);
        

        
        const redirectPath = getLastVisitedPage();
        navigate(redirectPath);
      } else {
        throw new Error('Login failed. Please check your credentials.');
      }
    }, 'Login process');
    
    setIsLoading(false);
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setEmail(e.target.value);
    } catch (error) {
      handleError(error as Error, 'Email input');
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setPassword(e.target.value);
    } catch (error) {
      handleError(error as Error, 'Password input');
    }
  };

  const togglePasswordVisibility = () => {
    try {
      setShowPassword(!showPassword);
    } catch (error) {
      handleError(error as Error, 'Password visibility toggle');
    }
  };

  return (
    <PageErrorWrapper pageName="Login" showDetails={false}>
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
                  onChange={handleEmailChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="Enter your email"
                  required
                  disabled={isLoading}
                />
              </div>
              
              <div>
                <label htmlFor="password" className="block text-gray-700 mb-2 font-medium">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={handlePasswordChange}
                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    placeholder="Enter your password"
                    required
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>
              
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}
              
              <GlassButton
                type="submit"
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3"
                disabled={isLoading}
                loading={isLoading}
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </GlassButton>
            </form>
            
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500">
                Need help? Contact your administrator
              </p>
            </div>
          </GlassCard>
        </div>
      </div>
    </PageErrorWrapper>
  );
};

export default LoginPage;