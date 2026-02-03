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
  return {
    habits: (data.habits as any) || { trackers: [], completed: {} },
    moods: data.moods || [0, 0, 0, 0, 0, 0, 0],
    meals: (data.meals as any) || {},
    events: (data.events as any) || [],
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
