import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export function useQuery<T>(
  table: string,
  options?: {
    select?: string;
    orderBy?: string;
    ascending?: boolean;
    filter?: { column: string; value: any };
    filters?: Array<{ column: string; value: any }>;
  }
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      let query = supabase
        .from(table)
        .select(options?.select || '*');

      if (options?.filter) {
        query = query.eq(options.filter.column, options.filter.value);
      }

      if (options?.filters) {
        for (const f of options.filters) {
          query = query.eq(f.column, f.value);
        }
      }

      if (options?.orderBy) {
        query = query.order(options.orderBy, {
          ascending: options?.ascending ?? true,
        });
      }

      const { data: result, error } = await query;
      if (error) throw error;
      setData((result as T[]) || []);
    } catch (err) {
      console.error(`Error fetching ${table}:`, err);
    } finally {
      setLoading(false);
    }
  }, [table]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, refetch: fetchData };
}

export function useSingle<T>(table: string, select?: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const { data: result, error } = await supabase
        .from(table)
        .select(select || '*')
        .single();

      if (error) throw error;
      setData(result as T);
    } catch (err) {
      console.error(`Error fetching ${table}:`, err);
    } finally {
      setLoading(false);
    }
  }, [table, select]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, refetch: fetchData };
}

export async function insertRow(table: string, data: any) {
  const { data: result, error } = await supabase.from(table).insert(data).select().single();
  if (error) throw error;
  return result;
}
