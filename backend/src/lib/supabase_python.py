import os
from supabase import create_client, Client
from datetime import datetime

supabase_url = os.environ.get('SUPABASE_URL')
supabase_key = os.environ.get('SUPABASE_SERVICE_KEY')

if not supabase_url or not supabase_key:
    raise ValueError('Missing Supabase credentials')

supabase: Client = create_client(supabase_url, supabase_key)

def add_live_update(match_id: str, minute: int, home_score: str, away_score: str, update_text: str, is_final: bool = False):
    try:
        data = {
            'match_id': match_id,
            'minute': minute,
            'home_score': home_score,
            'away_score': away_score,
            'update_text': update_text,
            'is_final': is_final
        }
        result = supabase.table('live_updates').insert(data).execute()
        return result.data
    except Exception as e:
        print(f"Error adding live update: {e}")
        return None

def get_match_id(home_team: str, away_team: str, match_date: str) -> str:
    try:
        result = supabase.table('matches')\
            .select('id')\
            .eq('home_team', home_team)\
            .eq('away_team', away_team)\
            .eq('match_date', match_date)\
            .single()\
            .execute()
        return result.data['id'] if result.data else None
    except Exception as e:
        print(f"Error getting match ID: {e}")
        return None 