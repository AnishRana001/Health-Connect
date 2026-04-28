import { useCallback, useState } from 'react';
import api from '../utils/api';

/**
 * Generic hook for API calls with loading + error state management.
 * Usage: const { loading, error, execute } = useApi();
 *        await execute(() => api.post('/some/endpoint', payload));
 */
export const useApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState(null);

  const execute = useCallback(async (fn) => {
    setLoading(true);
    setError(null);
    try {
      const result = await fn();
      return result;
    } catch (err) {
      const message = err?.response?.data?.message || err.message || 'An unexpected error occurred.';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error, execute };
};

/**
 * Hook that fetches data on mount and on manual refetch.
 * Usage: const { data, loading, error, refetch } = useFetch('/endpoint');
 */
export const useFetch = (endpoint, deps = []) => {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);

  const fetch = useCallback(async () => {
    if (!endpoint) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(endpoint);
      setData(res.data);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Failed to load data.');
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint, ...deps]);

  // Fetch on mount
  useState(() => { fetch(); }, [fetch]);

  return { data, loading, error, refetch: fetch };
};
