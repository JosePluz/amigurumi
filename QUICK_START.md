# 🎯 QUICK START (3 PASOS PARA ARTESANA)

## Paso 1: Editar Productos

Abre `products.js` con VS Code:

```javascript
// Copia un objeto del array, cambia estos datos:
{
  id: 7,                          // ← Número único
  name: "Tu Producto",            // ← Nombre
  img: "img/amigurumi-1.svg",     // ← Imagen (usa existentes o sube una)
  desc: "Descripción corta...",   // ← Lo que ves en la tarjeta
  size: { width: 15, height: 20 }, // ← Medidas en cm
  price: 25.00                     // ← Precio en EUR
}
```

Guarda (Ctrl+S).

---

## Paso 2: Ver en Vivo (Opción A - VS Code)

1. Instala extensión **"Live Server"** en VS Code
2. Click derecho en `index.html` → "Open with Live Server"
3. ¡Ves los cambios en tiempo real! 🎉

---

## Paso 2: Ver en Vivo (Opción B - Terminal)

```bash
cd ruta/a/tu/carpeta/yadi
npx serve .
# Abre http://localhost:3000
```

---

## Paso 3: Publicar en Render (Internet)

```bash
git add products.js
git commit -m "Nuevo producto: Tu Producto"
git push origin main
```

✅ En 30 segundos está en https://tu-sitio.onrender.com

---

**¿Preguntas?** Ver `README.md` (completo) o `DEPLOY.md` (Render)
