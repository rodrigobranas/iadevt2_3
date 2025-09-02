import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req: Request, res: Response) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// Minimal fetch typing to avoid needing DOM lib; Node 18+ provides fetch at runtime
declare const fetch: any;

// In-memory cache for bitcoin info
type BitcoinInfo = Record<string, any>;
let cache: { data: BitcoinInfo; fetchedAt: number } | null = null;
const CACHE_TTL_MS = 10_000; // 10 seconds

const API_URL = 'https://api.api-ninjas.com/v1/bitcoin';
const API_KEY = 'kIwRwVNydIUrJzArE4LajA==xX81Zit9JC2zePiQ';

app.get('/bitcoin-info', async (req: Request, res: Response) => {
  try {
    const now = Date.now();
    if (cache && now - cache.fetchedAt < CACHE_TTL_MS) {
      return res.json(cache.data);
    }

    const response = await fetch(API_URL, {
      method: 'GET',
      headers: {
        'X-Api-Key': API_KEY,
      },
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: 'Failed to fetch bitcoin info' });
    }

    const data = await response.json();
    cache = { data, fetchedAt: now };
    res.json(data);
  } catch (error: any) {
    console.error('Error fetching bitcoin info:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.use((err: Error, req: Request, res: Response, next: any) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: err.message 
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${PORT}`);
});
