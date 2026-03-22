// Storage keys for localStorage
export const STORAGE_KEY = 'multi-step-form-data';
export const STORAGE_STEP_KEY = 'multi-step-form-step';

// Generic localStorage helpers
export const loadFromStorage = <T>(key: string): T | null => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  } catch (error) {
    console.error(`Error loading from localStorage (${key}):`, error);
    return null;
  }
};

export const saveToStorage = <T>(key: string, value: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error saving to localStorage (${key}):`, error);
  }
};

export const removeFromStorage = (key: string): void => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`Error removing from localStorage (${key}):`, error);
  }
};

// Clear all form data from storage
export const clearFormData = (): void => {
  removeFromStorage(STORAGE_KEY);
  removeFromStorage(STORAGE_STEP_KEY);
};
