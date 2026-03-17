import React from 'react';
import { createRoot } from 'react-dom/client';
import { builderAtom, builderActions, createDefaultFormSchema } from '@nexus-state/form-builder-react';
import { useAtom } from '@nexus-state/react';

function App() {
  const [state] = useAtom(builderAtom);

  // Create a form programmatically
  const createContactForm = () => {
    const schema = createDefaultFormSchema('Contact Form');
    schema.id = 'contact-form';

    builderActions.setSchema(schema);

    // Add fields programmatically
    builderActions.addField({
      id: 'field_name',
      type: 'text',
      name: 'name',
      label: 'Full Name',
      placeholder: 'Enter your name',
      required: true,
    });

    builderActions.addField({
      id: 'field_email',
      type: 'email',
      name: 'email',
      label: 'Email Address',
      placeholder: 'Enter your email',
      required: true,
    });

    builderActions.addField({
      id: 'field_message',
      type: 'textarea',
      name: 'message',
      label: 'Message',
      placeholder: 'Enter your message',
      required: true,
      props: { rows: 4 },
    });

    builderActions.addField({
      id: 'field_subscribe',
      type: 'checkbox',
      name: 'subscribe',
      label: 'Subscribe to newsletter',
      defaultValue: false,
    });
  };

  // Update a field
  const updateFieldName = () => {
    builderActions.updateField('field_name', {
      label: 'Full Name *',
      required: true,
    });
  };

  // Reorder fields
  const reorderFields = () => {
    // Move email field to first position
    const emailField = state.schema.fields.find(f => f.name === 'email');
    if (emailField) {
      const currentIndex = state.schema.fields.findIndex(f => f.name === 'email');
      builderActions.reorderFields(currentIndex, 0);
    }
  };

  // Save the form
  const saveForm = () => {
    builderActions.save(state);
    console.log('Form saved!', state);
  };

  // Export schema
  const exportSchema = () => {
    const json = JSON.stringify(state.schema, null, 2);
    console.log('Exported schema:', json);
    alert('Check console for exported JSON schema');
  };

  return (
    <div style={{ padding: '20px', maxWidth: '700px', margin: '0 auto' }}>
      <h1>Programmatic Form Builder</h1>
      <p>Create and manage forms entirely through code.</p>

      <div style={{ marginBottom: '20px' }}>
        <button onClick={createContactForm} style={{ marginRight: '10px' }}>
          Create Contact Form
        </button>
        <button onClick={updateFieldName} style={{ marginRight: '10px' }}>
          Update Name Field
        </button>
        <button onClick={reorderFields} style={{ marginRight: '10px' }}>
          Reorder Fields
        </button>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <button onClick={saveForm} style={{ marginRight: '10px' }}>
          Save Form
        </button>
        <button onClick={exportSchema}>
          Export Schema (JSON)
        </button>
      </div>

      <div style={{ border: '1px solid #ccc', padding: '10px', minHeight: '200px' }}>
        {state.schema.fields.map((field, index) => (
          <div key={field.id} style={{ marginBottom: '10px', padding: '10px', backgroundColor: '#f5f5f5' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <strong>{index + 1}. {field.label}</strong>
              <span style={{ fontSize: '12px', color: '#666' }}>{field.type}</span>
            </div>
            <div style={{ fontSize: '12px', color: '#888' }}>Name: {field.name}</div>
            {field.required && <div style={{ color: 'red', fontSize: '12px' }}>Required</div>}
            {field.defaultValue !== undefined && (
              <div style={{ fontSize: '12px', color: '#888' }}>
                Default: {typeof field.defaultValue === 'boolean' ? field.defaultValue.toString() : field.defaultValue}
              </div>
            )}
          </div>
        ))}
        {state.schema.fields.length === 0 && (
          <div style={{ color: '#999', textAlign: 'center' }}>No fields yet. Click "Create Contact Form" to start.</div>
        )}
      </div>

      <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f0f0f0', borderRadius: '5px' }}>
        <h3>Form Metadata</h3>
        <div>ID: {state.schema.id}</div>
        <div>Title: {state.schema.title}</div>
        <div>Fields: {state.schema.fields.length}</div>
        <div>Dirty: {state.isDirty ? 'Yes' : 'No'}</div>
        <div>Preview Mode: {state.isPreviewMode ? 'Yes' : 'No'}</div>
      </div>
    </div>
  );
}

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
