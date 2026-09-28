import { useState, useEffect, useRef } from 'react';

function getSessionStorageValue(key, initialValue) {
  if (typeof window === 'undefined') {
    return initialValue instanceof Function ? initialValue() : initialValue;
  }
  const savedValue = sessionStorage.getItem(key);
  if (savedValue !== null) {
    try {
      return JSON.parse(savedValue);
    } catch (error) {
      console.error(`Error parsing sessionStorage key “${key}”:`, error);
      return initialValue instanceof Function ? initialValue() : initialValue;
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
  const currentKeyRef = useRef(key);

  useEffect(() => {
    if (currentKeyRef.current !== key) {
      currentKeyRef.current = key;
      setValue(getSessionStorageValue(key, initialValue));
    }
  }, [key, initialValue]);

  useEffect(() => {
    if (currentKeyRef.current === key) {
      try {
        sessionStorage.setItem(key, JSON.stringify(value));
      } catch (error) {
        console.error(`Error setting sessionStorage key “${key}”:`, error);
      }
    }
  }, [key, value]);

  return [value, setValue];
}