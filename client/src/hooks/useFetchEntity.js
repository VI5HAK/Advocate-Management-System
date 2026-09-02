import { useState, useEffect, useCallback } from "react";

/**
 * A custom hook to fetch data using an async service method.
 *
 * @param {Function} fetchFn - Async function returning a response with data.
 * @param {Array} deps - Dependency array that triggers refetching when values change.
 * @param {boolean} autoFetch - Whether to automatically trigger fetch on mount (default true).
 */
export function useFetchEntity(fetchFn, deps = [], autoFetch = true) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(autoFetch);
  const [error, setError] = useState("");

  const execute = useCallback(async (...args) => {
    setLoading(true);
    setError("");
    try {
      const response = await fetchFn(...args);
      const resData = response?.data !== undefined ? response.data : response;
      setData(resData);
      return resData;
    } catch (err) {
      console.error("useFetchEntity error:", err);
      const msg = err.response?.data?.message || err.message || "An unexpected error occurred.";
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchFn]);

  useEffect(() => {
    if (autoFetch && fetchFn) {
      execute().catch(() => {});
    }
  }, [execute, autoFetch, ...deps]);

  return {
    data,
    setData,
    loading,
    error,
    setError,
    refetch: execute,
  };
}

export default useFetchEntity;
