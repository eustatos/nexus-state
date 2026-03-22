import React from 'react';
import { useAtomValue } from '@nexus-state/react';
import { notificationsAtom, hasNewOrdersAtom } from '../store';

export function Notifications() {
  const notifications = useAtomValue(notificationsAtom);
  const hasNewOrders = useAtomValue(hasNewOrdersAtom);

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return '✅';
      case 'warning':
        return '⚠️';
      case 'error':
        return '❌';
      default:
        return 'ℹ️';
    }
  };

  const formatTime = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={styles.icon}>🔔</span>
        <span style={styles.title}>Notifications</span>
        {hasNewOrders && <span style={styles.badge}>New!</span>}
      </div>
      <div style={styles.list}>
        {notifications.length === 0 ? (
          <p style={styles.empty}>No notifications</p>
        ) : (
          notifications.map((n) => (
            <div key={n.id} style={styles.item}>
              <span style={styles.itemIcon}>{getIcon(n.type)}</span>
              <div style={styles.itemContent}>
                <span style={styles.itemMessage}>{n.message}</span>
                <span style={styles.itemTime}>{formatTime(n.timestamp)}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    position: 'relative',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '16px',
  },
  icon: {
    fontSize: '20px',
  },
  title: {
    fontSize: '16px',
    fontWeight: 600,
  },
  badge: {
    backgroundColor: '#dc3545',
    color: '#fff',
    padding: '2px 8px',
    borderRadius: '10px',
    fontSize: '11px',
    fontWeight: 600,
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  empty: {
    color: '#999',
    textAlign: 'center',
    padding: '20px',
  },
  item: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    padding: '12px',
    borderRadius: '8px',
    backgroundColor: '#f5f5f5',
  },
  itemIcon: {
    fontSize: '18px',
  },
  itemContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  itemMessage: {
    fontSize: '14px',
    color: '#333',
  },
  itemTime: {
    fontSize: '12px',
    color: '#999',
  },
};
