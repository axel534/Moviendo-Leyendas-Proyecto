import { useAuth } from '../../auth/AuthContext';
import DashboardDeportista from './DashboardDeportista';
import DashboardSponsor from './DashboardSponsor';

export default function DashboardPage() {
  const { user } = useAuth();
  if (!user) return null;
  if (user.tipo === 'atleta') return <DashboardDeportista user={user} />;
  return <DashboardSponsor user={user} />;
}
