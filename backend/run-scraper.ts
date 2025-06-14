import { scrapeGAAFixturesAndResults } from './scrapers/scraper';

async function main() {
  try {
    console.log('Starting GAA fixtures and results scraper...');
    const matches = await scrapeGAAFixturesAndResults();
    console.log(`Successfully scraped and stored ${matches.length} matches in Supabase`);
    process.exit(0);
  } catch (error) {
    console.error('Error running scraper:', error);
    process.exit(1);
  }
}

main(); 