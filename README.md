# 🧶 Amigurumis | Tienda Profesional en Render

**Catálogo profesional de amigurumis** hechos a mano, desplegado en **Render** con Node.js + Express.

Características:
- ✅ **Node.js + Express** (producción-ready)
- ✅ **Admin panel** con autenticación
- ✅ **Publicación a GitHub** (auto-deploy en Render)
- ✅ **Optimizado** para performance
- ✅ **Accesible** (WCAG AA)
- ✅ **Responsive** (móvil, tablet, desktop)
- ✅ **API REST** para integración

---

## 🚀 Instalación Rápida

### 1. Clonar y preparar

```bash
git clone <tu-repo>
cd yadi
npm install
```

### 2. Ejecutar localmente

```bash
npm start
# o para desarrollo
npm run dev
```

Abre **http://localhost:3000**

### 3. Administración

1. Click en botón **🔐 Admin** (esquina inferior derecha)
2. Contraseña: `admin2024` (cambiar en .env)
3. Agregar/editar/eliminar productos
4. Click **📤 Publicar en GitHub** para guardar

---

## 📁 Estructura Profesional

```
.
├── server.js                 # Servidor Express + API
├── package.json              # Dependencias Node
├── index.html                # Página principal (SPA)
├── products.js               # Catálogo (Array JSON)
├── admin.js                  # Sistema de administración
├── style.css                 # Estilos CSS3 puros
├── render.yaml               # Configuración Render
├── .env.example              # Variables de entorno
├── .gitignore               # Archivos a ignorar
└── img/                      # Carpeta de imágenes
```

---

## 🎯 Características Profesionales

### ✨ Admin Panel

- 🔐 Autenticación por contraseña (configurable)
- ➕ Crear, editar, eliminar productos en tiempo real
- 📸 Validación de imágenes (JPG, PNG, WEBP - máx 5MB)
- 💾 Guardado en localStorage para preview
- 📤 Publicar a GitHub con commits automáticos
- ✔️ Validación de datos antes de guardar
- 📱 Interfaz responsive y moderna

### 🌐 API REST

```bash
GET /api/health              # Health check
GET /api/products            # Listar todos
GET /api/products/:id        # Obtener uno
```

---

## 📝 Agregar Productos (Forma Fácil)

### Opción 1: Admin Panel (Recomendado ⭐)

1. **Click en 🔐 Admin** (esquina inferior derecha)
2. **Ingresa contraseña**: `admin2024`
3. **Completa el formulario**:
   - Nombre * (requerido)
   - Descripción (opcional, máx 500 caracteres)
   - Precio * (requerido)
   - Medidas (ancho × alto en cm)
   - Imagen (JPG, PNG, WEBP - máx 5MB)
4. **Click en 💾 Guardar**
5. **Ver preview** en tiempo real
6. **Click en 📤 Publicar en GitHub**
7. **Pega tu token de GitHub** (genéralo en github.com/settings/tokens)
8. ✅ **¡Listo!** Render se actualizará en 1-2 minutos

### Opción 2: Editar JSON Directamente

Abre `products.js` y agrega al array:

```javascript
{
  "id": 1,
  "name": "Osito Rosa Tierno",
  "imgs": ["img/osito-rosa.jpg"],
  "desc": "Oso tejido a mano, perfecto para abrazar.",
  "size": { "width": 15, "height": 20 },
  "price": 28.50
}
```

Luego: `git add . && git commit -m "Nuevo producto" && git push`

---

## 🌐 Deploy en Render (Producción)

### Paso 1: GitHub

```bash
git init
git add .
git commit -m "Initial: Amigurumis v2"
git remote add origin https://github.com/tu-usuario/amigurumis.git
git branch -M main
git push -u origin main
```

### Paso 2: Render

1. https://render.com → Login/Sign up
2. **New** → **Web Service**
3. Conecta tu repo GitHub
4. Configurar:
   - **Name**: `amigurumis`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. **Environment** (agregar):
   ```
   PORT=3000
   NODE_ENV=production
   ADMIN_PASSWORD=contraseña_segura
   REPO_OWNER=tu_usuario
   REPO_NAME=amigurumis
   ```
6. **Create Web Service**

✅ En 2-3 minutos tendrás: **https://amigurumis.onrender.com**

---

## 🔐 Seguridad en Producción

**ANTES de hacer deploy:**

1. **Cambiar contraseña admin** en Render Dashboard:
   ```
   ADMIN_PASSWORD = contraseña_segura_aquí
   ```

2. **Generar token GitHub** (si usas admin panel):
   - https://github.com/settings/tokens → New token
   - Selecciona scope `repo`
   - Cópialo (úsalo solo para publicar, no lo guardes)

3. **HTTPS automático** ✓ (Render lo proporciona)

---

## 🔄 Actualizaciones de Productos

Una vez en producción:

**Opción A: Admin Panel** ⭐ (Recomendado)
- Click 🔐 Admin
- Agregar/editar
- Click 📤 Publicar
- Token + Enter

**Opción B: Editar en GitHub**
- Edita `products.js` en web
- Haz commit
- Render auto-actualiza en 30 seg

---

## 📊 API para Integración

Endpoints para integraciones externas:

```bash
# Health check
GET /api/health
→ { status: "ok", uptime: 123.45 }

# Listar productos
GET /api/products
→ { success: true, count: 5, data: [...] }

# Obtener un producto
GET /api/products/123
→ { success: true, data: { id, name, ... } }
```

Úsalos en apps, Discord bots, integraciones, etc.

---

## 🎨 Personalización

### Cambiar colores

En `style.css`, busca:
```css
#FF7AA2  /* Rosa principal */
#FFF8F5  /* Fondo */
```

Reemplaza con tus colores.

### Cambiar contraseña

En `.env`:
```
ADMIN_PASSWORD=mi_contraseña_nueva
```

### Cambiar nombre del sitio

En `index.html`:
```html
<h1>🧶 Tu Nombre Aquí</h1>
```

---

## 📊 Validaciones de Calidad

### Performance (Lighthouse)

```bash
Chrome DevTools → F12 → Lighthouse → Analizar
```

Debe alcanzar **90+ en todas las métricas**.

### Validación HTML

https://validator.w3.org → Debe pasar sin errores

### Accesibilidad

- Navega con **TAB** por todas las tarjetas
- Cada elemento debe tener **focus visible** (borde rosado)

---

## 🛠️ Variables de Entorno

Crear `.env` (copiar de `.env.example`):

```bash
PORT=3000
NODE_ENV=production
ADMIN_PASSWORD=contraseña_secreta
REPO_OWNER=tu_usuario_github
REPO_NAME=amigurumis
```

⚠️ **NUNCA hacer push de `.env`** (está en .gitignore)

---

## 🐛 Troubleshooting

| Problema | Solución |
|----------|----------|
| Las imágenes no cargan | Verifica la ruta en `products.js` |
| Admin no funciona | F12 → Console, verifica errores |
| Render no actualiza | Espera 2 min, limpia caché (Ctrl+Shift+Supr) |
| Token GitHub rechazado | Verifica permisos `repo` scope |

---

## 📄 Licencia

- **Código**: MIT (usa libremente)
- **Imágenes**: Derechos reservados (reemplaza con tus fotos)

---

## 🤝 Soporte

- Documentación en archivos `.js`, `.html`, `.css` (bien comentados)
- Issues en GitHub
- Cambios recientes: `git log`

---

**Hecho con ♡ para artesanas creativas** ✨
