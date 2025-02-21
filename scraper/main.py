import requests
from bs4 import BeautifulSoup


# Function to fetch the webpage
def fetch_page(url):
    response = requests.get(url)
    response.raise_for_status()  # Raise an error for bad responses (4xx, 5xx)
    return response.text

# Function to parse event data
def parse_events(page_html):
    soup = BeautifulSoup(page_html, 'html.parser')
    # Find all event cards (adjust class name based on inspection)
    event_containers = soup.find_all('div', class_='project-card__title-section')
    
    # me
    # The class name might be incorrect - it looks like a Tailwind CSS class string
    # Try inspecting the actual HTML to verify the exact class name
    # Also consider that multiple classes might need to be matched individually
    # You can try:
    print(soup.find_all('div', class_='flex'))  # Search for just one class
    # Or use a function to match partial classes:
    print(soup.find_all('div', class_=lambda x: x and 'flex' in x.split()))
    # print(event_containers)

    events = []
    for event in event_containers:
        title_tag = event.find('a', class_='font-sans font-medium text-[23px] normal-case leading-tight tracking-[-.92px] text-dark-1')  # Find event title
        date_tag = event.find('time')  # Find event date
        desc_tag = event.find('p', class_='tracking-tight')  # Find event description

        # Extract text, handling potential missing elements
        title = title_tag.text.strip() if title_tag else "No title found"
        date = date_tag.text.strip() if date_tag else "No date found"
        description = desc_tag.text.strip() if desc_tag else "No description available"

        events.append({
            'title': title,
            'date': date,
            'description': description
        })
    
    return events

# Main function to scrape events
def scrape_events():
    url = 'https://www.newyorkcares.org/home'  # URL of the events page
    page_html = fetch_page(url)
    events = parse_events(page_html)
    return events

# Run scraper and print results
events = scrape_events()
for event in events:
    print(event)

