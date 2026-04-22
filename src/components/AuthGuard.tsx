import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  allowedRoles?: string[];
}

export const AuthGuard = ({ children, requireAuth = true, allowedRoles }: AuthGuardProps) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (loading) return;
    if (requireAuth && !user) {
      navigate('/auth');
      return;
    }
    if (!requireAuth && user) {
      navigate('/');
      return;
    }
    if (requireAuth && user && allowedRoles && !allowedRoles.includes(user.role)) {
      toast({
        title: 'Akses Ditolak',
        description: 'Anda tidak memiliki izin untuk mengakses halaman ini',
        variant: 'destructive',
      });
      navigate('/dashboard');
    }
  }, [user, loading, navigate, requireAuth, allowedRoles, toast]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-xl text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (requireAuth && !user) return null;
  if (!requireAuth && user) return null;
  if (requireAuth && user && allowedRoles && !allowedRoles.includes(user.role)) return null;

  return <>{children}</>;
};
