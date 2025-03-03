import { useState, useEffect } from 'react';
import { loadServerIP } from '@/src/common/serverManager';

export const useServerIP = (navigation) => {
  const [serverIP, setServerIP] = useState(null);
  const [error, setError] = useState(null);

  const loadInitialIP = async () => {
    try {
      const ip = await loadServerIP();
      if (ip) {
        setServerIP(ip);
        setError(null);
      }
    } catch (error) {
      console.error('Error loading server IP:', error);
      setError('Failed to load server IP');
    }
  };

  useEffect(() => {
    loadInitialIP();
  }, []);

  useEffect(() => {
    if (navigation) {
      const unsubscribe = navigation.addListener('focus', loadInitialIP);
      return unsubscribe;
    }
  }, [navigation]);

  return {
    serverIP,
    setServerIP,
    error,
    setError,
    loadInitialIP,
  };
};
