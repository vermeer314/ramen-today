import { supabase } from '../lib/supabase';

//이벤트 제보
export const fetchEventReports = async () => {
  const { data, error } = await supabase
    .from('event_reports')
    .select('*')
    .order('created_at', { ascending: false }); //최신순 정렬

  if (error) throw error;
  return data;
};

//영업 변동 제보
export const fetchClosingReports = async () => {
  const { data, error } = await supabase
    .from('closing_reports')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};
