// API functions for fetching and saving week data
import { supabase } from './supabase';
import type { WeekData } from '../App';

export async function getWeekData(userId: string, weekStart: string): Promise<WeekData | null> {
  const { data, error } = await supabase
    .from('weekly_entries')
    .select('*')
    .eq('user_id', userId)
    .eq('week_start', weekStart)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No row found - return null (week doesn't exist yet)
      return null;
    }
    console.error('Error fetching week data:', error);
    throw error;
  }

  // Transform database format to app format
  const events = (data.events as any) || [];
  // Convert date strings back to Date objects
  const eventsWithDates = events.map((event: any) => ({
    ...event,
    date: event.date ? new Date(event.date) : new Date()
  }));

  return {
    habits: (data.habits as any) || { trackers: [], completed: {} },
    moods: data.moods || [0, 0, 0, 0, 0, 0, 0],
    meals: (data.meals as any) || {},
    events: eventsWithDates,
    grateful: data.grateful || '',
    comment: data.comment || '',
  };
}

export async function saveWeekData(
  userId: string,
  weekStart: string,
  weekData: WeekData
): Promise<void> {
  const { error } = await supabase
    .from('weekly_entries')
    .upsert({
      user_id: userId,
      week_start: weekStart,
      habits: weekData.habits,
      moods: weekData.moods,
      meals: weekData.meals,
      events: weekData.events,
      grateful: weekData.grateful,
      comment: weekData.comment,
    }, {
      onConflict: 'user_id,week_start',
    });

  if (error) {
    console.error('Error saving week data:', error);
    throw error;
  }
}

export async function getAllWeekKeys(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('weekly_entries')
    .select('week_start')
    .eq('user_id', userId)
    .order('week_start', { ascending: false });

  if (error) {
    console.error('Error fetching week keys:', error);
    throw error;
  }

  return data.map(row => row.week_start);
}

export async function getMultipleWeeksData(
  userId: string,
  weekStarts: string[]
): Promise<Array<{ weekStart: string; data: WeekData }>> {
  if (weekStarts.length === 0) return [];

  const { data, error } = await supabase
    .from('weekly_entries')
    .select('*')
    .eq('user_id', userId)
    .in('week_start', weekStarts)
    .order('week_start', { ascending: false });

  if (error) {
    console.error('Error fetching multiple weeks data:', error);
    throw error;
  }

  return (data || []).map((row: any) => {
    const events = (row.events as any) || [];
    const eventsWithDates = events.map((event: any) => ({
      ...event,
      date: event.date ? new Date(event.date) : new Date()
    }));

    return {
      weekStart: row.week_start,
      data: {
        habits: (row.habits as any) || { trackers: [], completed: {} },
        moods: row.moods || [0, 0, 0, 0, 0, 0, 0],
        meals: (row.meals as any) || {},
        events: eventsWithDates,
        grateful: row.grateful || '',
        comment: row.comment || '',
      }
    };
  });
}
