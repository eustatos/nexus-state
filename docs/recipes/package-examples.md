# Package-Specific Examples

Examples and use cases for each @nexus-state package.

## @nexus-state/async

Examples using the async utilities package.

### Async Operations with Error Handling

```javascript
import { createAsyncOperation } from '@nexus-state/async';

// Create an async operation with built-in error handling
const fetchUserData = createAsyncOperation(async (userId) => {
  const response = await fetch(`/api/users/${userId}`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch user: ${response.status}`);
  }
  
  return await response.json();
});

// Usage with error handling
const loadUser = async (userId) => {
  try {
    const user = await fetchUserData.execute(userId);
    console.log('User loaded:', user);
  } catch (error) {
    console.error('Failed to load user:', error.message);
  }
};
```

### Operation Chaining

```javascript
import { createAsyncOperation } from '@nexus-state/async';

// Chain multiple async operations
const fetchUserWithPosts = createAsyncOperation(async (userId) => {
  const user = await fetchUserData.execute(userId);
  const posts = await fetchUserPosts.execute(userId);
  
  return {
    ...user,
    posts
  };
});

// Parallel execution
const fetchMultipleUsers = async (userIds) => {
  const operations = userIds.map(id => fetchUserData.execute(id));
  return await Promise.all(operations);
};
```

## @nexus-state/cli

Examples using the command-line interface.

### Custom Generators

```bash
# Generate a custom component with specific options
nexus generate component UserCard --props name:string,avatar:string --styles css

# Generate a service with async support
nexus generate service UserService --async --cache

# Generate a store with specific state structure
nexus generate store UserStore --state id:number,name:string,email:string --persist
```

### Project Scaffolding

```bash
# Initialize a project with specific template
nexus init my-app --template react-ts --features async,persist,devtools

# Add features to existing project
nexus add-feature middleware --type logger

# Generate configuration files
nexus generate config eslint --rules react-hooks,import-order
```

## @nexus-state/devtools

Examples using developer tools for debugging.

### Custom Inspectors

```javascript
import { createDevtools } from '@nexus-state/devtools';

// Create devtools with custom inspectors
const devtools = createDevtools({
  inspectors: [
    {
      name: 'User Inspector',
      selector: (state) => state.user,
      component: UserInspectorComponent
    },
    {
      name: 'Form Inspector',
      selector: (state) => state.forms,
      component: FormInspectorComponent
    }
  ]
});

// Connect to store
store.use(devtools);
```

### Performance Monitoring

```javascript
import { createDevtools } from '@nexus-state/devtools';

// Enable performance monitoring
const devtools = createDevtools({
  performance: true,
  logSlowActions: true,
  slowActionThreshold: 100 // ms
});

// Monitor specific operations
const monitoredOperation = devtools.monitor('fetchUserData', async () => {
  return await fetch('/api/users').then(res => res.json());
});
```

## @nexus-state/family

Examples using state families for managing related state.

### Family with Derived State

```javascript
import { createFamily } from '@nexus-state/family';

// Create a family with derived state
const userFamily = createFamily({
  user: {
    id: null,
    name: '',
    email: ''
  },
  preferences: {
    theme: 'light',
    notifications: true
  }
});

// Add derived state
userFamily.addDerived('displayName', (state) => {
  return state.user.name || 'Anonymous User';
});

// Add computed state based on multiple family members
userFamily.addComputed('isComplete', (state) => {
  return state.user.id && state.user.name && state.user.email;
});
```

### Nested Families

```javascript
import { createFamily } from '@nexus-state/family';

// Create nested families
const appFamily = createFamily({
  user: {
    profile: {
      name: '',
      email: ''
    },
    settings: {
      theme: 'light'
    }
  },
  posts: []
});

// Access nested state
const userProfile = appFamily.get('user.profile');
const userSettings = appFamily.get('user.settings');

// Update nested state
appFamily.set('user.profile.name', 'John Doe');
```

## @nexus-state/immer

Examples using Immer for immutable state updates.

### Immer Store with Complex Updates

```javascript
import { createImmerStore } from '@nexus-state/immer';

const store = createImmerStore({
  users: [
    { id: 1, name: 'John', posts: [] }
  ],
  ui: {
    loading: false,
    errors: []
  }
});

// Complex state update using Immer
store.setState((draft) => {
  draft.ui.loading = true;
  
  const user = draft.users.find(u => u.id === 1);
  if (user) {
    user.posts.push({
      id: Date.now(),
      title: 'New Post',
      content: 'Post content