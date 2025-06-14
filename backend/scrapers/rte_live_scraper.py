from playwright.sync_api import sync_playwright
import re, json, os
from datetime import datetime
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Initialize Supabase client
supabase_url = os.environ.get('SUPABASE_URL')
supabase_key = os.environ.get('SUPABASE_SERVICE_KEY')

if not supabase_url or not supabase_key:
    raise ValueError('Missing Supabase credentials')

supabase: Client = create_client(supabase_url, supabase_key)

def get_team_info(team_name):
    # Simple function to normalize team names
    return {
        "name": team_name.strip()
    }

def extract_live_update_info(text):
    print(f"Processing text: {text}")  # Debug log
    # Matches: "67 mins: Kilkenny 2-20 Galway 1-18" or "70+2 mins: ..."
    full_time_keywords = ["FT:", "Full-time:", "Full time:", "Full-time", "FT"]
    halftime_keywords = ["Half-time", "Half time", "HT:", "HT"]

    # First check if it signals end of match
    is_final = any(keyword.lower() in text.lower() for keyword in full_time_keywords)
    is_halftime = any(keyword.lower() in text.lower() for keyword in halftime_keywords)

    # Match scores like "67 mins: Kilkenny 2-20 Galway 1-18" or "70+2 mins: ..."
    pattern = r"(\d+)(?:\+(\d+))?\s+mins:\s+(.+?)\s+(\d+-\d+)\s+(.+?)\s+(\d+-\d+)"
    match = re.search(pattern, text)

    if match:
        base_minute = int(match.group(1))
        extra_minute = int(match.group(2)) if match.group(2) else 0
        minute = base_minute + extra_minute
        home_team_name = match.group(3).strip()
        home_score = match.group(4)
        away_team_name = match.group(5).strip()
        away_score = match.group(6)

        home = get_team_info(home_team_name)
        away = get_team_info(away_team_name)

        return {
            "minute": minute,
            "home_team": home["name"],
            "home_score": home_score,
            "away_team": away["name"],
            "away_score": away_score,
            "is_final": is_final,
            "update_text": text,
            "timestamp": datetime.now().isoformat()
        }

    return None

def get_match_id(home_team: str, away_team: str) -> str:
    try:
        # Get today's date in YYYY-MM-DD format
        today = datetime.now().strftime('%Y-%m-%d')
        
        # Clean team names
        def clean_team_name(name: str) -> str:
            return name.lower().strip()
        
        # Get all matches for today
        result = supabase.table('matches')\
            .select('id, home_team, away_team')\
            .eq('match_date', today)\
            .execute()
            
        if not result.data:
            print(f"No matches found for today ({today})")
            return None
            
        # Find the best match
        for match in result.data:
            if (clean_team_name(match['home_team']) == clean_team_name(home_team) and 
                clean_team_name(match['away_team']) == clean_team_name(away_team)):
                return match['id']
                
        print(f"Could not find match for {home_team} vs {away_team} on {today}")
        return None
    except Exception as e:
        print(f"Error getting match ID: {e}")
        return None

def add_live_update(match_id: str, update_info: dict):
    try:
        data = {
            'match_id': match_id,
            'minute': update_info['minute'],
            'home_score': update_info['home_score'],
            'away_score': update_info['away_score'],
            'update_text': update_info['update_text'],
            'is_final': update_info['is_final']
        }
        result = supabase.table('live_updates').insert(data).execute()
        return result.data
    except Exception as e:
        print(f"Error adding live update: {e}")
        return None

def scrape_rte_live_articles():
    urls = [
        "https://www.rte.ie/sport/football/",
        "https://www.rte.ie/sport/hurling/"
    ]

    updates_by_match = {}
    last_minute_by_match = {}

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        for url in urls:
            print(f"Scraping URL: {url}")  # Debug log
            page.goto(url)
            page.wait_for_selector("span[title]")

            titles = page.locator("span[title]")
            count = titles.count()
            print(f"Found {count} titles")  # Debug log

            for i in range(count):
                try:
                    # First check if element exists and is visible
                    element = titles.nth(i)
                    if not element.is_visible(timeout=1000):  # 1 second timeout
                        print(f"Skipping title {i} - element not visible")
                        continue
                    title_text = element.get_attribute("title", timeout=1000)  # 1 second timeout
                    if not title_text:
                        print(f"Skipping title {i} - no title attribute found")
                        continue
                except Exception as e:
                    print(f"Skipping title {i} - element not available")
                    continue
                print(f"Title {i}: {title_text}")  # Debug log
                if title_text and ("live" in title_text.lower() or "recap" in title_text.lower() or "score updates" in title_text.lower() or "updates" in title_text.lower()):
                    article_element = titles.nth(i).locator("xpath=ancestor::a")
                    article_url = article_element.get_attribute("href")
                    if article_url and article_url.startswith("/"):
                        article_url = "https://www.rte.ie" + article_url

                    print(f"Found live article: {article_url}")  # Debug log
                    page.goto(article_url)
                    try:
                        page.wait_for_selector(".tracker-post-body", timeout=5000)
                        # Click 'Show More' button repeatedly until no more updates are loaded
                        while True:
                            try:
                                show_more_button = page.locator("text=Show More")
                                if show_more_button.count() > 0:
                                    show_more_button.click()
                                    page.wait_for_timeout(1000)  # Wait for new content to load
                                else:
                                    break
                            except Exception as e:
                                print(f"Error clicking 'Show More': {e}")
                                break
                        updates = page.locator(".tracker-post-body")
                        update_count = updates.count()
                        print(f"Found {update_count} updates in article")  # Debug log
                        for j in range(update_count):
                            update_text = updates.nth(j).inner_text()
                            info = extract_live_update_info(update_text)
                            if info:
                                # Get match ID from Supabase
                                match_id = get_match_id(info['home_team'], info['away_team'])
                                if match_id:
                                    # Add live update to Supabase
                                    add_live_update(match_id, info)
                                else:
                                    print(f"Could not find match ID for {info['home_team']} vs {info['away_team']}")
                    except Exception as e:
                        print(f"Error processing article: {str(e)}")  # Debug log
                        continue

        browser.close()

if __name__ == "__main__":
    scrape_rte_live_articles()

