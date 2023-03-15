const domainInput = document.getElementById('domain');
const addButton = document.getElementById('add');
const removeButton = document.getElementById('remove');
const clearButton = document.getElementById('clear');
const blacklist = document.getElementById('blacklist');
const startTimeInput = document.getElementById('startTime');
const endTimeInput = document.getElementById('endTime');
const setTimeRangeButton = document.getElementById('setTimeRange');
const timeRangeDisplay = document.getElementById('timeRangeDisplay');

function displayTimeRange(startTime, endTime) {
  if (startTime && endTime) {
    timeRangeDisplay.textContent = `${startTime} - ${endTime}`;
  } else {
    timeRangeDisplay.textContent = 'Not set';
  }
}

chrome.storage.sync.get(['startTime', 'endTime'], ({ startTime, endTime }) => {
  if (startTime) startTimeInput.value = startTime;
  if (endTime) endTimeInput.value = endTime;
  displayTimeRange(startTime, endTime);
});

setTimeRangeButton.addEventListener('click', () => {
  const startTime = startTimeInput.value;
  const endTime = endTimeInput.value;
  if (startTime && endTime) {
    chrome.storage.sync.set({ startTime, endTime }, () => {
      displayTimeRange(startTime, endTime);
      alert('Time range saved!');
    });
  } else {
    alert('Please set both start and end times.');
  }
});

function createBlacklistItem(domain) {
  const li = document.createElement('li');
  li.textContent = domain;

  // Add an event listener to autofill the domain input when a list item is clicked
  li.addEventListener('click', () => {
    domainInput.value = domain;
  });

  return li;
}

function updateBlacklistUI(blacklistArray) {
  blacklist.innerHTML = '';
  for (const domain of blacklistArray) {
    blacklist.appendChild(createBlacklistItem(domain));
  }
}

chrome.storage.sync.get('blacklist', ({ blacklist: storedBlacklist }) => {
  if (Array.isArray(storedBlacklist)) {
    updateBlacklistUI(storedBlacklist);
  }
});

addButton.addEventListener('click', () => {
  const domain = domainInput.value.trim();
  if (domain) {
    chrome.storage.sync.get('blacklist', ({ blacklist: storedBlacklist }) => {
      const newBlacklist = [...(storedBlacklist || []), domain];
      chrome.storage.sync.set({ blacklist: newBlacklist }, () => {
        updateBlacklistUI(newBlacklist);
        domainInput.value = '';
      });
    });
  }
});

removeButton.addEventListener('click', () => {
  const domain = domainInput.value.trim();
  if (domain) {
    chrome.storage.sync.get('blacklist', ({ blacklist: storedBlacklist }) => {
      if (Array.isArray(storedBlacklist)) {
        const newBlacklist = storedBlacklist.filter(item => item !== domain);
        chrome.storage.sync.set({ blacklist: newBlacklist }, () => {
          updateBlacklistUI(newBlacklist);
          domainInput.value = '';
        });
      }
    });
  }
});

// Add the clear event listener
clearButton.addEventListener('click', () => {
  chrome.storage.sync.set({ blacklist: [] }, () => {
    updateBlacklistUI([]);
    alert('Blacklist cleared!');
  });
});

// Add the clear event listener
clearTimeButton.addEventListener('click', () => {
  chrome.storage.sync.remove(['startTime', 'endTime'], () => {
    startTimeInput.value = '';
    endTimeInput.value = '';
    updateTimeRangeUI(null, null);
    alert('Time range cleared!');
  });
});