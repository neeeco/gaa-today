export interface Match {
  id: string;
  competition: string;
  home_team: string;
  away_team: string;
  home_score: string | null;
  away_score: string | null;
  venue: string | null;
  referee: string | null;
  match_date: string;
  match_time: string | null;
  is_fixture: boolean;
  broadcasting: string | null;
  created_at: string;
  updated_at: string;
} 