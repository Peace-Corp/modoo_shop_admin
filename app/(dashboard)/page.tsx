import { fetchDashboardStats } from './actions';
import DashboardClient from '@/components/dashboard/DashboardClient';

export default async function DashboardPage() {
  const initialStats = await fetchDashboardStats();

  return <DashboardClient initialStats={initialStats} />;
}
