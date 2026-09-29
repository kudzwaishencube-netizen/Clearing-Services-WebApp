import type { IncomingMessage, ServerResponse } from 'http';

const DEFAULT_VEHICLES = [
  {
    id: 1,
    make: 'Toyota',
    model: 'Hilux Revo',
    year: 2021,
    type: 'Truck',
    price: 35000,
    image: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 2,
    make: 'Mercedes-Benz',
    model: 'C-Class',
    year: 2019,
    type: 'Sedan',
    price: 28000,
    image: 'https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 3,
    make: 'Honda',
    model: 'CR-V',
    year: 2020,
    type: 'SUV',
    price: 22000,
    image: 'https://images.unsplash.com/photo-1568844293986-8d0400bd4745?auto=format&fit=crop&q=80&w=800'
  }
];

export default async function handler(req: any, res: any) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Check if Supabase credentials are configured in Vercel environment
  let supabaseUrl = 
    process.env.VITE_SUPABASE_URL || 
    process.env.NEXT_PUBLIC_SUPABASE_URL || 
    process.env.SUPABASE_URL;

  const supabaseKey = (
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )?.trim();

  if (supabaseUrl) {
    supabaseUrl = supabaseUrl.trim().replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
  }

  if (supabaseUrl && supabaseKey) {
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(supabaseUrl, supabaseKey);

      if (req.method === 'GET') {
        const { data, error } = await supabase.from('vehicles').select('*').order('id', { ascending: false });
        if (!error && data) {
          return res.status(200).json(data);
        }
      }

      if (req.method === 'DELETE' || (req.method === 'POST' && req.body?.action === 'delete')) {
        const rawId = req.query?.id || req.body?.id;
        if (!rawId) {
          return res.status(400).json({ error: 'Missing vehicle id' });
        }
        const numId = Number(rawId);
        const queryId = !isNaN(numId) ? numId : rawId;
        
        let { data, error } = await supabase.from('vehicles').delete().eq('id', queryId).select();
        
        // Fallback with string ID if 0 rows matched
        if (!error && (!data || data.length === 0)) {
          const retry = await supabase.from('vehicles').delete().eq('id', String(rawId)).select();
          if (retry.data && retry.data.length > 0) {
            data = retry.data;
          }
          if (retry.error) {
            error = retry.error;
          }
        }

        if (!error) {
          return res.status(200).json({ success: true, deleted: data });
        }
        return res.status(400).json({ error: error?.message || 'Failed to delete' });
      }

      if (req.method === 'POST') {
        const { data, error } = await supabase.from('vehicles').insert([req.body]).select().single();
        if (!error && data) {
          return res.status(200).json(data);
        }
        return res.status(400).json({ error: error?.message || 'Failed to add' });
      }
    } catch (e: any) {
      console.error('Supabase serverless error:', e);
    }
  }

  // Fallback for Vercel if no database configured
  if (req.method === 'GET') {
    return res.status(200).json(DEFAULT_VEHICLES);
  }

  return res.status(200).json({ success: true, message: 'Received' });
}
