// React hook for managing week data with database persistence
import { useState, useEffect, useCallback } from 'react';
import { getWeekData, saveWeekData } from '../lib/weekDataApi';
import { auth } from '../lib/supabase';
import type { WeekData } from '../App';

export function useWeekData(weekKey: string) {
  const [data, setData] = useState<WeekData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // Get current user
  useEffect(() => {
    async function fetchUser() {
      const user = await auth.getCurrentUser();
      setUserId(user?.id || null);
    }
    fetchUser();
  }, []);

  // Load data when weekKey or userId changes
  useEffect(() => {
    if (!userId || !weekKey) {
      setLoading(false);
      return;
    }

    async function loadData() {
      try {
        setLoading(true);
        setError(null);
        const weekData = await getWeekData(userId, weekKey);
        setData(weekData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
        console.error('Error loading week data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [userId, weekKey]);

  // Save data function with debouncing
  const saveData = useCallback(async (newData: WeekData) => {
    if (!userId || !weekKey) return;

    setSaving(true);
    try {
      await saveWeekData(userId, weekKey, newData);
      setData(newData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save data');
      console.error('Error saving week data:', err);
    } finally {
      setSaving(false);
    }
  }, [userId, weekKey]);

  // Update data locally and save to database
  const updateData = useCallback((updater: (data: WeekData) => WeekData) => {
    if (!data) return;

    const newData = updater(data);
    setData(newData);
    
    // Debounce save operation
    const timeoutId = setTimeout(() => {
      saveData(newData);
    }, 1000); // Save 1 second after last change

    return () => clearTimeout(timeoutId);
  }, [data, saveData]);

  return {
    data,
    loading,
    saving,
    error,
    updateData,
    saveData,
    isAuthenticated: !!userId,
  };
}
