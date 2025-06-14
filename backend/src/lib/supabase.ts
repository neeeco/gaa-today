import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase credentials');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

export interface Match {
  id?: string;
  competition: string;
  home_team: string;
  away_team: string;
  home_score?: string;
  away_score?: string;
  venue?: string;
  referee?: string;
  match_date: string;
  match_time?: string;
  is_fixture: boolean;
  broadcasting?: string;
  created_at?: string;
  updated_at?: string;
}

export interface LiveUpdate {
  id?: string;
  match_id: string;
  minute: number;
  home_score: string;
  away_score: string;
  update_text: string;
  is_final: boolean;
  created_at?: string;
}

export const matchDatabase = {
  async upsertMatch(match: Match) {
    const { data, error } = await supabase
      .from('matches')
      .upsert(match, {
        onConflict: 'home_team,away_team,match_date'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async addLiveUpdate(update: LiveUpdate) {
    const { data, error } = await supabase
      .from('live_updates')
      .insert(update)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getMatches(date?: string) {
    let query = supabase
      .from('matches')
      .select('*')
      .order('match_date', { ascending: true });

    if (date) {
      query = query.eq('match_date', date);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  async getLiveUpdates(matchId: string) {
    const { data, error } = await supabase
      .from('live_updates')
      .select('*')
      .eq('match_id', matchId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data;
  },

  async getLastScrapeTime() {
    const { data, error } = await supabase
      .from('scrape_history')
      .select('last_scrape_time')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) throw error;
    return data?.last_scrape_time;
  },

  async updateLastScrapeTime() {
    const { error } = await supabase
      .from('scrape_history')
      .insert({
        last_scrape_time: new Date().toISOString()
      });

    if (error) throw error;
  }
}; 