document.addEventListener('DOMContentLoaded', async () => {
  const logsContainer = document.getElementById('logs');
  const updateTimeElement = document.getElementById('updateTime');
  const db = firebase.database();

  try {
    const data = await chrome.storage.local.get(['logs', 'lastUpdated', 'error']);
    const { logs, lastUpdated, error } = data;

    if (lastUpdated) {
      const lastUpdateDate = new Date(lastUpdated);
      updateTimeElement.textContent = lastUpdateDate.toLocaleTimeString();
    }

    if (error) {
      // Try to get logs from Firebase if there's an error
      const snapshot = await db.ref('logs')
        .orderByChild('timestamp')
        .limitToLast(5)
        .once('value');

      if (snapshot.exists()) {
        const firebaseLogs = Object.values(snapshot.val());
        displayLogs(firebaseLogs);
      } else {
        logsContainer.innerHTML = `<div class="error">
          <p>${error}</p>
        </div>`;
      }
      return;
    }

    if (logs && logs.length > 0) {
      displayLogs(logs);
      // Store logs in Firebase
      await db.ref('logs').set(logs);
    } else {
      // Try to get logs from Firebase if local storage is empty
      const snapshot = await db.ref('logs')
        .orderByChild('timestamp')
        .limitToLast(5)
        .once('value');

      if (snapshot.exists()) {
        const firebaseLogs = Object.values(snapshot.val());
        displayLogs(firebaseLogs);
      } else {
        logsContainer.innerHTML = `<div class="error">
          <p>No logs available at the moment</p>
        </div>`;
      }
    }
  } catch (error) {
    console.error('Error:', error);
    logsContainer.innerHTML = `<div class="error">
      <p>Error loading logs: ${error.message}</p>
    </div>`;
  }
});

function displayLogs(logs) {
  const logsContainer = document.getElementById('logs');
  logsContainer.innerHTML = logs.map(log => `
    <div class="log-entry" onclick="window.open('${log.link}', '_blank')">
      <h2 class="log-title">${log.title}</h2>
      <p>${log.description}</p>
      <div class="log-meta">
        <span>${new Date(log.pubDate).toLocaleString('nb-NO', {
          dateStyle: 'medium',
          timeStyle: 'short'
        })}</span>
      </div>
    </div>
  `).join('');
}