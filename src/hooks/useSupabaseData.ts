import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

type FetchOptions = {
  table: string;
  columns?: string;
  filters?: Record<string, any>;
  orderBy?: { column: string; ascending?: boolean };
  limit?: number;
  page?: number;
};

export function useSupabaseData<T>({
  table,
  columns = "*",
  filters = {},
  orderBy,
  limit,
  page = 1,
}: FetchOptions) {
  const [data, setData] = useState<T[]>([]);
  const [count, setCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Build the query
        let query = supabase.from(table).select(columns, { count: "exact" });

        // Apply filters
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== "") {
            query = query.eq(key, value);
          }
        });

        // Apply ordering
        if (orderBy) {
          query = query.order(orderBy.column, {
            ascending: orderBy.ascending ?? true,
          });
        }

        // Apply pagination
        if (limit) {
          const start = (page - 1) * limit;
          query = query.range(start, start + limit - 1);
        }

        // Execute the query
        const { data: result, error: err, count: totalCount } = await query;

        if (err) {
          throw new Error(err.message);
        }

        setData(result as T[]);
        if (totalCount !== null) {
          setCount(totalCount);
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "An error occurred while fetching data",
        );
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [
    table,
    columns,
    JSON.stringify(filters),
    orderBy?.column,
    orderBy?.ascending,
    limit,
    page,
  ]);

  return { data, count, loading, error };
}

export async function createSupabaseRecord<T>(table: string, data: Partial<T>) {
  try {
    const { data: result, error } = await supabase
      .from(table)
      .insert([data])
      .select();

    if (error) throw error;
    return result[0];
  } catch (error) {
    console.error(`Error creating ${table} record:`, error);
    throw error;
  }
}

export async function updateSupabaseRecord<T>(
  table: string,
  id: string,
  data: Partial<T>,
) {
  try {
    const { data: result, error } = await supabase
      .from(table)
      .update(data)
      .eq("id", id)
      .select();

    if (error) throw error;
    return result[0];
  } catch (error) {
    console.error(`Error updating ${table} record:`, error);
    throw error;
  }
}

export async function deleteSupabaseRecord(table: string, id: string) {
  try {
    const { error } = await supabase.from(table).delete().eq("id", id);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error(`Error deleting ${table} record:`, error);
    throw error;
  }
}
