import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Adiology API Server',
    version: '1.0.0',
    status: 'running',
    port: PORT,
    timestamp: new Date().toISOString()
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    port: PORT,
    timestamp: new Date().toISOString() 
  });
});

// API Routes will go here
// app.use('/api/ads', adsGenerationRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Adiology Server Running`);
  console.log(`📍 Internal Port: http://0.0.0.0:${PORT}`);
  console.log(`🌐 External Port: https://adiology-${process.env.REPL_SLUG}.replit.dev`);
  console.log(`🏥 Health Check: https://adiology-${process.env.REPL_SLUG}.replit.dev/health`);
});

// Handle errors
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use`);
    process.exit(1);
  }
  throw err;
});

export default app;
