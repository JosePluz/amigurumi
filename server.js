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
import { readFile, writeFile, mkdir, unlink } from 'fs/promises';
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

// ============ ADMIN AUTH (simple) ============
app.post('/admin/auth', express.json(), (req, res) => {
  try {
    const { password } = req.body || {};
    const adminPass = process.env.ADMIN_PASSWORD || 'admin2024';
    if (password && password === adminPass) {
      return res.json({ success: true });
    }
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Server error' });
  }
});

// ============ ADMIN PUBLISH ============
app.post('/admin/publish', express.json({ limit: '100mb' }), async (req, res) => {
  try {
    const pass = req.headers['x-admin-pass'] || req.body?.password;
    const adminPass = process.env.ADMIN_PASSWORD || 'admin2024';
    if (!pass || pass !== adminPass) return res.status(401).json({ success: false, error: 'Unauthorized' });

    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    if (!GITHUB_TOKEN) return res.status(500).json({ success: false, error: 'GITHUB_TOKEN not set on server' });

    const owner = process.env.REPO_OWNER || 'JosePluz';
    const repo = process.env.REPO_NAME || 'amigurumi';

    const products = req.body.products || [];

    // Helper to upload a file to repo
    async function uploadFile(path, base64Content, message) {
      const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
      // Check if exists
      let sha = null;
      const getR = await fetch(apiUrl, { headers: { Authorization: `token ${GITHUB_TOKEN}` } });
      if (getR.ok) {
        const d = await getR.json();
        sha = d.sha;
      }
      const putR = await fetch(apiUrl, {
        method: 'PUT',
        headers: { Authorization: `token ${GITHUB_TOKEN}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, content: base64Content, sha })
      });
      if (!putR.ok) {
        const txt = await putR.text();
        throw new Error(`Upload failed ${putR.status} ${txt}`);
      }
      return await putR.json();
    }

    // Helper to delete a file from repo
    async function deleteFileFromRepo(path, message) {
      const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
      // Get sha
      const getR = await fetch(apiUrl, { headers: { Authorization: `token ${GITHUB_TOKEN}` } });
      if (!getR.ok) {
        // If file doesn't exist, nothing to do
        return { ok: false, status: getR.status, text: await getR.text() };
      }
      const data = await getR.json();
      const sha = data.sha;
      const delR = await fetch(apiUrl, {
        method: 'DELETE',
        headers: { Authorization: `token ${GITHUB_TOKEN}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, sha })
      });
      if (!delR.ok) {
        const txt = await delR.text();
        throw new Error(`Delete failed ${delR.status} ${txt}`);
      }
      return await delR.json();
    }

    // Upload images from products[].imgsData
    for (const p of products) {
      if (Array.isArray(p.imgsData) && p.imgsData.length > 0) {
        for (const img of p.imgsData) {
          const parts = (img.dataUrl || '').split(',');
          const base64 = parts[1];
          if (!base64) continue;
          await uploadFile(img.name, base64, `📷 Add image ${img.name}`);
          // Also write the image file locally so the running server can serve it immediately
          try {
            const imgPath = join(__dirname, img.name);
            // Ensure directory exists
            await mkdir(join(__dirname, 'img'), { recursive: true });
            await writeFile(imgPath, Buffer.from(base64, 'base64'));
            console.log('Wrote local image:', imgPath);
          } catch (wfErr) {
            console.error('Failed to write local image', img.name, wfErr);
            // continue; not fatal
          }
        }
      }
    }

    // Prepare products file
    const productsForRepo = products.map(p => {
      const copy = { ...p };
      delete copy.imgsData;
      return copy;
    });

    const content = `/**\n * Catálogo de Productos - Amigurumis\n * Generado: ${new Date().toLocaleString()}\n * Total productos: ${productsForRepo.length}\n */\n\nexport const products = ${JSON.stringify(productsForRepo, null, 2)};\n`;

    // PUT products.js
    const prodApi = `https://api.github.com/repos/${owner}/${repo}/contents/products.js`;
    let sha = null;
    const getProd = await fetch(prodApi, { headers: { Authorization: `token ${GITHUB_TOKEN}` } });
    if (getProd.ok) {
      const data = await getProd.json();
      sha = data.sha;
    }
    const putProd = await fetch(prodApi, {
      method: 'PUT',
      headers: { Authorization: `token ${GITHUB_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: `📦 Admin Update: ${productsForRepo.length} productos`, content: content ? Buffer.from(content, 'utf8').toString('base64') : '', sha })
    });
    if (!putProd.ok) {
      const txt = await putProd.text();
      throw new Error(`Failed products commit: ${putProd.status} ${txt}`);
    }

    // Also update local data/products.json so the API reflects changes immediately
    try {
      const dataFile = join(__dirname, 'data', 'products.json');
      const jsonContent = JSON.stringify({ products: productsForRepo }, null, 2);
      await writeFile(dataFile, jsonContent, 'utf8');
      console.log('Local data/products.json updated successfully');
    } catch (writeErr) {
      console.error('Failed to write local products.json:', writeErr);
      // Not fatal: the GitHub commit succeeded, continue
    }

    return res.json({ success: true });
  } catch (err) {
    console.error('admin publish error', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ============ ADMIN DELETE PRODUCT ============
app.post('/admin/delete', express.json(), async (req, res) => {
  try {
    const pass = req.headers['x-admin-pass'] || req.body?.password;
    const adminPass = process.env.ADMIN_PASSWORD || 'admin2024';
    if (!pass || pass !== adminPass) return res.status(401).json({ success: false, error: 'Unauthorized' });

    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    if (!GITHUB_TOKEN) return res.status(500).json({ success: false, error: 'GITHUB_TOKEN not set on server' });

    const owner = process.env.REPO_OWNER || 'JosePluz';
    const repo = process.env.REPO_NAME || 'amigurumi';

    const id = req.body.id;
    if (!id) return res.status(400).json({ success: false, error: 'Missing id' });

    // Load local products
    const dataFile = join(__dirname, 'data', 'products.json');
    let current = [];
    try {
      const txt = await readFile(dataFile, 'utf8');
      current = JSON.parse(txt).products || [];
    } catch (e) {
      console.warn('Could not read local products.json, falling back to empty');
      current = [];
    }

    const prod = current.find(p => p.id == id);
    if (!prod) return res.status(404).json({ success: false, error: 'Product not found' });

    // Delete images from repo and local disk
    if (Array.isArray(prod.imgs)) {
      for (const imgPath of prod.imgs) {
        try {
          await deleteFileFromRepo(imgPath, `🗑️ Delete image ${imgPath}`);
        } catch (err) {
          console.error('Failed to delete image from repo:', imgPath, err.message);
        }
        try {
          const diskPath = join(__dirname, imgPath);
          await unlink(diskPath);
          console.log('Deleted local image', diskPath);
        } catch (err) {
          // ignore if not exists
        }
      }
    }

    // Remove product from list
    const updated = current.filter(p => p.id != id);

    // Commit updated products.js to repo
    const productsForRepo = updated.map(p => {
      const copy = { ...p };
      delete copy.imgsData;
      return copy;
    });

    const content = `/**\n * Catálogo de Productos - Amigurumis\n * Generado: ${new Date().toLocaleString()}\n * Total productos: ${productsForRepo.length}\n */\n\nexport const products = ${JSON.stringify(productsForRepo, null, 2)};\n`;

    const prodApi = `https://api.github.com/repos/${owner}/${repo}/contents/products.js`;
    let sha = null;
    const getProd = await fetch(prodApi, { headers: { Authorization: `token ${GITHUB_TOKEN}` } });
    if (getProd.ok) {
      const data = await getProd.json();
      sha = data.sha;
    }
    const putProd = await fetch(prodApi, {
      method: 'PUT',
      headers: { Authorization: `token ${GITHUB_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: `🗑️ Admin Delete: product ${id}`, content: Buffer.from(content, 'utf8').toString('base64'), sha })
    });
    if (!putProd.ok) {
      const txt = await putProd.text();
      throw new Error(`Failed products commit: ${putProd.status} ${txt}`);
    }

    // Update local JSON
    try {
      await writeFile(dataFile, JSON.stringify({ products: productsForRepo }, null, 2), 'utf8');
    } catch (err) {
      console.error('Failed to write local products.json after delete:', err);
    }

    return res.json({ success: true });
  } catch (err) {
    console.error('admin delete error', err);
    return res.status(500).json({ success: false, error: err.message });
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

export default app;
