# Caching

Implementing caching strategies with Nexus State.

## Basic In-Memory Cache

```javascript
import { atom, createStore } from '@nexus-state/core';

// Simple cache implementation
class SimpleCache {
  constructor() {
    this.cache = new Map();
    this.timeouts = new Map();
  }
  
  get(key) {
    return this.cache.get(key);
  }
  
  set(key, value, ttl = 5 * 60 * 1000) { // 5 minutes default
    this.cache.set(key, value);
    
    // Clear existing timeout
    if (this.timeouts.has(key)) {
      clearTimeout(this.timeouts.get(key));
    }
    
    // Set expiration timeout
    const timeout = setTimeout(() => {
      this.cache.delete(key);
      this.timeouts.delete(key);
    }, ttl);
    
    this.timeouts.set(key, timeout);
  }
  
  has(key) {
    return this.cache.has(key);
  }
  
  delete(key) {
    this.cache.delete(key);
    
    if (this.timeouts.has(key)) {
      clearTimeout(this.timeouts.get(key));
      this.timeouts.delete(key);
    }
  }
  
  clear() {
    this.cache.clear();
    
    for (const timeout of this.timeouts.values()) {
      clearTimeout(timeout);
    }
    this.timeouts.clear();
  }
}

const cache = new SimpleCache();
const cacheAtom = atom(cache);

const store = createStore();

// Cache-aware data fetching
const fetchWithCache = async (key, fetcher, ttl) => {
  // Check cache first
  if (cache.has(key)) {
    return cache.get(key);
  }
  
  // Fetch data
  const data = await fetcher();
  
  // Store in cache
  cache.set(key, data, ttl);
  
  return data;
};

// Example usage
const fetchUser = async (id) => {
  return fetchWithCache(
    `user:${id}`,
    () => fetch(`/api/users/${id}`).then(res => res.json()),
    10 * 60 * 1000 // 10 minutes
  );
};
```

## React Implementation with Cache Hooks

```jsx
import { useAtom } from '@nexus-state/react';
import { useEffect, useState } from 'react';

// Custom hook for cached data
const useCachedData = (key, fetcher, ttl = 5 * 60 * 1000) => {
  const [cache] = useAtom(cacheAtom);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const result = await fetchWithCache(key, fetcher, ttl);
        setData(result);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [key]);
  
  return { data, loading, error };
};

// Component using cached data
function UserComponent({ userId }) {
  const { data: user, loading, error } = useCachedData(
    `user:${userId}`,
    () => fetch(`/api/users/${userId}`).then(res => res.json()),
    10 * 60 * 1000 // 10 minutes
  );
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!user) return <div>No user found</div>;
  
  return (
    <div>
      <h2>{user.name}</h2>
      <p>{user.email}</p>
    </div>
  );
}
```

## Advanced Caching Patterns

### Cache with Persistence

```javascript
import { atom, createStore } from '@nexus-state/core';
import { createPersist } from '@nexus-state/persist';

// Cache that persists to localStorage
class PersistentCache {
  constructor(storageKey = 'nexus-cache') {
    this.storageKey = storageKey;
    this.cache = new Map();
    this.timeouts = new Map();
    this.loadFromStorage();
  }
  
  loadFromStorage() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        const now = Date.now();
        
        // Load non-expired entries
        for (const [key, { value, expires }] of Object.entries(parsed)) {
          if (expires > now) {
            this.cache.set(key, value);
            
            // Set timeout for expiration
            const timeout = setTimeout(() => {
              this.cache.delete(key);
              this.saveToStorage();
            }, expires - now);
            
            this.timeouts.set(key, timeout);
          }
        }
      }
    } catch (error) {
      console.warn('Failed to load cache from storage:', error);
    }
  }
  
  saveToStorage() {
    try {
      const toStore = {};
      const now = Date.now();
      
      for (const [key, value] of this.cache.entries()) {
        // Get expiration time from timeout
        const timeout = this.timeouts.get(key);
        if (timeout) {
          const expires = now + (timeout._idleTimeout || 0);
          toStore[key] = { value, expires };
        }
      }
      
      localStorage.setItem(this.storageKey, JSON.stringify(toStore));
    } catch (error) {
      console.warn('Failed to save cache to storage:', error);
    }
  }
  
  get(key) {
    return this.cache.get(key);
  }
  
  set(key, value, ttl = 5 * 60 * 1000) {
    this.cache.set(key, value);
    
    // Clear existing timeout
    if (this.timeouts.has(key)) {
      clearTimeout(this.timeouts.get(key));
    }
    
    // Set expiration timeout
    const timeout = setTimeout(() => {
      this.cache.delete(key);
      this.timeouts.delete(key);
      this.saveToStorage();
    }, ttl);
    
    this.timeouts.set(key, timeout);
    this.saveToStorage();
  }
  
  has(key) {
    return this.cache.has(key);
  }
  
  delete(key) {
    this.cache.delete(key);
    
    if (this.timeouts.has(key)) {
      clearTimeout(this.timeouts.get(key));
      this.timeouts.delete(key);
    }
    
    this.saveToStorage();
  }
  
  clear() {
    this.cache.clear();
    
    for (const timeout of this.timeouts.values()) {
      clearTimeout(timeout);
    }
    this.timeouts.clear();
    
    this.saveToStorage();
  }
}

const persistentCache = new PersistentCache();
const persistentCacheAtom = atom(persistentCache);

const store = createStore();
store.use(createPersist({
  key: 'app-cache',
  storage: localStorage,
  atoms: [persistentCacheAtom]
}));
```