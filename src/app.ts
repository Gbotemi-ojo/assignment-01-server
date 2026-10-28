import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import sheetRoutes from './routes/sheetRoutes';

const app = express();

// Middlewares
app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
app.use(express.json());

// API Routes
app.use('/api', sheetRoutes);

// Root fallback route
app.get('/', (_req: Request, res: Response) => {
  res.json({
    name: 'Vehicle Inspection & Maintenance API',
    status: 'online',
    endpoints: {
      health: '/api/health',
      inspections: '/api/inspections',
      stats: '/api/inspections/stats',
    },
    documentation: 'Pass ?search=... or ?status=... to filter records.',
  });
});

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Error handling middleware
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message,
  });
});

export default app;
