import { supabase } from '../lib/supabase';

export const fetchEventReports = async () => {
  const { data, error } = await supabase
    .from('event_reports')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

export const fetchClosingReports = async () => {
  const { data, error } = await supabase
    .from('closing_reports')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

export const fetchActiveEventReportIds = async () => {
  const today = new Date().toLocaleDateString('sv-SE', {
    timeZone: 'Asia/Seoul',
  });

  const { data, error } = await supabase
    .from('ramen_events')
    .select('report_id')
    .gte('ends_at', today);

  if (error) throw error;
  return data;
};
