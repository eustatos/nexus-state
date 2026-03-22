import React from 'react';
import { useAtom } from '@nexus-state/react';
import { cartAtom, cartActions, products } from '../store';
import { ProductCard } from './ProductCard';

export function ProductList() {
  const [cart, setCart] = useAtom(cartAtom);

  const handleAddToCart = (product: typeof products[0]) => {
    cartActions.addItem({ get: () => cart, set: setCart } as never, product);
  };

  return (
    <div style={styles.container} role="region" aria-label="Product catalog">
      <h2 style={styles.title} id="products-heading">Products</h2>
      <div style={styles.grid} role="list" aria-labelledby="products-heading">
        {products.map((product) => (
          <ProductCardWithCart key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}

function ProductCardWithCart({ product }: { product: typeof products[0] }) {
  const [cart, setCart] = useAtom(cartAtom);

  const handleAddToCart = () => {
    cartActions.addItem({ get: () => cart, set: setCart } as never, product);
  };

  return (
    <div style={styles.card}>
      <img src={product.image} alt={product.name} style={styles.image} />
      <div style={styles.info}>
        <h3 style={styles.name}>{product.name}</h3>
        <p style={styles.description}>{product.description}</p>
        <div style={styles.footer}>
          <span style={styles.price}>${product.price.toFixed(2)}</span>
          <button onClick={handleAddToCart} style={styles.button}>
            Add to Cart
          </button>
        </div>
      </div>
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
  title: {
    margin: '0 0 24px 0',
    fontSize: '20px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
    gap: '20px',
  },
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
