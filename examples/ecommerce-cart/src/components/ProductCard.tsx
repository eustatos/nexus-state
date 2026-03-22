import React from 'react';
import { useSetAtom } from '@nexus-state/react';
import type { Product } from '../store';
import { cartActions } from '../store';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const addItem = useSetAtom('cart' as never);

  const handleAddToCart = () => {
    // This will be handled by the parent component with store access
    const event = new CustomEvent('add-to-cart', { detail: product });
    window.dispatchEvent(event);
  };

  return (
    <div style={styles.card} role="article" aria-label={`Product: ${product.name}`}>
      <img src={product.image} alt={product.name} style={styles.image} />
      <div style={styles.info}>
        <h3 style={styles.name}>{product.name}</h3>
        <p style={styles.description}>{product.description}</p>
        <div style={styles.footer}>
          <span style={styles.price} aria-label={`Price: ${product.price.toFixed(2)} dollars`}>
            ${product.price.toFixed(2)}
          </span>
          <button
            onClick={handleAddToCart}
            style={styles.button}
            aria-label={`Add ${product.name} to cart`}
          >
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  card: {
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    overflow: 'hidden',
    backgroundColor: '#fff',
    transition: 'box-shadow 0.2s',
  },
  image: {
    width: '100%',
    height: '160px',
    objectFit: 'cover',
  },
  info: {
    padding: '16px',
  },
  name: {
    margin: '0 0 8px 0',
    fontSize: '16px',
    fontWeight: 600,
  },
  description: {
    margin: '0 0 12px 0',
    fontSize: '14px',
    color: '#666',
    lineHeight: 1.4,
  },
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  price: {
    fontSize: '18px',
    fontWeight: 700,
    color: '#2e7d32',
  },
  button: {
    padding: '8px 16px',
    border: 'none',
    borderRadius: '4px',
    backgroundColor: '#1976d2',
    color: '#fff',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
  },
};
