from playwright.sync_api import sync_playwright
import re, json, os
from datetime import datetime

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
            "timestamp": datetime.now().isoformat()
        }

    return None

def generate_match_key(home, away):
    return f"{home} vs {away}"

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
                                # Only add if time does not go backwards
                                match_key = None
                                if info["home_team"] and info["away_team"]:
                                    match_key = generate_match_key(info["home_team"], info["away_team"])
                                elif info["is_halftime"]:
                                    # Try to assign halftime to the last match_key if possible
                                    if updates_by_match:
                                        match_key = list(updates_by_match.keys())[-1]
                                    else:
                                        continue  # Skip if we don't know the teams
                                else:
                                    continue  # Skip null/unknown updates
                                if match_key not in updates_by_match:
                                    updates_by_match[match_key] = []
                                    last_minute_by_match[match_key] = -1
                                # Only add if minute is None (halftime) or >= last
                                if info["minute"] is None or info["minute"] >= last_minute_by_match[match_key]:
                                    updates_by_match[match_key].append(info)
                                    if info["minute"] is not None:
                                        last_minute_by_match[match_key] = info["minute"]
                    except Exception as e:
                        print(f"Error processing article: {str(e)}")  # Debug log
                        continue

        browser.close()

    # Merge with existing JSON if file exists
    output_path = "live_updates.json"
    try:
        if os.path.exists(output_path):
            with open(output_path, "r") as f:
                existing = json.load(f)
        else:
            existing = {}

        # Combine updates while avoiding duplicates
        for match, updates in updates_by_match.items():
            if match not in existing:
                existing[match] = []
            existing_updates = existing[match]
            existing_keys = {f"{u['minute']}-{u['home_score']}-{u['away_score']}" for u in existing_updates}

            for update in updates:
                key = f"{update['minute']}-{update['home_score']}-{update['away_score']}"
                if key not in existing_keys:
                    existing[match].append(update)

        with open(output_path, "w") as f:
            json.dump(existing, f, indent=2)

        print(f"✅ Updated {output_path} with {sum(len(v) for v in existing.values())} total updates")
    except Exception as e:
        print(f"Error writing output file: {e}")

if __name__ == "__main__":
    scrape_rte_live_articles()

