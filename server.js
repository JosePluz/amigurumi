/**
 * Servidor Express para Render (ESM)
 * Sirve la aplicación estática con middlewares optimizados
 */

import express from 'express';
import path from 'path';
import compression from 'compression';
import helmet from 'helmet';
import cors from 'cors';
import 'dotenv/config';
import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname as pathDirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = pathDirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// MIDDLEWARES DE SEGURIDAD Y PERFORMANCE
// ============================================

// Compresión GZIP
app.use(compression());

// Headers de seguridad
app.use(helmet({
  contentSecurityPolicy: false,
  frameguard: { action: 'deny' }
}));

// CORS
app.use(cors());

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// ============================================
// CACHE CONTROL - OPTIMIZADO PARA ACTUALIZACIÓN RÁPIDA
// ============================================

// Sin cache para HTML (siempre fresco)
app.use((req, res, next) => {
  if (req.path.endsWith('.html') || req.path === '/') {
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate, public, max-age=0',
      'Pragma': 'no-cache',
      'Expires': '0',
      'ETag': 'no-cache'
    });
  }
  next();
});

// Cache agresivo para assets (CSS, JS, imágenes)
app.use(express.static(path.join(__dirname), {
  maxAge: '30d', // 30 días para assets con fingerprint
  etag: false,   // Desabilitar etag para mejor performance
  immutable: true
}));

// Override específico para productos (JSON/JS dinámico)
app.use((req, res, next) => {
  if (req.path === '/products.js' || req.path.startsWith('/api/')) {
    res.set({
      'Cache-Control': 'no-cache, must-revalidate, max-age=0',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
  }
  next();
});

// ============================================
// RUTAS API
// ============================================

/**
 * GET /api/health
 * Health check para monitoreo
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

async function loadProducts() {
  try {
    const file = join(__dirname, 'data', 'products.json');
    const content = await readFile(file, 'utf-8');
    const parsed = JSON.parse(content);
    return parsed.products || [];
  } catch (err) {
    console.error('Error cargando products.json:', err);
    return [];
  }
}

/**
 * GET /api/products
 * Retorna los productos (desde data/products.json)
 */
app.get('/api/products', async (req, res) => {
  try {
    const products = await loadProducts();
    res.json({ success: true, count: products.length, data: products });
  } catch (error) {
    res.status(500).json({ success: false, error: 'No se pudieron cargar los productos' });
  }
});

/**
 * GET /api/products/:id
 * Retorna un producto específico
 */
app.get('/api/products/:id', async (req, res) => {
  try {
    const products = await loadProducts();
    const product = products.find(p => p.id == req.params.id);
    if (!product) return res.status(404).json({ success: false, error: 'Producto no encontrado' });
    res.json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Error al obtener el producto' });
  }
});

// ============================================
// SERVIR HTML PRINCIPAL
// ============================================

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Redireccionar rutas no encontradas a index.html (SPA)
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// ============================================
// MANEJO DE ERRORES
// ============================================

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    error: 'Error interno del servidor'
  });
});

// ============================================
// INICIAR SERVIDOR
// ============================================

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════╗
║     🧶 Amigurumis - Servidor Activo      ║
║                                            ║
║  🌐 http://localhost:${PORT}
║  📍 Documentación: /api/products           ║
║  💚 Health Check: /api/health              ║
╚════════════════════════════════════════════╝
  `);
});

module.exports = app;
