# API Integration

Integrating with REST APIs using Nexus State.

## Basic API Client

```javascript
import { atom, createStore } from '@nexus-state/core';

// API client with error handling
class ApiClient {
  constructor(baseURL, options = {}) {
    this.baseURL = baseURL;
    this.defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
      },
      ...options,
    };
  }
  
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      ...this.defaultOptions,
      ...options,
    };
    
    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }
      
      return await response.text();
    } catch (error) {
      throw new Error(`API Error: ${error.message}`);
    }
  }
  
  get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'GET' });
  }
  
  post(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
  
  put(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }
  
  delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }
}

const apiClient = new ApiClient('/api');

// Atoms for API state
const usersAtom = atom([]);
const loadingAtom = atom(false);
const errorAtom = atom(null);

const store = createStore();

// API actions
const fetchUsers = async () => {
  store.set(loadingAtom, true);
  store.set(errorAtom, null);
  
  try {
    const users = await apiClient.get('/users');
    store.set(usersAtom, users);
  } catch (error) {
    store.set(errorAtom, error.message);
  } finally {
    store.set(loadingAtom, false);
  }
};

const createUser = async (userData) => {
  store.set(loadingAtom, true);
  store.set(errorAtom, null);
  
  try {
    const newUser = await apiClient.post('/users', userData);
    const currentUsers = store.get(usersAtom);
    store.set(usersAtom, [...currentUsers, newUser]);
  } catch (error) {
    store.set(errorAtom, error.message);
  } finally {
    store.set(loadingAtom, false);
  }
};

const updateUser = async (id, userData) => {
  store.set(loadingAtom, true);
  store.set(errorAtom, null);
  
  try {
    const updatedUser = await apiClient.put(`/users/${id}`, userData);
    const currentUsers = store.get(usersAtom);
    store.set(usersAtom, currentUsers.map(user => 
      user.id === id ? updatedUser : user
    ));
  } catch (error) {
    store.set(errorAtom, error.message);
  } finally {
    store.set(loadingAtom, false);
  }
};

const deleteUser = async (id) => {
  store.set(loadingAtom, true);
  store.set(errorAtom, null);
  
  try {
    await apiClient.delete(`/users/${id}`);
    const currentUsers = store.get(usersAtom);
    store.set(usersAtom, currentUsers.filter(user => user.id !== id));
  } catch (error) {
    store.set(errorAtom, error.message);
  } finally {
    store.set(loadingAtom, false);
  }
};
```

## React Implementation with API Hooks

```jsx
import { useAtom } from '@nexus-state/react';
import { useEffect } from 'react';

// Custom hook for API data
const useApi = (fetchAction) => {
  const [data] = useAtom(usersAtom);
  const [loading] = useAtom(loadingAtom);
  const [error] = useAtom(errorAtom);
  
  useEffect(() => {
    fetchAction();
  }, [fetchAction]);
  
  return { data, loading, error };
};

// Component using API data
function UsersList() {
  const { data: users, loading, error } = useApi(fetchUsers);
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  
  return (
    <div>
      <h2>Users</h2>
      <ul>
        {users.map(user => (
          <li key={user.id}>
            {user.name} - {user.email}
          </li>
        ))}
      </ul>
    </div>
  );
}

// Form for creating users
function CreateUserForm() {
  const [loading] = useAtom(loadingAtom);
  const [error] = useAtom(errorAtom);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const userData = {
      name: formData.get('name'),
      email: formData.get('email'),
    };
    
    await createUser(userData);
    e.target.reset();
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <h3>Create User</h3>
      <div>
        <label>Name:</label>
        <input type="text" name="name" required />
      </div>
      <div>
        <label>Email:</label>
        <input type="email" name="email" required />
      </div>
      {error && <div>Error: {error}</div>}
      <button type="submit" disabled={loading}>
        {loading ? 'Creating...' : 'Create User'}
      </button>
    </form>
  );
}
```

## Advanced API Patterns

### API with Caching

```javascript
import { atom, createStore } from '@nexus-state/core';

// API client with caching
class CachedApiClient {
  constructor(baseURL, cacheTTL = 5 * 60 * 1000) {
    this.baseURL = baseURL;
    this.cache = new Map();
    this.timeouts = new Map();
    this.cacheTTL = cacheTTL;
  }
  
  async request(endpoint, options = {}) {
    const method = options.method || 'GET';
    const cacheKey = `${method}:${endpoint}`;
    
    // Check cache for GET requests
    if (method === 'GET' && this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }
    
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
      },
      ...options,
    };
    
    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const contentType = response.headers.get('content-type');
      let data;
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }
      
      // Cache GET responses
      if (method === 'GET') {
        this.cache.set(cacheKey, data);
        
        // Clear existing timeout
        if (this.timeouts.has(cacheKey)) {
          clearTimeout(this.timeouts.get(cacheKey));
        }
        
        // Set expiration timeout
        const timeout = setTimeout(() => {
          this.cache.delete(cacheKey);
          this.timeouts.delete(cacheKey);
        }, this.cacheTTL);
        
        this.timeouts.set(cacheKey, timeout);
      }
      
      return data;
    } catch (error) {
      throw new Error(`API Error: ${error.message}`);
    }
  }
  
  // Invalidate cache for a specific endpoint
  invalidate(endpoint) {
    const cacheKey = `GET:${endpoint}`;
    this.cache.delete(cacheKey);
    
    if (this.timeouts.has(cacheKey)) {
      clearTimeout(this.timeouts.get(cacheKey));
      this.timeouts.delete(cacheKey);
    }
  }
  
  // Clear all cache
  clearCache() {
    this.cache.clear();
    
    for (const timeout of this.timeouts.values()) {
      clearTimeout(timeout);
    }
    this.timeouts.clear();
  }
  
  get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'GET' });
  }
  
  post(endpoint, data, options = {}) {
    // Invalidate cache for this endpoint after POST
    this.invalidate(endpoint);
    return this.request(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
  
  put(endpoint, data, options = {}) {
    // Invalidate cache for this endpoint after PUT
    this.invalidate(endpoint);
    return this.request(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }
  
  delete(endpoint, options = {}) {
    // Invalidate cache for this endpoint after DELETE
    this.invalidate(endpoint);
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }
}

const cachedApiClient = new CachedApiClient('/api', 10 * 60 * 1000); // 10 minutes cache
```