import { Navigate, useLocation } from 'react-router-dom';
import { useAppState } from '@/state/useAppState';
import { getDashboardPathForRole } from '@/state/authHelpers';

interface ProtectedClientRouteProps {
  children: React.ReactNode;
}

export default function ProtectedClientRoute({ children }: ProtectedClientRouteProps) {
  const { user } = useAppState();
  const location = useLocation();

  if (!user) {
    return <Navigate to={`/login?returnTo=${encodeURIComponent(location.pathname + location.search)}`} replace />;
  }

  if (user.role !== 'client') {
    return <Navigate to={getDashboardPathForRole(user.role)} replace />;
  }

  return <>{children}</>;
}
