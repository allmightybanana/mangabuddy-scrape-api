import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './config/swagger.js';
import mangaRoutes from './routes/manga.js';

const app = express();
const PORT = process.env.PORT || 3001;

// CORS configuration
app.use(cors({
  origin: ['https://myronix.jvbarcenas.space', 'https://myronix.strangled.net', 'http://localhost:3000', 'http://localhost:5173'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json());

// Custom CSS for Swagger UI (Dark Theme & Professional Styling)
const swaggerOptions = {
  customCss: `
    .swagger-ui { background-color: #0b0e14; color: #e2e8f0; }
    .swagger-ui .topbar { display: none; }
    .swagger-ui .info .title { color: #f43f5e; font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 800; }
    .swagger-ui .info p, .swagger-ui .info li, .swagger-ui .info td { color: #94a3b8; }
    .swagger-ui .opblock-tag { color: #e2e8f0; border-bottom: 1px solid #262c3a; font-family: 'Plus Jakarta Sans', sans-serif; }
    .swagger-ui .opblock { border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); border: 1px solid #262c3a !important; }
    .swagger-ui .opblock.opblock-get { background: rgba(20, 184, 166, 0.05); }
    .swagger-ui .opblock.opblock-get .opblock-summary { border-color: #14b8a6; }
    .swagger-ui .opblock .opblock-summary-method { border-radius: 6px; font-weight: 800; }
    .swagger-ui section.models { border: 1px solid #262c3a; border-radius: 12px; background: #11141d; }
    .swagger-ui section.models h4 { color: #94a3b8; }
    .swagger-ui .model-box { background: #161b26; border-radius: 8px; }
    .swagger-ui input, .swagger-ui select, .swagger-ui textarea { background: #161b26 !important; border: 1px solid #262c3a !important; color: #e2e8f0 !important; }
    code { font-family: 'JetBrains Mono', monospace !important; }
  `,
  customSiteTitle: "MangaBuddy API | Developer Portal"
};

// Swagger UI Route
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerOptions));
app.use('/', (req, res, next) => {
  if (req.path === '/') return res.redirect('/docs');
  next();
});

// API Routes
app.use('/api/manga', mangaRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  const message = err?.message || err?.code || String(err);
  console.error({
    message,
    code: err?.code,
    stack: err?.stack
  });

  res.status(500).json({ 
    success: false, 
    error: 'Internal Server Error', 
    message
  });
});

app.listen(PORT, () => {
  console.log(`\x1b[32m[SERVER]\x1b[0m Running on http://localhost:${PORT}`);
  console.log(`\x1b[36m[DOCS]\x1b[0m Available at http://localhost:${PORT}/docs`);
});
