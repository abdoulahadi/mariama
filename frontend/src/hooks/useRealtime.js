// src/hooks/useRealtime.js
import { useState, useEffect } from 'react';
import { onSocketEvent, offSocketEvent } from '../services/socket';

export const useRealtime = (eventName) => {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleData = (newData) => {
      setData(newData);
      setError(null);
    };

    const handleError = (err) => {
      setError(err);
    };

    onSocketEvent(eventName, handleData);
    onSocketEvent('error', handleError);

    return () => {
      offSocketEvent(eventName, handleData);
      offSocketEvent('error', handleError);
    };
  }, [eventName]);

  return { data, error };
};
