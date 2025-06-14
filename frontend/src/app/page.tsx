'use client';

import { useEffect, useState, useMemo } from 'react';
import Image from 'next/image';
import { createClient } from '@supabase/supabase-js';
import { Match, GroupTeam, Group } from '../types/matches';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase credentials');
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Helper function to determine if a match is hurling
function isHurlingMatch(match: Match): boolean {
  if (!match?.competition) return false;
  const compLower = match.competition.toLowerCase();
  return compLower.includes('hurling') || 
         compLower.includes('camán') || 
         compLower.includes('iomaint') ||
         compLower.includes('camogie');
}

// Helper function to determine if a match is senior football
function isFootballMatch(match: Match): boolean {
  if (!match?.competition) return false;
  const compLower = match.competition.toLowerCase();
  return compLower.includes('senior') && 
         (compLower.includes('football') || 
          compLower.includes('peil') ||
          compLower.includes('ladies football') ||
          compLower.includes('gaelic football')) &&
         !isHurlingMatch(match);
}

// Helper function to parse match date
function parseMatchDate(match: Match): Date {
  if (!match?.date) return new Date();
  
  try {
    const { date, time } = match;
    const dateMatch = date.match(/(\w+)\s+(\d{1,2})\s+(\w+)/);
    if (!dateMatch) return new Date();
    
    const day = parseInt(dateMatch[2]);
    const monthStr = dateMatch[3]?.toLowerCase() || '';
    
    const monthMap: Record<string, number> = {
      'january': 0, 'jan': 0, 'february': 1, 'feb': 1,
      'march': 2, 'mar': 2, 'april': 3, 'apr': 3,
      'may': 4, 'june': 5, 'jun': 5, 'july': 6, 'jul': 6,
      'august': 7, 'aug': 7, 'september': 8, 'sep': 8,
      'october': 9, 'oct': 9, 'november': 10, 'nov': 10,
      'december': 11, 'dec': 11
    };
    
    const month = monthMap[monthStr] ?? 5;
    const year = 2025;
    
    let hour = 12;
    let minute = 0;
    
    if (time) {
      const timeMatch = time.match(/(\d{1,2}):(\d{2})/);
      if (timeMatch) {
        hour = parseInt(timeMatch[1]);
        minute = parseInt(timeMatch[2]);
      }
    }
    
    return new Date(year, month, day, hour, minute);
  } catch (error) {
    console.warn('Error parsing match date:', error);
    return new Date();
  }
}

// Helper function to get team logo
function getTeamLogo(teamName: string | undefined | null): string {
  if (!teamName) {
    return `data:image/svg+xml,${encodeURIComponent(`
      <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2 L20 6 L20 14 C20 18 16 22 12 22 C8 22 4 18 4 14 L4 6 Z" 
              fill="#228B22" 
              stroke="#333" 
              stroke-width="0.5"/>
        <text x="12" y="14" 
              font-family="Arial, sans-serif" 
              font-size="6" 
              font-weight="bold" 
              text-anchor="middle" 
              fill="#FFFFFF">GAA</text>
      </svg>
    `)}`;
  }

  try {
    const normalizedName = String(teamName).toLowerCase().trim();
    
    const countyInfo: Record<string, { initials: string; color: string; textColor?: string }> = {
      'dublin': { initials: 'DUB', color: '#4A90E2', textColor: '#FFFFFF' },
      'kerry': { initials: 'KER', color: '#228B22', textColor: '#FFFFFF' },
      'mayo': { initials: 'MAY', color: '#228B22', textColor: '#FFFFFF' },
      'galway': { initials: 'GAL', color: '#8B0000', textColor: '#FFFFFF' },
      'cork': { initials: 'COR', color: '#DC143C', textColor: '#FFFFFF' },
      'tyrone': { initials: 'TYR', color: '#DC143C', textColor: '#FFFFFF' },
      'donegal': { initials: 'DON', color: '#228B22', textColor: '#FFFFFF' },
      'armagh': { initials: 'ARM', color: '#FF8C00', textColor: '#FFFFFF' },
      'derry': { initials: 'DER', color: '#DC143C', textColor: '#FFFFFF' },
      'monaghan': { initials: 'MON', color: '#0000FF', textColor: '#FFFFFF' },
      'cavan': { initials: 'CAV', color: '#0000FF', textColor: '#FFFFFF' },
      'down': { initials: 'DOW', color: '#DC143C', textColor: '#FFFFFF' },
      'fermanagh': { initials: 'FER', color: '#228B22', textColor: '#FFFFFF' },
      'antrim': { initials: 'ANT', color: '#B45309', textColor: '#FFFFFF' },
      'louth': { initials: 'LOU', color: '#DC143C', textColor: '#FFFFFF' },
      'meath': { initials: 'MEA', color: '#228B22', textColor: '#FFFFFF' },
      'westmeath': { initials: 'WES', color: '#8B0000', textColor: '#FFFFFF' },
      'longford': { initials: 'LF', color: '#B45309', textColor: '#FFFFFF' },
      'offaly': { initials: 'OFF', color: '#228B22', textColor: '#FFFFFF' },
      'laois': { initials: 'LAO', color: '#0000FF', textColor: '#FFFFFF' },
      'kildare': { initials: 'KIL', color: '#FFFFFF', textColor: '#333333' },
      'wicklow': { initials: 'WIC', color: '#0000FF', textColor: '#FFFFFF' },
      'carlow': { initials: 'CAR', color: '#DC143C', textColor: '#FFFFFF' },
      'kilkenny': { initials: 'KK', color: '#B45309', textColor: '#FFFFFF' },
      'wexford': { initials: 'WEX', color: '#9932CC', textColor: '#FFFFFF' },
      'waterford': { initials: 'WAT', color: '#0000FF', textColor: '#FFFFFF' },
      'tipperary': { initials: 'TIP', color: '#0000FF', textColor: '#FFFFFF' },
      'clare': { initials: 'CLA', color: '#B45309', textColor: '#FFFFFF' },
      'limerick': { initials: 'LIM', color: '#228B22', textColor: '#FFFFFF' },
      'roscommon': { initials: 'ROS', color: '#B45309', textColor: '#FFFFFF' },
      'sligo': { initials: 'SLI', color: '#000000', textColor: '#FFFFFF' },
      'leitrim': { initials: 'LEI', color: '#228B22', textColor: '#FFFFFF' },
      'london': { initials: 'LON', color: '#228B22', textColor: '#FFFFFF' },
      'new york': { initials: 'NY', color: '#0000FF', textColor: '#FFFFFF' },
    };

    let info = countyInfo[normalizedName];
    if (!info) {
      for (const [county, countyData] of Object.entries(countyInfo)) {
        if (normalizedName.includes(county)) {
          info = countyData;
          break;
        }
      }
    }

    if (!info) {
      info = { initials: 'GAA', color: '#228B22', textColor: '#FFFFFF' };
    }

    const svgLogo = `
      <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="1" dy="1" stdDeviation="1" flood-opacity="0.3"/>
          </filter>
        </defs>
        <path d="M12 2 L20 6 L20 14 C20 18 16 22 12 22 C8 22 4 18 4 14 L4 6 Z" 
              fill="${info.color}" 
              stroke="#333" 
              stroke-width="0.5" 
              filter="url(#shadow)"/>
        <text x="12" y="14" 
              font-family="Arial, sans-serif" 
              font-size="6" 
              font-weight="bold" 
              text-anchor="middle" 
              fill="${info.textColor || '#FFFFFF'}">${info.initials}</text>
      </svg>
    `;

    return `data:image/svg+xml,${encodeURIComponent(svgLogo.trim())}`;
  } catch (error) {
    console.warn('Error getting team logo:', error);
    return getTeamLogo(null);
  }
}

// Match row component
function MatchRow({ match }: { match: Match }) {
  const venue = match.venue || '';
  const homeTeamLogo = getTeamLogo(match.homeTeam);
  const awayTeamLogo = getTeamLogo(match.awayTeam);

  return (
    <div className="bg-gray-50 hover:bg-gray-100 transition-colors p-3 rounded-lg">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="flex items-center gap-2 min-w-[180px] justify-end">
              <span className="font-medium text-gray-900 truncate text-sm">{match.homeTeam}</span>
              <div className="w-6 h-6 flex-shrink-0">
                <Image 
                  src={homeTeamLogo} 
                  alt={`${match.homeTeam} logo`}
                  width={24}
                  height={24}
                  className="object-contain"
                />
              </div>
            </div>
            
            <div className="flex-shrink-0 min-w-[60px] text-center">
              <span className={`text-gray-900 font-semibold text-sm px-3 py-1 ${!match.isFixture ? 'bg-white rounded shadow-sm' : ''}`}>
                {match.isFixture ? 'v' : `${match.homeScore} - ${match.awayScore}`}
              </span>
            </div>
            
            <div className="flex items-center gap-2 min-w-[180px]">
              <div className="w-6 h-6 flex-shrink-0">
                <Image 
                  src={awayTeamLogo} 
                  alt={`${match.awayTeam} logo`}
                  width={24}
                  height={24}
                  className="object-contain"
                />
              </div>
              <span className="font-medium text-gray-900 truncate text-sm">{match.awayTeam}</span>
            </div>
          </div>
        </div>

        {match.isFixture && (
          <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
            <div className="w-24">
              {match.broadcast && (
                <span className="text-blue-600 font-medium">{match.broadcast}</span>
              )}
            </div>
            <div>
              {match.time ? (
                <span className="font-medium">{match.time}</span>
              ) : (
                <span className="font-medium">{match.date}</span>
              )}
            </div>
            <div className="w-24 text-right truncate">
              {venue && <span>{venue}</span>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Main component
export default function HomePage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorState, setErrorState] = useState<string | null>(null);
  const [activeSport, setActiveSport] = useState<'football' | 'hurling'>('football');
  const [activeTab, setActiveTab] = useState<'fixtures' | 'results'>('fixtures');
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMatches() {
      try {
        const { data, error } = await supabase
          .from('matches')
          .select('*')
          .order('date', { ascending: true });

        if (error) throw error;

        setMatches(data || []);
        setLastUpdated(new Date().toLocaleString('en-IE', {
          dateStyle: 'short',
          timeStyle: 'short'
        }));
      } catch (err) {
        console.error('Error fetching matches:', err);
        setErrorState(err instanceof Error ? err.message : 'Failed to fetch matches');
      } finally {
        setLoading(false);
      }
    }

    fetchMatches();
  }, []);

  // Filter matches based on active sport and tab
  const filteredMatches = useMemo(() => {
    return matches
      .filter(match => 
        activeSport === 'hurling' ? isHurlingMatch(match) : isFootballMatch(match)
      )
      .filter(match => 
        activeTab === 'fixtures' ? match.isFixture : !match.isFixture
      )
      .sort((a, b) => {
        const dateA = parseMatchDate(a);
        const dateB = parseMatchDate(b);
        return activeTab === 'fixtures' 
          ? dateA.getTime() - dateB.getTime()
          : dateB.getTime() - dateA.getTime();
      });
  }, [matches, activeSport, activeTab]);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div>
              <h1 className="text-2xl font-audiowide text-gray-900">
                gaa<span className="text-orange-500">Today</span>
              </h1>
              <p className="text-xs text-gray-500 -mt-1 font-medium">ALL-IRELAND, ALL DAY.</p>
            </div>
            <div className="text-sm text-gray-600">
              {lastUpdated ? `Last Updated: ${lastUpdated}` : 'Loading...'}
            </div>
          </div>

          {/* Main Sport Tabs */}
          <div className="flex">
            <button
              onClick={() => {
                setActiveSport('football');
                setActiveTab('fixtures');
              }}
              className={`px-4 py-3 text-sm font-medium transition-colors ${
                activeSport === 'football'
                  ? 'text-gray-900 font-semibold'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Football
            </button>
            <button
              onClick={() => {
                setActiveSport('hurling');
                setActiveTab('fixtures');
              }}
              className={`px-4 py-3 text-sm font-medium transition-colors ${
                activeSport === 'hurling'
                  ? 'text-gray-900 font-semibold'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Hurling
            </button>
          </div>

          {/* Sub Navigation Tabs */}
          <div className="flex space-x-2 pt-2 pb-4">
            <button
              onClick={() => setActiveTab('fixtures')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeTab === 'fixtures'
                  ? 'bg-gray-800 text-white'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              Fixtures ({filteredMatches.filter(m => m.isFixture).length})
            </button>
            <button
              onClick={() => setActiveTab('results')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeTab === 'results'
                  ? 'bg-gray-800 text-white'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              Results ({filteredMatches.filter(m => !m.isFixture).length})
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading matches...</p>
            </div>
          </div>
        ) : errorState ? (
          <div className="text-center py-12">
            <div className="text-red-600 text-lg mb-2">Error loading matches</div>
            <p className="text-gray-500">{errorState}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredMatches.map((match, index) => (
              <MatchRow key={`${match.homeTeam}-${match.awayTeam}-${match.date}-${match.time || ''}-${index}`} match={match} />
            ))}
          </div>
        )}
      </main>

      {/* Disclaimer */}
      <footer className="max-w-6xl mx-auto px-4 py-6 border-t border-gray-200">
        <p className="text-sm text-gray-500 text-center">
          This site is an independent fan project created to provide easy access to publicly available GAA match information. It is not affiliated with the Gaelic Athletic Association.
        </p>
      </footer>
    </div>
  );
} 