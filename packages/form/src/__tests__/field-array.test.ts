import { describe, it, expect, beforeEach } from 'vitest';
import { createStore } from '@nexus-state/core';
import { createForm } from '../create-form';

describe('Field Arrays', () => {
  let store: ReturnType<typeof createStore>;

  beforeEach(() => {
    store = createStore();
  });

  it('should create field array from initial values', () => {
    const form = createForm(store, {
      initialValues: {
        tags: ['tag1', 'tag2', 'tag3']
      },
      onSubmit: () => {}
    });

    const tagsArray = form.fieldArray('tags', '');

    expect(tagsArray.fields).toEqual(['tag1', 'tag2', 'tag3']);
    expect(tagsArray.length).toBe(3);
  });

  it('should append item to array', () => {
    const form = createForm(store, {
      initialValues: {
        tags: ['tag1']
      },
      onSubmit: () => {}
    });

    const tagsArray = form.fieldArray('tags', '');
    tagsArray.append('tag2');

    expect(tagsArray.fields).toEqual(['tag1', 'tag2']);
    expect(form.values.tags).toEqual(['tag1', 'tag2']);
  });

  it('should prepend item to array', () => {
    const form = createForm(store, {
      initialValues: {
        tags: ['tag2']
      },
      onSubmit: () => {}
    });

    const tagsArray = form.fieldArray('tags', '');
    tagsArray.prepend('tag1');

    expect(tagsArray.fields).toEqual(['tag1', 'tag2']);
  });

  it('should insert item at specific index', () => {
    const form = createForm(store, {
      initialValues: {
        tags: ['tag1', 'tag3']
      },
      onSubmit: () => {}
    });

    const tagsArray = form.fieldArray('tags', '');
    tagsArray.insert(1, 'tag2');

    expect(tagsArray.fields).toEqual(['tag1', 'tag2', 'tag3']);
  });

  it('should remove item at index', () => {
    const form = createForm(store, {
      initialValues: {
        tags: ['tag1', 'tag2', 'tag3']
      },
      onSubmit: () => {}
    });

    const tagsArray = form.fieldArray('tags', '');
    tagsArray.remove(1);

    expect(tagsArray.fields).toEqual(['tag1', 'tag3']);
  });

  it('should swap two items', () => {
    const form = createForm(store, {
      initialValues: {
        tags: ['tag1', 'tag2', 'tag3']
      },
      onSubmit: () => {}
    });

    const tagsArray = form.fieldArray('tags', '');
    tagsArray.swap(0, 2);

    expect(tagsArray.fields).toEqual(['tag3', 'tag2', 'tag1']);
  });

  it('should move item from one index to another', () => {
    const form = createForm(store, {
      initialValues: {
        tags: ['tag1', 'tag2', 'tag3']
      },
      onSubmit: () => {}
    });

    const tagsArray = form.fieldArray('tags', '');
    tagsArray.move(0, 2);

    expect(tagsArray.fields).toEqual(['tag2', 'tag3', 'tag1']);
  });

  it('should replace entire array', () => {
    const form = createForm(store, {
      initialValues: {
        tags: ['old1', 'old2']
      },
      onSubmit: () => {}
    });

    const tagsArray = form.fieldArray('tags', '');
    tagsArray.replace(['new1', 'new2', 'new3']);

    expect(tagsArray.fields).toEqual(['new1', 'new2', 'new3']);
  });

  it('should clear array', () => {
    const form = createForm(store, {
      initialValues: {
        tags: ['tag1', 'tag2']
      },
      onSubmit: () => {}
    });

    const tagsArray = form.fieldArray('tags', '');
    tagsArray.clear();

    expect(tagsArray.fields).toEqual([]);
    expect(tagsArray.length).toBe(0);
  });

  it('should get field at index', () => {
    const form = createForm(store, {
      initialValues: {
        tags: ['tag1', 'tag2']
      },
      onSubmit: () => {}
    });

    const tagsArray = form.fieldArray('tags', '');
    const field0 = tagsArray.field(0);

    expect(field0?.value).toBe('tag1');
  });

  it('should update field value in array', () => {
    const form = createForm(store, {
      initialValues: {
        tags: ['tag1', 'tag2']
      },
      onSubmit: () => {}
    });

    const tagsArray = form.fieldArray('tags', '');
    const field0 = tagsArray.field(0);

    field0?.setValue('updated');

    expect(tagsArray.fields[0]).toBe('updated');
    expect(form.values.tags[0]).toBe('updated');
  });

  it('should work with complex objects', () => {
    interface Address {
      street: string;
      city: string;
    }

    const form = createForm(store, {
      initialValues: {
        addresses: [
          { street: '123 Main St', city: 'NYC' }
        ] as Address[]
      },
      onSubmit: () => {}
    });

    const addressesArray = form.fieldArray('addresses', {
      street: '',
      city: ''
    });

    addressesArray.append({ street: '456 Oak Ave', city: 'LA' });

    expect(addressesArray.fields).toHaveLength(2);
    expect(addressesArray.fields[1].city).toBe('LA');
  });

  it('should throw error for non-array field', () => {
    const form = createForm(store, {
      initialValues: {
        name: 'John'
      },
      onSubmit: () => {}
    });

    expect(() => {
      form.fieldArray('name' as any, '');
    }).toThrow('Field "name" is not an array');
  });

  it('should handle remove with invalid index gracefully', () => {
    const form = createForm(store, {
      initialValues: {
        tags: ['tag1', 'tag2']
      },
      onSubmit: () => {}
    });

    const tagsArray = form.fieldArray('tags', '');
    
    // Should not throw for out of bounds
    tagsArray.remove(-1);
    tagsArray.remove(10);
    
    expect(tagsArray.fields).toEqual(['tag1', 'tag2']);
  });

  it('should handle swap with invalid indices gracefully', () => {
    const form = createForm(store, {
      initialValues: {
        tags: ['tag1', 'tag2']
      },
      onSubmit: () => {}
    });

    const tagsArray = form.fieldArray('tags', '');
    
    // Should not throw for out of bounds
    tagsArray.swap(-1, 1);
    tagsArray.swap(0, 10);
    
    expect(tagsArray.fields).toEqual(['tag1', 'tag2']);
  });

  it('should handle move with invalid indices gracefully', () => {
    const form = createForm(store, {
      initialValues: {
        tags: ['tag1', 'tag2']
      },
      onSubmit: () => {}
    });

    const tagsArray = form.fieldArray('tags', '');
    
    // Should not throw for out of bounds
    tagsArray.move(-1, 1);
    tagsArray.move(0, 10);
    
    expect(tagsArray.fields).toEqual(['tag1', 'tag2']);
  });

  it('should return undefined for field at invalid index', () => {
    const form = createForm(store, {
      initialValues: {
        tags: ['tag1', 'tag2']
      },
      onSubmit: () => {}
    });

    const tagsArray = form.fieldArray('tags', '');
    const invalidField = tagsArray.field(10);
    
    expect(invalidField).toBeUndefined();
  });
});
