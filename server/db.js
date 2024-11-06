import Database from 'better-sqlite3';
import { config } from './config.js';

export class LogDatabase {
  constructor() {
    try {
      this.db = new Database(config.dbPath);
      this.initializeDatabase();
      this.prepareStatements();
    } catch (error) {
      console.error('Failed to initialize database:', error);
      throw error;
    }
  }

  initializeDatabase() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        pubDate TEXT NOT NULL,
        link TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE INDEX IF NOT EXISTS idx_pubDate ON logs(pubDate DESC);
      CREATE INDEX IF NOT EXISTS idx_created_at ON logs(created_at);
    `);
  }

  prepareStatements() {
    this.insertLog = this.db.prepare(`
      INSERT INTO logs (title, description, pubDate, link)
      VALUES (@title, @description, @pubDate, @link)
    `);

    this.getRecentLogs = this.db.prepare(`
      SELECT * FROM logs
      ORDER BY pubDate DESC
      LIMIT ${config.maxLogs}
    `);

    this.deleteOldLogs = this.db.prepare(`
      DELETE FROM logs
      WHERE created_at < datetime('now', '${config.retentionPeriod}')
    `);
  }

  insertLogs(items) {
    try {
      const transaction = this.db.transaction(() => {
        this.deleteOldLogs.run();
        items.forEach(item => {
          this.insertLog.run({
            title: item.title[0],
            description: item.description[0],
            pubDate: item.pubDate[0],
            link: item.link[0]
          });
        });
      });
      transaction();
      return true;
    } catch (error) {
      console.error('Failed to insert logs:', error);
      return false;
    }
  }

  getLatestLogs() {
    try {
      return this.getRecentLogs.all();
    } catch (error) {
      console.error('Failed to get latest logs:', error);
      return [];
    }
  }

  close() {
    try {
      this.db.close();
    } catch (error) {
      console.error('Error closing database:', error);
    }
  }
}