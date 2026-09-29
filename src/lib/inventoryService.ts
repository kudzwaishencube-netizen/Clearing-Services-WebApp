import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Vehicle, DEFAULT_VEHICLES } from '../data/defaultVehicles';

const STORAGE_KEY = 'anchor_saved_vehicles';
const SUPABASE_CONFIG_KEY = 'anchor_supabase_config';

function cleanSupabaseUrl(url: string | undefined): string | null {
  if (!url) return null;
  let clean = url.trim();
  clean = clean.replace(/\/rest\/v1\/?$/, '');
  clean = clean.replace(/\/+$/, '');
  return clean.startsWith('https://') ? clean : null;
}

function getSupabaseClient(): SupabaseClient | null {
  // 1. Check environment variables (Vercel production environment)
  const envUrl = cleanSupabaseUrl(
    import.meta.env.VITE_SUPABASE_URL ||
    (import.meta.env as any).NEXT_PUBLIC_SUPABASE_URL
  );
  const envKey = (
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    import.meta.env.VITE_SUPABASE_ANON_KEY ||
    (import.meta.env as any).NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    (import.meta.env as any).NEXT_PUBLIC_SUPABASE_ANON_KEY
  )?.trim();

  if (envUrl && envKey) {
    return createClient(envUrl, envKey);
  }

  // 2. Check saved credentials in localStorage
  try {
    const savedConfig = localStorage.getItem(SUPABASE_CONFIG_KEY);
    if (savedConfig) {
      const parsed = JSON.parse(savedConfig);
      const url = cleanSupabaseUrl(parsed.url);
      const key = parsed.key?.trim();
      if (url && key) {
        return createClient(url, key);
      }
    }
  } catch (e) {
    // Ignore JSON parse errors
  }

  return null;
}

export const inventoryService = {
  isCloudConnected(): boolean {
    return getSupabaseClient() !== null;
  },

  getCloudConfig(): { url: string; key: string } | null {
    try {
      const envUrl = import.meta.env.VITE_SUPABASE_URL;
      const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      if (envUrl && envKey) return { url: envUrl, key: envKey };

      const saved = localStorage.getItem(SUPABASE_CONFIG_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      // Ignore
    }
    return null;
  },

  saveCloudConfig(url: string, key: string) {
    localStorage.setItem(SUPABASE_CONFIG_KEY, JSON.stringify({ url: url.trim(), key: key.trim() }));
  },

  removeCloudConfig() {
    localStorage.removeItem(SUPABASE_CONFIG_KEY);
  },

  async getVehicles(): Promise<Vehicle[]> {
    const supabase = getSupabaseClient();

    // 1. If Supabase is connected, fetch from cloud database (Shared across ALL devices!)
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('vehicles')
          .select('*')
          .order('id', { ascending: false });

        if (!error && data && data.length > 0) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
          return data as Vehicle[];
        }

        // If table is empty, seed initial vehicles into Supabase
        if (!error && data && data.length === 0) {
          await supabase.from('vehicles').insert(DEFAULT_VEHICLES);
          return DEFAULT_VEHICLES;
        }
      } catch (err) {
        console.warn('Supabase fetch failed, falling back:', err);
      }
    }

    // 2. Try Node/Express server API (local development)
    try {
      const response = await fetch('/api/vehicles');
      const contentType = response.headers.get('content-type') || '';
      if (response.ok && contentType.includes('application/json')) {
        const data = await response.json();
        if (Array.isArray(data)) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
          return data;
        }
      }
    } catch (err) {
      // Backend not running (e.g. static Vercel build)
    }

    // 3. Fallback to cached vehicles or default list
    try {
      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      // Ignore
    }

    return DEFAULT_VEHICLES;
  },

  async addVehicle(vehicleData: Omit<Vehicle, 'id'>): Promise<{ success: boolean; vehicle?: Vehicle; error?: string }> {
    const supabase = getSupabaseClient();

    // 1. If Supabase connected, insert into cloud database
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('vehicles')
          .insert([vehicleData])
          .select()
          .single();

        if (error) {
          return { success: false, error: error.message };
        }

        if (data) {
          const current = await this.getVehicles();
          localStorage.setItem(STORAGE_KEY, JSON.stringify([data, ...current]));
          return { success: true, vehicle: data as Vehicle };
        }
      } catch (err: any) {
        return { success: false, error: err.message || 'Cloud database write error' };
      }
    }

    // 2. Try Node/Express server API (local development)
    let serverSuccess = false;
    let createdVehicle: Vehicle | null = null;
    try {
      const response = await fetch('/api/vehicles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(vehicleData)
      });
      const contentType = response.headers.get('content-type') || '';
      if (response.ok && contentType.includes('application/json')) {
        const result = await response.json();
        serverSuccess = true;
        createdVehicle = {
          ...vehicleData,
          id: result.id || Date.now()
        };
      }
    } catch (err) {
      // Backend unavailable
    }

    // 3. Fallback to local storage (note: only affects current device unless cloud DB configured)
    if (!createdVehicle) {
      createdVehicle = {
        ...vehicleData,
        id: Date.now()
      };
    }

    try {
      const cached = localStorage.getItem(STORAGE_KEY);
      const currentList: Vehicle[] = cached ? JSON.parse(cached) : DEFAULT_VEHICLES;
      const updated = [createdVehicle, ...currentList.filter(v => v.id !== createdVehicle!.id)];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      // Ignore
    }

    return { 
      success: true, 
      vehicle: createdVehicle,
      error: !supabase && !serverSuccess ? 'SAVED_LOCALLY_ONLY' : undefined
    };
  },

  async deleteVehicle(id: number): Promise<{ success: boolean; error?: string }> {
    const supabase = getSupabaseClient();

    // 1. If Supabase connected, delete from cloud database
    if (supabase) {
      try {
        const { error } = await supabase
          .from('vehicles')
          .delete()
          .eq('id', id);

        if (error) {
          return { success: false, error: error.message };
        }
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    }

    // 2. Try server API
    try {
      let response = await fetch(`/api/vehicles/${id}`, { method: 'DELETE' });
      if (!response.ok && response.status !== 404) {
        await fetch(`/api/vehicles/${id}/delete`, { method: 'POST' });
      }
    } catch (err) {
      // Backend unavailable
    }

    // 3. Update local cache
    try {
      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached) {
        const currentList: Vehicle[] = JSON.parse(cached);
        const updated = currentList.filter(v => v.id !== id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      }
    } catch (e) {
      // Ignore
    }

    return { success: true };
  }
};
