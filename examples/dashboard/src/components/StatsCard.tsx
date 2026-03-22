import React from 'react';

interface StatsCardProps {
  title: string;
  value: string | number;
  change: number;
  icon?: string;
}

export function StatsCard({ title, value, change, icon }: StatsCardProps) {
  const isPositive = change >= 0;

  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <span style={styles.icon}>{icon}</span>
        <span style={styles.title}>{title}</span>
      </div>
      <div style={styles.body}>
        <span style={styles.value}>{value}</span>
        <span style={isPositive ? styles.changePositive : styles.changeNegative}>
          {isPositive ? '↑' : '↓'} {Math.abs(change)}%
        </span>
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  card: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '16px',
  },
  icon: {
    fontSize: '24px',
  },
  title: {
    fontSize: '14px',
    color: '#666',
    fontWeight: 500,
  },
  body: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  value: {
    fontSize: '28px',
    fontWeight: 700,
    color: '#333',
  },
  changePositive: {
    fontSize: '14px',
    color: '#2e7d32',
    fontWeight: 600,
  },
  changeNegative: {
    fontSize: '14px',
    color: '#dc3545',
    fontWeight: 600,
  },
};
