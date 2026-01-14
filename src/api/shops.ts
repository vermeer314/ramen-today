import { supabase } from '../utils/supabase';
import type { Shop } from '../types';

export const getShops = async (): Promise<Shop[]> => {
  const { data, error } = await supabase
    .from('shops')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data as Shop[];
};
