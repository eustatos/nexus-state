import React from 'react';
import { useAtomValue } from '@nexus-state/react';
import { StatsCard } from './StatsCard';
import { statsAtom, totalRevenueAtom } from '../store';

export function DashboardStats() {
  const stats = useAtomValue(statsAtom);
  const totalRevenue = useAtomValue(totalRevenueAtom);

  return (
    <div style={styles.grid}>
      <StatsCard
        title="Total Users"
        value={stats.users.toLocaleString()}
        change={5.2}
        icon="👥"
      />
      <StatsCard
        title="Revenue"
        value={`$${totalRevenue}`}
        change={12.3}
        icon="💰"
      />
      <StatsCard
        title="Orders"
        value={stats.orders.toLocaleString()}
        change={-2.1}
        icon="📦"
      />
      <StatsCard
        title="Conversion"
        value={`${stats.conversion}%`}
        change={0.8}
        icon="📈"
      />
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '20px',
  },
};
