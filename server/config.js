export const config = {
  port: 3000,
  host: '127.0.0.1', // Changed from localhost to explicit IP
  apiUrl: 'https://api.politiet.no/politiloggen/v1/rss?districts=Vest',
  updateInterval: 5 * 60 * 1000, // 5 minutes in milliseconds
  dbPath: 'logs.db',
  maxLogs: 5,
  retentionPeriod: '-1 day'
};