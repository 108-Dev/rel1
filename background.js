const ALARM_NAME = 'fetch-police-logs';
const UPDATE_INTERVAL = 5; // minutes
const API_URL = 'https://api.politiet.no/politiloggen/v1/rss?districts=Vest';

async function fetchAndStoreLogs() {
  try {
    const response = await fetch(API_URL, {
      headers: {
        'User-Agent': 'Police-Logs-Extension/1.0',
        'Accept': 'application/rss+xml'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const text = await response.text();
    const parser = new DOMParser();
    const xml = parser.parseFromString(text, 'text/xml');
    const items = Array.from(xml.querySelectorAll('item')).slice(0, 5);

    const logs = items.map(item => ({
      title: item.querySelector('title')?.textContent || '',
      description: item.querySelector('description')?.textContent || '',
      pubDate: item.querySelector('pubDate')?.textContent || '',
      link: item.querySelector('link')?.textContent || '',
      timestamp: new Date().getTime()
    }));

    await chrome.storage.local.set({
      logs,
      lastUpdated: new Date().toISOString(),
      error: null
    });

  } catch (error) {
    console.error('Error fetching logs:', error);
    await chrome.storage.local.set({
      error: 'Unable to fetch police logs. Please try again later.',
      lastUpdated: new Date().toISOString()
    });
  }
}

// Initialize when extension is installed or updated
chrome.runtime.onInstalled.addListener(() => {
  // Set up alarm for periodic updates
  chrome.alarms.create(ALARM_NAME, {
    periodInMinutes: UPDATE_INTERVAL
  });
  
  // Initial fetch
  fetchAndStoreLogs();
});

// Fetch logs when alarm triggers
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === ALARM_NAME) {
    fetchAndStoreLogs();
  }
});