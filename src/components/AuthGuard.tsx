
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
}

export const AuthGuard = ({ children, requireAuth = true }: AuthGuardProps) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      if (requireAuth && !user) {
        // User is not authenticated but auth is required
        navigate('/auth');
      } else if (!requireAuth && user) {
        // User is authenticated but trying to access auth page
        navigate('/');
      }
    }
  }, [user, loading, navigate, requireAuth]);

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-xl text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // If requiring auth but no user, don't render (redirect will happen)
  if (requireAuth && !user) {
    return null;
  }

  // If not requiring auth but user exists, don't render (redirect will happen)
  if (!requireAuth && user) {
    return null;
  }

  return <>{children}</>;
};
