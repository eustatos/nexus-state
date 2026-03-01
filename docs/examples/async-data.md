# Async Data Example

An example demonstrating how to handle asynchronous data with Nexus State.

## Core Implementation

```javascript
import { atom, createStore } from '@nexus-state/core';

// Atoms for async data state
const dataAtom = atom(null);
const loadingAtom = atom(false);
const errorAtom = atom(null);

const store = createStore();

// Async data fetching function
const fetchData = async () => {
  // Set loading state
  store.set(loadingAtom, true);
  store.set(errorAtom, null);
  
  try {
    // Fetch data
    const response = await fetch('/api/data');
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    store.set(dataAtom, data);
  } catch (error) {
    store.set(errorAtom, error.message);
  } finally {
    store.set(loadingAtom, false);
  }
};

// Load data on initialization
fetchData();
```

## React Implementation

```jsx
import { useAtom } from '@nexus-state/react';
import { useEffect } from 'react';

function AsyncDataComponent() {
  const [data] = useAtom(dataAtom);
  const [loading] = useAtom(loadingAtom);
  const [error] = useAtom(errorAtom);
  
  useEffect(() => {
    fetchData();
  }, []);
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!data) return <div>No data available</div>;
  
  return (
    <div>
      <h2>Data</h2>
      <pre>{JSON.stringify(data, null, 2)}</pre>
      <button onClick={fetchData}>Refresh</button>
    </div>
  );
}
```

## Async Package Implementation

```javascript
import { createAsyncOperation } from '@nexus-state/async';

// Create async operation with built-in state management
const fetchDataOperation = createAsyncOperation(async () => {
  const response = await fetch('/api/data');
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  return await response.json();
});

// Usage with async operation
const loadAsyncData = async () => {
  try {
    const data = await fetchDataOperation.execute();
    console.log('Data loaded:', data);
  } catch (error) {
    console.error('Failed to load data:', error.message);
  }
};

// Check operation state
console.log('Loading:', fetchDataOperation.loading);
console.log('Error:', fetchDataOperation.error);
```

## React with Async Package

```jsx
import { useEffect } from 'react';

function AsyncDataWithPackage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const result = await fetchDataOperation.execute();
        setData(result);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!data) return <div>No data available</div>;
  
  return (
    <div>
      <h2>Data</h2>
      <pre>{JSON.stringify(data, null, 2)}</pre>
      <button onClick={() => fetchDataOperation.execute()}>Refresh</button>
    </div>
  );
}
```

## Caching Implementation

```javascript
import { createPersist } from '@nexus-state/persist';

// Add caching to async data
const cacheAtom = atom({
  data: null,
  timestamp: null
});

const store = createStore();

// Enhanced fetch with caching
const fetchWithCache = async () => {
  const cache = store.get(cacheAtom);
  const now = Date.now();
  
  // Use cached data if it's less than 5 minutes old
  if (cache.data && cache.timestamp && (now - cache.timestamp) < 5 * 60 * 1000) {
    store.set(dataAtom, cache.data);
    return;
  }
  
  // Set loading state
  store.set(loadingAtom, true);
  store.set(errorAtom, null);
  
  try {
    const response = await fetch('/api/data');
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Update data atom
    store.set(dataAtom, data);
    
    // Update cache
    store.set(cacheAtom, {
      data,
      timestamp: now
    });
  } catch (error) {
    store.set(errorAtom, error.message);
  } finally {
    store.set(loadingAtom, false);
  }
};

// Add persistence to cache
store.use(createPersist({
  key: 'async-data-cache',
  storage: localStorage,
  atoms: [cacheAtom]
}));
```

## API Integration Implementation

```javascript
// Enhanced API client with error handling and caching
class ApiClient {
  constructor(baseURL) {
    this.baseURL = baseURL;
    this.cache = new Map();
  }
  
  async get(endpoint, options = {}) {
    const cacheKey = `GET:${endpoint}`;
    
    // Check cache for GET requests
    if (options.cache !== false && this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }
    
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
        },
        ...options
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Cache successful GET responses
      if (options.cache !== false) {
        this.cache.set(cacheKey, data);
      }
      
      return data;
    } catch (error) {
      throw new Error(`API Error: ${error.message}`);
    }
  }
  
  async post(endpoint, data, options = {}) {
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        ...options
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      // Clear cache for this endpoint
      const cacheKey = `GET:${endpoint}`;
      this.cache.delete(cacheKey);
      
      return await response.json();
    } catch (error) {
      throw new Error(`API Error: ${error.message}`);
    }
  }
}

const apiClient = new ApiClient('/api');

// Use API client with async data
const fetchApiData = async () => {
  store.set(loadingAtom, true);
  store.set(errorAtom, null);
  
  try {
    const data = await apiClient.get('/data', { cache: true });
    store.set(dataAtom, data);
  } catch (error) {
    store.set(errorAtom, error.message);
  } finally {
    store.set(loadingAtom, false);
  }
};
```