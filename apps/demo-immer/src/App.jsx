import React from "react";
import { createStore } from "@nexus-state/core";
import { immerAtom, setImmer } from "@nexus-state/immer";

// Create a global store instance
const store = createStore();

// Create an atom for complex state using Immer
// This atom is bound to the store and supports Immer-based updates
const userStateAtom = immerAtom(
  {
    profile: {
      personal: {
        firstName: "John",
        lastName: "Doe",
        age: 30,
        contacts: {
          email: "john.doe@example.com",
          phone: "+1234567890",
        },
      },
      preferences: {
        theme: "light",
        notifications: {
          email: true,
          sms: false,
          push: true,
        },
      },
    },
    posts: [
      {
        id: 1,
        title: "First Post",
        content: "Content of the first post",
        tags: ["hello", "world"],
        createdAt: new Date("2023-01-01"),
      },
    ],
    friends: [
      { id: 1, name: "Alice", online: true },
      { id: 2, name: "Bob", online: false },
    ],
  },
  store,
); // Bind the atom to the store

export const App = () => {
  // Local state to trigger re-renders when the atom changes
  const [userState, setUserState] = React.useState(() =>
    store.get(userStateAtom),
  );

  // Subscribe to the atom to keep local state in sync
  React.useEffect(() => {
    const unsubscribe = store.subscribe(userStateAtom, (newState) => {
      setUserState(newState);
    });

    return () => unsubscribe();
  }, []);

  // Update user's first name using Immer-style mutation syntax
  const updateFirstName = (newName) => {
    setImmer(userStateAtom, (draft) => {
      draft.profile.personal.firstName = newName;
    });
  };

  // Add a tag to the first post
  const addTagToFirstPost = (tag) => {
    setImmer(userStateAtom, (draft) => {
      if (draft.posts.length > 0) {
        draft.posts[0].tags.push(tag);
      }
    });
  };

  // Add a new friend to the list
  const addFriend = (friend) => {
    setImmer(userStateAtom, (draft) => {
      draft.friends.push(friend);
    });
  };

  // Toggle email notification preference
  const toggleEmailNotifications = () => {
    setImmer(userStateAtom, (draft) => {
      draft.profile.preferences.notifications.email =
        !draft.profile.preferences.notifications.email;
    });
  };

  // Update user's email address
  const updateEmail = (newEmail) => {
    setImmer(userStateAtom, (draft) => {
      draft.profile.personal.contacts.email = newEmail;
    });
  };

  return (
    <div
      style={{
        padding: "20px",
        fontFamily: "sans-serif",
        maxWidth: "800px",
        margin: "0 auto",
      }}
    >
      <h1>Nexus State Immer Demo</h1>
      <p>
        Demonstration of Immer integration with Nexus State for complex state
        management
      </p>

      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}
      >
        <div
          style={{
            border: "1px solid #ddd",
            padding: "15px",
            borderRadius: "5px",
          }}
        >
          <h2>Current State</h2>
          <pre
            style={{
              backgroundColor: "#f5f5f5",
              padding: "10px",
              borderRadius: "4px",
              overflow: "auto",
              maxHeight: "300px",
            }}
          >
            {JSON.stringify(userState, null, 2)}
          </pre>
        </div>

        <div>
          <h2>State Operations</h2>

          <div style={{ marginBottom: "15px" }}>
            <h3>Update First Name</h3>
            <button
              onClick={() => updateFirstName("Jane")}
              style={{ marginRight: "10px" }}
            >
              Set Name to Jane
            </button>
            <button onClick={() => updateFirstName("John")}>
              Set Name to John
            </button>
          </div>

          <div style={{ marginBottom: "15px" }}>
            <h3>Manage Posts</h3>
            <button
              onClick={() => addTagToFirstPost("new tag")}
              style={{ marginRight: "10px" }}
            >
              Add Tag to First Post
            </button>
          </div>

          <div style={{ marginBottom: "15px" }}>
            <h3>Manage Friends</h3>
            <button
              onClick={() =>
                addFriend({ id: 3, name: "Charlie", online: true })
              }
            >
              Add Friend Charlie
            </button>
          </div>

          <div style={{ marginBottom: "15px" }}>
            <h3>Notification Settings</h3>
            <button onClick={toggleEmailNotifications}>
              Toggle Email Notifications
            </button>
          </div>

          <div style={{ marginBottom: "15px" }}>
            <h3>Update Email</h3>
            <button onClick={() => updateEmail("new.email@example.com")}>
              Update Email Address
            </button>
          </div>
        </div>
      </div>

      <div
        style={{
          marginTop: "20px",
          padding: "15px",
          backgroundColor: "#e8f4fd",
          borderRadius: "4px",
        }}
      >
        <h3>Benefits of Using Immer:</h3>
        <ul>
          <li>Immutable updates with mutable syntax</li>
          <li>Automatic creation of new objects on changes</li>
          <li>Easy handling of deeply nested structures</li>
          <li>Better performance compared to manual spreading</li>
        </ul>
      </div>
    </div>
  );
};
