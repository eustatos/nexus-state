import React from 'react';
import { createRoot } from 'react-dom/client';
import { builderAtom, builderActions, defaultRegistry, builtInComponents } from '@nexus-state/form-builder-react';
import { useAtom } from '@nexus-state/react';

// Register built-in components
defaultRegistry.registerMany(builtInComponents);

function App() {
  const [state] = useAtom(builderAtom);

  // Add a text field
  const addTextField = () => {
    builderActions.addField({
      id: `field_${Date.now()}`,
      type: 'text',
      name: `field_${Date.now()}`,
      label: 'Text Field',
      placeholder: 'Enter text...',
      required: false,
    });
  };

  // Add an email field
  const addEmailField = () => {
    builderActions.addField({
      id: `field_${Date.now()}`,
      type: 'email',
      name: `field_${Date.now()}`,
      label: 'Email Field',
      placeholder: 'Enter email...',
      required: true,
    });
  };

  // Remove the last field
  const removeLastField = () => {
    if (state.schema.fields.length > 0) {
      const lastField = state.schema.fields[state.schema.fields.length - 1];
      builderActions.removeField(lastField.id);
    }
  };

  // Undo last action
  const undo = () => {
    builderActions.undo(state);
  };

  // Redo last undone action
  const redo = () => {
    builderActions.redo(state);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h1>Basic Form Builder Example</h1>
      <p>Current fields: {state.schema.fields.length}</p>

      <div style={{ marginBottom: '20px' }}>
        <button onClick={addTextField} style={{ marginRight: '10px' }}>
          Add Text Field
        </button>
        <button onClick={addEmailField} style={{ marginRight: '10px' }}>
          Add Email Field
        </button>
        <button onClick={removeLastField} style={{ marginRight: '10px' }}>
          Remove Last Field
        </button>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <button onClick={undo} disabled={state.history.past.length === 0} style={{ marginRight: '10px' }}>
          Undo
        </button>
        <button onClick={redo} disabled={state.history.future.length === 0}>
          Redo
        </button>
      </div>

      <div style={{ border: '1px solid #ccc', padding: '10px', minHeight: '100px' }}>
        {state.schema.fields.map((field) => (
          <div key={field.id} style={{ marginBottom: '10px', padding: '10px', backgroundColor: '#f5f5f5' }}>
            <strong>{field.label}</strong>
            <div>Type: {field.type}</div>
            <div>Name: {field.name}</div>
            {field.required && <div style={{ color: 'red' }}>Required</div>}
          </div>
        ))}
        {state.schema.fields.length === 0 && (
          <div style={{ color: '#999', textAlign: 'center' }}>No fields yet. Add some!</div>
        )}
      </div>
    </div>
  );
}

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
