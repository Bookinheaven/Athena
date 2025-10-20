import { useState, useEffect } from 'react';

function getSessionStorageValue(key, initialValue) {
  if (typeof window === 'undefined') {
    return initialValue;
  }
  const savedValue = sessionStorage.getItem(key);
  if (savedValue !== null) {
    try {
      return JSON.parse(savedValue);
    } catch (error) {
      console.error(`Error parsing sessionStorage key “${key}”:`, error);
      return initialValue;
    }
  }

  if (initialValue instanceof Function) {
    return initialValue();
  }
  return initialValue;
}

export function useSessionStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    return getSessionStorageValue(key, initialValue);
  });

  useEffect(() => {
    try {
      sessionStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error setting sessionStorage key “${key}”:`, error);
    }
  }, [key, value]);

  return [value, setValue];
}