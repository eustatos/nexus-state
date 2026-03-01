import React from 'react';
import { createStore, atom } from '@nexus-state/core';
import '@nexus-state/async';

// Create store
const store = createStore();

// Create async atom for user data
const [userAtom, fetchUser] = atom.async({
  fetchFn: async () => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Simulate random success or failure
    if (Math.random() > 0.7) {
      throw new Error('Failed to fetch user data');
    }
    
    return {
      id: 1,
      name: 'John Doe',
      email: 'john.doe@example.com',
      age: 30
    };
  }
});

// Create async atom for items list
const [itemsAtom, fetchItems] = atom.async({
  initialValue: [],
  fetchFn: async () => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Simulate random success or failure
    if (Math.random() > 0.8) {
      throw new Error('Failed to fetch items');
    }
    
    return [
      { id: 1, name: 'Item 1', description: 'First item' },
      { id: 2, name: 'Item 2', description: 'Second item' },
      { id: 3, name: 'Item 3', description: 'Third item' },
      { id: 4, name: 'Item 4', description: 'Fourth item' },
      { id: 5, name: 'Item 5', description: 'Fifth item' }
    ];
  }
});

export const App = () => {
  const [userState, setUserState] = React.useState(store.get(userAtom));
  const [itemsState, setItemsState] = React.useState(store.get(itemsAtom));

  // Subscribe to user atom changes
  React.useEffect(() => {
    const unsubscribeUser = store.subscribe(userAtom, (newValue) => {
      setUserState(newValue);
    });
    
    const unsubscribeItems = store.subscribe(itemsAtom, (newValue) => {
      setItemsState(newValue);
    });
    
    return () => {
      unsubscribeUser();
      unsubscribeItems();
    };
  }, []);

  const handleFetchUser = () => {
    fetchUser(store);
  };

  const handleFetchItems = () => {
    fetchItems(store);
  };

  const handleFetchBoth = () => {
    fetchUser(store);
    fetchItems(store);
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Nexus State Async Demo</h1>
      <p>Demonstration of working with asynchronous operations in Nexus State</p>
      
      <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '5px' }}>
        <h2>User Data</h2>
        <button onClick={handleFetchUser} disabled={userState.loading} style={{ marginBottom: '10px' }}>
          {userState.loading ? 'Loading...' : 'Fetch User Data'}
        </button>
        
        {userState.loading && (
          <div>Loading user data...</div>
        )}
        
        {userState.error && (
          <div style={{ color: 'red' }}>
            Error: {userState.error.message}
          </div>
        )}
        
        {userState.data && !userState.loading && (
          <div>
            <p><strong>ID:</strong> {userState.data.id}</p>
            <p><strong>Name:</strong> {userState.data.name}</p>
            <p><strong>Email:</strong> {userState.data.email}</p>
            <p><strong>Age:</strong> {userState.data.age}</p>
          </div>
        )}
        
        {!userState.data && !userState.loading && !userState.error && (
          <div>No user data loaded</div>
        )}
      </div>
      
      <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '5px' }}>
        <h2>Items List</h2>
        <button onClick={handleFetchItems} disabled={itemsState.loading} style={{ marginBottom: '10px' }}>
          {itemsState.loading ? 'Loading...' : 'Fetch Items'}
        </button>
        
        {itemsState.loading && (
          <div>Loading items...</div>
        )}
        
        {itemsState.error && (
          <div style={{ color: 'red' }}>
            Error: {itemsState.error.message}
          </div>
        )}
        
        {itemsState.data && itemsState.data.length > 0 && !itemsState.loading && (
          <ul>
            {itemsState.data.map(item => (
              <li key={item.id}>
                <strong>{item.name}</strong>: {item.description}
              </li>
            ))}
          </ul>
        )}
        
        {itemsState.data && itemsState.data.length === 0 && !itemsState.loading && !itemsState.error && (
          <div>No items found</div>
        )}
      </div>
      
      <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '5px' }}>
        <h2>Combined Operations</h2>
        <button onClick={handleFetchBoth} disabled={userState.loading || itemsState.loading}>
          Fetch Both User and Items
        </button>
      </div>
      
      <div style={{ padding: '15px', backgroundColor: '#e8f4fd', borderRadius: '4px' }}>
        <h3>Async Operations in Action:</h3>
        <ul>
          <li><strong>Async Atoms</strong> - Handle loading, error, and data states automatically</li>
          <li><strong>Simulated API Calls</strong> - With random delays and occasional failures</li>
          <li><strong>State Management</strong> - Automatic updates when async operations complete</li>
        </ul>
        <p>Click the buttons to trigger asynchronous operations and see how loading states and errors are handled.</p>
      </div>
    </div>
  );
};