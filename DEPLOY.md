# 🚀 CHECKLIST RENDER DEPLOYMENT

Pasos exactos para desplegar en Render (Primera vez):

## 1️⃣ PREPARAR EL REPO EN GITHUB

```bash
# Desde tu carpeta local (yadi/)
git init
git add .
git commit -m "Initial commit: Amigurumis static site"
```

Luego:
- Crea repo en github.com → New Repository → `amigurumis`
- Copia URL (ej: `https://github.com/tu-usuario/amigurumis.git`)

```bash
git remote add origin https://github.com/tu-usuario/amigurumis.git
git branch -M main
git push -u origin main
```

---

## 2️⃣ CONECTAR RENDER

1. Ve a **https://render.com**
2. Login / Sign Up
3. Botón **"New"** → **"Static Site"**
4. **"Connect Repository"** → Selecciona `amigurumis`
5. Rellena:

| Campo | Valor |
|-------|-------|
| Name | `amigurumis` |
| Build Command | (dejar vacío) |
| Publish Directory | `.` |
| Branch | `main` |

6. Click **"Create Static Site"**

✅ En 30 segundos tendrás URL tipo:  
`https://amigurumis.onrender.com`

---

## 3️⃣ ACTUALIZAR PRODUCTOS (FUTURO)

Cada vez que edites `products.js`:

```bash
git add products.js
git commit -m "Agregué producto: [nombre]"
git push origin main
```

**Render auto-redeploy en 30 segundos.**

---

## 📋 ESTRUCTURA QUE RENDER ESPERA

```
yadi/
├── index.html          ← Archivo raíz
├── style.css
├── products.js
├── img/
│   ├── amigurumi-1.svg
│   ├── amigurumi-2.svg
│   └── amigurumi-3.svg
├── README.md
└── package.json        ← (opcional, para futura escalabilidad)
```

✅ Presente: `index.html` en raíz → Render lo detecta automáticamente

---

## 🔧 SI HAY PROBLEMAS

**Sitio en blanco:**
→ Abre DevTools (F12), copia el error, revisa console

**Imágenes rotas:**
→ Verifica ruta exacta en `products.js` (case-sensitive)

**Cambios no se actualizan:**
→ Limpia caché: Ctrl+Shift+Supr → Recarga (F5)

**Necesito volver atrás:**
```bash
git log --oneline
git revert <hash-commit>
git push origin main
```

---

## 📊 MONITOREO EN VIVO

Render te mostrará:
- Logs de build en tiempo real
- Status de deployment
- Analytics básicos

Panel: `https://dashboard.render.com`

---

✨ **Listo. Ahora solo edita → Git Push → ¡Publicado!**
