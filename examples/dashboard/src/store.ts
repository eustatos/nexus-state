import { atom, batch } from '@nexus-state/core';

// Types
export interface Stats {
  users: number;
  revenue: number;
  orders: number;
  conversion: number;
}

export interface Order {
  id: string;
  customer: string;
  amount: number;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  isNew?: boolean;
}

export interface Notification {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: number;
}

// Dashboard data atoms
export const statsAtom = atom<Stats>({
  users: 12453,
  revenue: 45234.89,
  orders: 1834,
  conversion: 3.24,
});

export const recentOrdersAtom = atom<Order[]>([
  { id: '1', customer: 'Alice Johnson', amount: 129.99, status: 'completed', isNew: true },
  { id: '2', customer: 'Bob Smith', amount: 79.50, status: 'processing', isNew: true },
  { id: '3', customer: 'Carol White', amount: 249.00, status: 'pending', isNew: false },
  { id: '4', customer: 'David Brown', amount: 45.00, status: 'completed', isNew: false },
  { id: '5', customer: 'Eve Davis', amount: 189.99, status: 'completed', isNew: false },
]);

export const notificationsAtom = atom<Notification[]>([]);

// Computed atoms
export const hasNewOrdersAtom = atom((get) => {
  const orders = get(recentOrdersAtom);
  return orders.some((order) => order.isNew);
});

export const totalRevenueAtom = atom((get) => {
  const stats = get(statsAtom);
  return stats.revenue.toFixed(2);
});

export const pendingOrdersCountAtom = atom((get) => {
  const orders = get(recentOrdersAtom);
  return orders.filter((o) => o.status === 'pending').length;
});

// Mock data generator
function generateMockOrder(): Order {
  const customers = [
    'Frank Miller',
    'Grace Lee',
    'Henry Wilson',
    'Ivy Chen',
    'Jack Thompson',
  ];
  const statuses: Order['status'][] = ['pending', 'processing', 'completed'];
  
  return {
    id: Date.now().toString(),
    customer: customers[Math.floor(Math.random() * customers.length)],
    amount: Math.round((Math.random() * 300 + 20) * 100) / 100,
    status: statuses[Math.floor(Math.random() * statuses.length)],
    isNew: true,
  };
}

function generateMockNotification(): Notification {
  const messages = [
    'New order received!',
    'Payment processed successfully',
    'Low stock alert for Product X',
    'New user registered',
    'Weekly report is ready',
  ];
  const types: Notification['type'][] = ['info', 'success', 'warning'];
  
  return {
    id: Date.now().toString(),
    message: messages[Math.floor(Math.random() * messages.length)],
    type: types[Math.floor(Math.random() * types.length)],
    timestamp: Date.now(),
  };
}

// Simulated real-time updates (replaces WebSocket for demo)
export function setupRealTimeUpdates(
  store: { get: <T>(atom: any) => T; set: <T>(atom: any, value: T) => void }
) {
  // Update stats periodically
  const statsInterval = setInterval(() => {
    const currentStats = store.get(statsAtom);
    const newStats = {
      users: currentStats.users + Math.floor(Math.random() * 5),
      revenue: currentStats.revenue + Math.round((Math.random() * 100) * 100) / 100,
      orders: currentStats.orders + Math.floor(Math.random() * 3),
      conversion: Math.round((currentStats.conversion + (Math.random() - 0.5) * 0.1) * 100) / 100,
    };
    store.set(statsAtom, newStats);
  }, 5000);

  // Add new orders periodically
  const ordersInterval = setInterval(() => {
    const currentOrders = store.get(recentOrdersAtom);
    const newOrder = generateMockOrder();
    store.set(recentOrdersAtom, [newOrder, ...currentOrders.slice(0, 9)]);
    
    // Mark old orders as not new
    setTimeout(() => {
      const orders = store.get(recentOrdersAtom);
      store.set(
        recentOrdersAtom,
        orders.map((o) => (o.id === newOrder.id ? { ...o, isNew: false } : o))
      );
    }, 3000);
  }, 8000);

  // Add notifications periodically
  const notificationsInterval = setInterval(() => {
    const currentNotifications = store.get(notificationsAtom);
    const newNotification = generateMockNotification();
    store.set(notificationsAtom, [newNotification, ...currentNotifications.slice(0, 4)]);
  }, 10000);

  return () => {
    clearInterval(statsInterval);
    clearInterval(ordersInterval);
    clearInterval(notificationsInterval);
  };
}
