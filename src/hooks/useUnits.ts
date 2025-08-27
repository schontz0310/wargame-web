import { useState, useEffect } from 'react';
import { apiService, Unit } from '@/lib/api';

export function useUnits() {
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUnits = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('useUnits - Starting to fetch units...');
        const data = await apiService.getAllUnits();
        console.log('useUnits - Fetched units:', data.length);
        setUnits(data);
      } catch (err) {
        console.error('useUnits - Error fetching units:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch units');
      } finally {
        setLoading(false);
      }
    };

    fetchUnits();
  }, []);

  const refetch = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getAllUnits();
      setUnits(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch units');
    } finally {
      setLoading(false);
    }
  };

  return { units, loading, error, refetch };
}

export function useUnit(id: string) {
  const [unit, setUnit] = useState<Unit | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchUnit = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await apiService.getUnit(id);
        setUnit(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch unit');
      } finally {
        setLoading(false);
      }
    };

    fetchUnit();
  }, [id]);

  return { unit, loading, error };
}
