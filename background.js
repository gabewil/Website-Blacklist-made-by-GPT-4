chrome.storage.sync.get('blacklist', ({ blacklist }) => {
  if (!blacklist) {
    chrome.storage.sync.set({ blacklist: [] });
  }
});

function isBlacklisted(url, blacklist) {
  return blacklist.some((domain) => url.includes(domain));
}

function isWithinTimeRange(startTime, endTime) {
  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();

  const [startHour, startMinute] = startTime.split(':');
  const [endHour, endMinute] = endTime.split(':');
  const startTimeInMinutes = parseInt(startHour) * 60 + parseInt(startMinute);
  const endTimeInMinutes = parseInt(endHour) * 60 + parseInt(endMinute);

  return currentTime >= startTimeInMinutes && currentTime <= endTimeInMinutes;
}

chrome.webNavigation.onBeforeNavigate.addListener(
  (details) => {
    chrome.storage.sync.get(['blacklist', 'startTime', 'endTime'], ({ blacklist, startTime, endTime }) => {
      if (isBlacklisted(details.url, blacklist) && isWithinTimeRange(startTime, endTime)) {
        chrome.tabs.update(details.tabId, {
          url: 'blocked.html',
        });
      }
    });
  },
  { url: [{ urlContains: ':' }] }
);

function isTimeInRange(startTime, endTime, currentTime) {
  const start = startTime.split(':').map(Number);
  const end = endTime.split(':').map(Number);
  const current = currentTime.split(':').map(Number);

  const startMinutes = start[0] * 60 + start[1];
  const endMinutes = end[0] * 60 + end[1];
  const currentMinutes = current[0] * 60 + current[1];

  if (startMinutes <= endMinutes) {
    return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
  } else {
    return currentMinutes >= startMinutes || currentMinutes <= endMinutes;
  }
}

function getCurrentTime() {
  const now = new Date();
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    const url = new URL(details.url);
    const domain = url.hostname;

    return new Promise((resolve) => {
      chrome.storage.sync.get(['blacklist', 'startTime', 'endTime'], ({ blacklist, startTime, endTime }) => {
        if (Array.isArray(blacklist) && blacklist.some(item => domain.includes(item))) {
          const currentTime = getCurrentTime();
          if (startTime && endTime && isTimeInRange(startTime, endTime, currentTime)) {
            resolve({ cancel: true });
          } else {
            resolve({ cancel: false });
          }
        } else {
          resolve({ cancel: false });
        }
      });
    });
  },
  { urls: ['<all_urls>'] },
  ['blocking']
);