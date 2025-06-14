export interface Match {
  id: string;
  competition: string;
  homeTeam: string;
  awayTeam: string;
  date: string;
  time?: string;
  venue?: string;
  homeScore?: string;
  awayScore?: string;
  isFixture: boolean;
  scrapedAt?: string;
  broadcast?: string; // TV station broadcasting the match
}

export interface GroupTeam {
  name: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  for: number;
  against: number;
  points: number;
}

export interface Group {
  name: string;
  teams: GroupTeam[];
} 