import { useEffect, useState } from 'react';
import { supabase } from '../pages/_app';
import type { Match } from '../types/supabase';

interface LiveUpdate {
  id: string;
  match_id: string;
  minute: number;
  home_score: string;
  away_score: string;
  update_text: string;
  is_final: boolean;
  created_at: string;
}

export default function LiveScores() {
  const [liveMatches, setLiveMatches] = useState<Match[]>([]);
  const [liveUpdates, setLiveUpdates] = useState<Record<string, LiveUpdate[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLiveMatches() {
      try {
        // Get today's matches
        const today = new Date().toISOString().split('T')[0];
        const { data: matches, error: matchesError } = await supabase
          .from('matches')
          .select('*')
          .eq('match_date', today)
          .order('match_time', { ascending: true });

        if (matchesError) throw matchesError;

        // Get live updates for each match
        const updates: Record<string, LiveUpdate[]> = {};
        for (const match of matches) {
          const { data: matchUpdates, error: updatesError } = await supabase
            .from('live_updates')
            .select('*')
            .eq('match_id', match.id)
            .order('created_at', { ascending: true });

          if (updatesError) throw updatesError;
          if (matchUpdates && matchUpdates.length > 0) {
            updates[match.id] = matchUpdates;
          }
        }

        setLiveMatches(matches);
        setLiveUpdates(updates);
      } catch (error) {
        console.error('Error fetching live matches:', error);
        setError(error instanceof Error ? error.message : 'Failed to fetch live matches');
      } finally {
        setLoading(false);
      }
    }

    fetchLiveMatches();
    // Refresh every 30 seconds
    const interval = setInterval(fetchLiveMatches, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div className="text-center py-4">Loading live scores...</div>;
  if (error) return <div className="text-center py-4 text-red-500">{error}</div>;
  if (liveMatches.length === 0) return <div className="text-center py-4">No live matches today</div>;

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold mb-4">Live Scores</h2>
      {liveMatches.map((match) => {
        const updates = liveUpdates[match.id] || [];
        const latestUpdate = updates[updates.length - 1];
        
        return (
          <div key={match.id} className="bg-white rounded-lg shadow p-4">
            <div className="flex justify-between items-center mb-2">
              <div className="flex-1">
                <div className="font-semibold">{match.home_team}</div>
                <div className="font-semibold">{match.away_team}</div>
              </div>
              <div className="text-center">
                {latestUpdate ? (
                  <>
                    <div className="text-2xl font-bold">
                      {latestUpdate.home_score} - {latestUpdate.away_score}
                    </div>
                    <div className="text-sm text-gray-500">
                      {latestUpdate.minute}'
                      {latestUpdate.is_final && ' (FT)'}
                    </div>
                  </>
                ) : (
                  <div className="text-sm text-gray-500">
                    {match.match_time || 'TBD'}
                  </div>
                )}
              </div>
            </div>
            {latestUpdate && (
              <div className="text-sm text-gray-600 mt-2">
                {latestUpdate.update_text}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
} 