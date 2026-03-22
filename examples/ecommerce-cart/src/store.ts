import { atom, type Store } from '@nexus-state/core';
import { persist, localStorageStorage } from '@nexus-state/persist';

// Types
export interface Product {
  id: number;
  name: string;
  price: number;
  image: string;
  description: string;
}

export interface CartItem extends Product {
  quantity: number;
}

// Mock products data
export const products: Product[] = [
  {
    id: 1,
    name: 'Wireless Headphones',
    price: 99.99,
    image: 'https://via.placeholder.com/200?text=Headphones',
    description: 'Premium wireless headphones with noise cancellation',
  },
  {
    id: 2,
    name: 'Smart Watch',
    price: 249.99,
    image: 'https://via.placeholder.com/200?text=Watch',
    description: 'Feature-rich smartwatch with fitness tracking',
  },
  {
    id: 3,
    name: 'Bluetooth Speaker',
    price: 79.99,
    image: 'https://via.placeholder.com/200?text=Speaker',
    description: 'Portable speaker with 360° sound',
  },
  {
    id: 4,
    name: 'USB-C Hub',
    price: 49.99,
    image: 'https://via.placeholder.com/200?text=Hub',
    description: '7-in-1 USB-C hub with HDMI and SD card reader',
  },
  {
    id: 5,
    name: 'Mechanical Keyboard',
    price: 149.99,
    image: 'https://via.placeholder.com/200?text=Keyboard',
    description: 'RGB mechanical keyboard with Cherry MX switches',
  },
  {
    id: 6,
    name: 'Wireless Mouse',
    price: 59.99,
    image: 'https://via.placeholder.com/200?text=Mouse',
    description: 'Ergonomic wireless mouse with precision tracking',
  },
];

// Atoms
export const cartAtom = atom<CartItem[]>([]);
export const wishlistAtom = atom<Product[]>([]);

// Persist configuration for cart
export const cartPersistConfig = {
  key: 'shopping-cart',
  storage: localStorageStorage,
  serialize: (value: CartItem[]) => JSON.stringify(value),
  deserialize: (value: string) => JSON.parse(value) as CartItem[],
};

// Apply persist plugin to store
export function applyCartPersist(store: Store) {
  persist(cartAtom, cartPersistConfig)(store);
}

// Computed atoms
export const cartTotalAtom = atom((get) => {
  const cart = get(cartAtom);
  return cart.reduce((total, item) => total + item.price * item.quantity, 0);
});

export const cartItemCountAtom = atom((get) => {
  const cart = get(cartAtom);
  return cart.reduce((count, item) => count + item.quantity, 0);
});

export const isEmptyCartAtom = atom((get) => get(cartItemCountAtom) === 0);

// Cart actions
export const cartActions = {
  addItem: (store: Store, product: Product) => {
    const cart = store.get(cartAtom);
    const existingItem = cart.find((item) => item.id === product.id);

    if (existingItem) {
      store.set(
        cartAtom,
        cart.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      store.set(cartAtom, [...cart, { ...product, quantity: 1 }]);
    }
  },

  removeItem: (store: Store, productId: number) => {
    const cart = store.get(cartAtom);
    store.set(
      cartAtom,
      cart.filter((item) => item.id !== productId)
    );
  },

  updateQuantity: (store: Store, productId: number, quantity: number) => {
    const cart = store.get(cartAtom);
    if (quantity <= 0) {
      cartActions.removeItem(store, productId);
    } else {
      store.set(
        cartAtom,
        cart.map((item) =>
          item.id === productId ? { ...item, quantity } : item
        )
      );
    }
  },

  clearCart: (store: Store) => {
    store.set(cartAtom, []);
  },

  addToWishlist: (store: Store, product: Product) => {
    const wishlist = store.get(wishlistAtom);
    if (!wishlist.find((p) => p.id === product.id)) {
      store.set(wishlistAtom, [...wishlist, product]);
    }
  },

  removeFromWishlist: (store: Store, productId: number) => {
    const wishlist = store.get(wishlistAtom);
    store.set(
      wishlistAtom,
      wishlist.filter((p) => p.id !== productId)
    );
  },
};
