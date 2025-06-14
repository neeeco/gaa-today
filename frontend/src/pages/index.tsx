import { useEffect, useState } from 'react';
import { supabase } from './_app';
import type { Match } from '../types/supabase';
import LiveScores from '../components/LiveScores';

export default function Home() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMatches() {
      try {
        console.log('Fetching matches from Supabase...');
        const { data, error } = await supabase
          .from('matches')
          .select('*')
          .order('match_date', { ascending: true });

        if (error) {
          console.error('Supabase error:', error);
          throw error;
        }

        console.log('Received data:', data);
        setMatches(data || []);
      } catch (error) {
        console.error('Error fetching matches:', error);
        setError(error instanceof Error ? error.message : 'Failed to fetch matches');
      } finally {
        setLoading(false);
      }
    }

    fetchMatches();
  }, []);

  if (loading) return <div className="text-center py-4">Loading...</div>;
  if (error) return <div className="text-center py-4 text-red-500">{error}</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">GAA Today</h1>
      
      {/* Live Scores Section */}
      <LiveScores />

      {/* All Matches Section */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-4">All Matches</h2>
        <div className="space-y-4">
          {matches.map((match) => (
            <div key={match.id} className="bg-white rounded-lg shadow p-4">
              <div className="flex justify-between items-center">
                <div className="flex-1">
                  <div className="font-semibold">{match.home_team}</div>
                  <div className="font-semibold">{match.away_team}</div>
                </div>
                <div className="text-center">
                  {match.is_fixture ? (
                    <div className="text-sm text-gray-500">
                      {match.match_time || 'TBD'}
                    </div>
                  ) : (
                    <div className="text-2xl font-bold">
                      {match.home_score} - {match.away_score}
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-2 text-sm text-gray-600">
                <div>{match.competition}</div>
                {match.venue && <div>Venue: {match.venue}</div>}
                {match.referee && <div>Referee: {match.referee}</div>}
                {match.broadcasting && <div>Broadcasting: {match.broadcasting}</div>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 