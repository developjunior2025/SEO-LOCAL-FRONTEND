import { Navigate, useLocation } from 'react-router-dom';
import { useAppState } from '@/state/useAppState';
import { getDashboardPathForRole } from '@/state/authHelpers';

interface ProtectedClientRouteProps {
  children: React.ReactNode;
}

export default function ProtectedClientRoute({ children }: ProtectedClientRouteProps) {
  const { user, authLoading } = useAppState();
  const location = useLocation();

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f5f5]">
        <div className="w-12 h-12 rounded-full border-4 border-[#D32323]/20 border-t-[#D32323] animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to={`/login?returnTo=${encodeURIComponent(location.pathname + location.search)}`} replace />;
  }

  if (user.role !== 'client') {
    return <Navigate to={getDashboardPathForRole(user.role)} replace />;
  }

  return <>{children}</>;
}
