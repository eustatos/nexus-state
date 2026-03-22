import React from 'react';
import { useAtomValue, useAtom } from '@nexus-state/react';
import {
  cartAtom,
  cartActions,
  cartTotalAtom,
  cartItemCountAtom,
  isEmptyCartAtom,
  type CartItem,
} from '../store';

export function Cart() {
  const [cart, setCart] = useAtom(cartAtom);
  const total = useAtomValue(cartTotalAtom);
  const itemCount = useAtomValue(cartItemCountAtom);
  const isEmpty = useAtomValue(isEmptyCartAtom);

  const updateQuantity = (productId: number, quantity: number) => {
    cartActions.updateQuantity(
      { get: () => cart, set: setCart } as never,
      productId,
      quantity
    );
  };

  const removeItem = (productId: number) => {
    cartActions.removeItem({ get: () => cart, set: setCart } as never, productId);
  };

  const clearCart = () => {
    cartActions.clearCart({ get: () => cart, set: setCart } as never);
  };

  if (isEmpty) {
    return (
      <div style={styles.empty} role="status" aria-label="Empty cart">
        <h2>Your cart is empty</h2>
        <p>Add some products to get started!</p>
      </div>
    );
  }

  return (
    <div style={styles.container} role="region" aria-label="Shopping cart">
      <div style={styles.header}>
        <h2 style={styles.title} aria-live="polite">
          Shopping Cart (<span aria-live="polite">{itemCount}</span> items)
        </h2>
        <button
          onClick={clearCart}
          style={styles.clearButton}
          aria-label="Clear all items from cart"
        >
          Clear Cart
        </button>
      </div>

      <div style={styles.items} role="list" aria-label="Cart items">
        {cart.map((item) => (
          <CartItemRow
            key={item.id}
            item={item}
            onUpdateQuantity={updateQuantity}
            onRemove={removeItem}
          />
        ))}
      </div>

      <div style={styles.summary} role="region" aria-label="Cart summary">
        <div style={styles.summaryRow}>
          <span>Subtotal:</span>
          <span aria-live="polite">${total.toFixed(2)}</span>
        </div>
        <div style={styles.summaryRow}>
          <span>Shipping:</span>
          <span>Free</span>
        </div>
        <div style={styles.totalRow}>
          <span>Total:</span>
          <span aria-live="polite">${total.toFixed(2)}</span>
        </div>
        <button
          style={styles.checkoutButton}
          aria-label={`Proceed to checkout with total ${total.toFixed(2)} dollars`}
        >
          Proceed to Checkout
        </button>
      </div>
    </div>
  );
}

interface CartItemRowProps {
  item: CartItem;
  onUpdateQuantity: (productId: number, quantity: number) => void;
  onRemove: (productId: number) => void;
}

function CartItemRow({ item, onUpdateQuantity, onRemove }: CartItemRowProps) {
  return (
    <div style={styles.row} role="listitem" aria-label={`${item.name} in cart`}>
      <img src={item.image} alt={item.name} style={styles.image} />
      <div style={styles.details}>
        <h4 style={styles.name}>{item.name}</h4>
        <p style={styles.price}>${item.price.toFixed(2)}</p>
      </div>
      <div style={styles.quantity} role="group" aria-label={`Quantity for ${item.name}`}>
        <button
          onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
          style={styles.qtyButton}
          aria-label={`Decrease quantity of ${item.name}`}
          title={`Decrease quantity of ${item.name}`}
        >
          <span aria-hidden="true">−</span>
        </button>
        <span style={styles.qtyValue} aria-live="polite">{item.quantity}</span>
        <button
          onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
          style={styles.qtyButton}
          aria-label={`Increase quantity of ${item.name}`}
          title={`Increase quantity of ${item.name}`}
        >
          <span aria-hidden="true">+</span>
        </button>
      </div>
      <div style={styles.subtotal} aria-label={`Subtotal: ${(item.price * item.quantity).toFixed(2)} dollars`}>
        ${(item.price * item.quantity).toFixed(2)}
      </div>
      <button
        onClick={() => onRemove(item.id)}
        style={styles.removeButton}
        aria-label={`Remove ${item.name} from cart`}
        title={`Remove ${item.name} from cart`}
      >
        <span aria-hidden="true">✕</span>
      </button>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    backgroundColor: '#fff',
    borderRadius: '8px',
    padding: '24px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
    borderBottom: '1px solid #e0e0e0',
    paddingBottom: '16px',
  },
  title: {
    margin: 0,
    fontSize: '20px',
  },
  clearButton: {
    padding: '8px 16px',
    border: '1px solid #dc3545',
    borderRadius: '4px',
    backgroundColor: '#fff',
    color: '#dc3545',
    cursor: 'pointer',
  },
  items: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  row: {
    display: 'grid',
    gridTemplateColumns: '80px 1fr 100px 100px 40px',
    gap: '16px',
    alignItems: 'center',
    padding: '16px 0',
    borderBottom: '1px solid #e0e0e0',
  },
  image: {
    width: '80px',
    height: '80px',
    objectFit: 'cover',
    borderRadius: '4px',
  },
  details: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  name: {
    margin: 0,
    fontSize: '16px',
    fontWeight: 600,
  },
  price: {
    margin: 0,
    color: '#666',
    fontSize: '14px',
  },
  quantity: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  qtyButton: {
    width: '32px',
    height: '32px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    backgroundColor: '#fff',
    cursor: 'pointer',
    fontSize: '18px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyValue: {
    minWidth: '24px',
    textAlign: 'center',
    fontSize: '16px',
  },
  subtotal: {
    fontWeight: 600,
    fontSize: '16px',
  },
  removeButton: {
    border: 'none',
    backgroundColor: 'transparent',
    color: '#999',
    cursor: 'pointer',
    fontSize: '18px',
    padding: '4px',
  },
  summary: {
    marginTop: '24px',
    paddingTop: '24px',
    borderTop: '2px solid #e0e0e0',
  },
  summaryRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '8px',
    fontSize: '16px',
    color: '#666',
  },
  totalRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '16px',
    fontSize: '20px',
    fontWeight: 700,
  },
  checkoutButton: {
    width: '100%',
    padding: '16px',
    border: 'none',
    borderRadius: '4px',
    backgroundColor: '#2e7d32',
    color: '#fff',
    fontSize: '18px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  empty: {
    textAlign: 'center',
    padding: '48px 24px',
    backgroundColor: '#fff',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
};
