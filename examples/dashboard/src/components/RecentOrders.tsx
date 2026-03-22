import React from 'react';
import { useAtomValue } from '@nexus-state/react';
import { recentOrdersAtom, type Order } from '../store';

export function RecentOrders() {
  const orders = useAtomValue(recentOrdersAtom);

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'completed':
        return { backgroundColor: '#e8f5e9', color: '#2e7d32' };
      case 'processing':
        return { backgroundColor: '#e3f2fd', color: '#1976d2' };
      case 'pending':
        return { backgroundColor: '#fff3e0', color: '#f57c00' };
      case 'cancelled':
        return { backgroundColor: '#ffebee', color: '#dc3545' };
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h3 style={styles.title}>Recent Orders</h3>
      </div>
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>Order ID</th>
            <th style={styles.th}>Customer</th>
            <th style={styles.th}>Amount</th>
            <th style={styles.th}>Status</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id} style={order.isNew ? styles.newRow : styles.row}>
              <td style={styles.td}>#{order.id.slice(-6)}</td>
              <td style={styles.td}>{order.customer}</td>
              <td style={styles.td}>${order.amount.toFixed(2)}</td>
              <td style={styles.td}>
                <span style={{ ...styles.badge, ...getStatusColor(order.status) }}>
                  {order.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  header: {
    marginBottom: '16px',
  },
  title: {
    margin: 0,
    fontSize: '18px',
    fontWeight: 600,
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    textAlign: 'left',
    padding: '12px',
    borderBottom: '2px solid #e0e0e0',
    fontSize: '14px',
    color: '#666',
    fontWeight: 600,
  },
  row: {
    borderBottom: '1px solid #e0e0e0',
  },
  newRow: {
    borderBottom: '1px solid #e0e0e0',
    backgroundColor: '#e8f5e9',
  },
  td: {
    padding: '12px',
    fontSize: '14px',
  },
  badge: {
    display: 'inline-block',
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 500,
  },
};
