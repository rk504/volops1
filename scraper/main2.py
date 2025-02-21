
import requests
from bs4 import BeautifulSoup
import csv  # For saving data in CSV format, optional

# Step 1: Fetch the page HTML
url = "https://www.newyorkcares.org/search?"
response = requests.get(url)

# Ensure the request was successful
if response.status_code == 200:
    print("Successfully fetched the page.")
else:
    print(f"Failed to fetch the page. Status code: {response.status_code}")
    exit()

# Step 2: Parse the HTML content with BeautifulSoup
soup = BeautifulSoup(response.text, 'html.parser')
print(soup)

# Step 3: Extract relevant information
# Example: Find all event titles or program information
events = soup.find_all('div', class_='flex flex-col w-full') # Example: adjust according to actual page structure
print(soup.find_all('12:00'))

# Step 4: Store the data
# Here we're saving data to a CSV file
with open('events.csv', 'w', newline='') as file:
    writer = csv.writer(file)
    writer.writerow(['Event Title', 'Event Link'])  # Write header

    for event in events:
        title = event.find('h2')  # Example: look for <h2> tags inside each event div
        link = event.find('a', href=True)  # Example: look for <a> tags with href attribute

        if title and link:
            event_title = title.get_text(strip=True)
            event_link = link['href']
            writer.writerow([event_title, event_link])  # Write data to CSV file
            print(f"Found event: {event_title}")

# Optional: If you prefer to store the data directly in Supabase, you can use the Supabase Python client
