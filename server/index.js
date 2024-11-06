import Fastify from 'fastify';
import cors from '@fastify/cors';
import fetch from 'node-fetch';
import xml2js from 'xml2js';
import { config } from './config.js';
import { LogDatabase } from './db.js';

const fastify = Fastify({ 
  logger: true,
  trustProxy: true
});

// Register CORS with specific configuration
await fastify.register(cors, {
  origin: [
    'chrome-extension://*',
    'http://localhost:3000',
    'http://127.0.0.1:3000'
  ],
  methods: ['GET'],
  allowedHeaders: ['Accept', 'Content-Type'],
  credentials: true
});

const db = new LogDatabase();

async function fetchAndStoreLogs() {
  try {
    const response = await fetch(config.apiUrl, {
      headers: {
        'User-Agent': 'Police-Logs-Extension/1.0',
        'Accept': 'application/rss+xml'
      },
      timeout: 5000
    });
    
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    
    const text = await response.text();
    const parser = new xml2js.Parser();
    const result = await parser.parseStringPromise(text);
    
    const items = result.rss.channel[0].item;
    if (!items || !items.length) {
      throw new Error('No items found in RSS feed');
    }
    
    db.insertLogs(items);
    fastify.log.info('Logs updated successfully');
    return true;
  } catch (error) {
    fastify.log.error('Error fetching logs:', error);
    return false;
  }
}

// Routes
fastify.get('/api/logs', async (request, reply) => {
  try {
    const logs = db.getLatestLogs();
    
    if (!logs || logs.length === 0) {
      // Try to fetch new logs if none are available
      const fetched = await fetchAndStoreLogs();
      if (fetched) {
        return { logs: db.getLatestLogs(), status: 'success' };
      }
    }
    
    return { logs, status: 'success' };
  } catch (error) {
    fastify.log.error('Database error:', error);
    reply.code(500).send({ 
      status: 'error',
      error: 'Failed to fetch logs'
    });
  }
});

// Health check endpoint
fastify.get('/health', async (request, reply) => {
  try {
    const logs = db.getLatestLogs();
    reply.code(200).send({ 
      status: 'healthy',
      dbStatus: logs ? 'connected' : 'error',
      logsCount: logs ? logs.length : 0
    });
  } catch (error) {
    fastify.log.error('Health check error:', error);
    reply.code(500).send({
      status: 'error',
      error: 'Health check failed'
    });
  }
});

// Graceful shutdown
async function closeGracefully(signal) {
  fastify.log.info(`Received signal to terminate: ${signal}`);

  await fastify.close();
  db.close();
  process.exit(0);
}

process.on('SIGINT', closeGracefully);
process.on('SIGTERM', closeGracefully);

// Initial fetch and periodic updates
let updateInterval;

async function startUpdateCycle() {
  await fetchAndStoreLogs();
  updateInterval = setInterval(fetchAndStoreLogs, config.updateInterval);
}

// Start server
try {
  await fastify.listen({ 
    port: config.port,
    host: config.host
  });
  
  fastify.log.info(`Server listening on ${config.host}:${config.port}`);
  await startUpdateCycle();
} catch (err) {
  fastify.log.error(err);
  process.exit(1);
}