# 🚀 Quick Start - Amigurumis

## Para Comenzar (5 minutos)

### 1. Instalar

```bash
npm install
```

### 2. Ejecutar

```bash
npm start
```

Abre: **http://localhost:3000**

### 3. Admin

- Click: **🔐 Admin**
- Contraseña: **admin2024**
- Agregar productos
- Guardar

---

## 📱 Ver en el Navegador

| Dispositivo | URL |
|-------------|-----|
| Escritorio | http://localhost:3000 |
| Móvil | http://tu-ip-local:3000 |

---

## 🎯 Agregar tu Primer Producto

1. **Click 🔐 Admin**
2. **Contraseña**: admin2024
3. **Llenar**:
   - Nombre: `Mi Primer Amigurumi`
   - Precio: `24.99`
   - Subir imagen (JPG, PNG, WEBP)
   - Medir: 15cm × 20cm
4. **Click 💾 Guardar**
5. ¡Ver en el catálogo!

---

## 📤 Publicar en GitHub

### Primero: Crear repo GitHub

1. https://github.com/new
2. Nombre: `amigurumis`
3. Crear

### Luego: Push local

```bash
git init
git add .
git commit -m "Inicial"
git remote add origin https://github.com/tu-usuario/amigurumis.git
git branch -M main
git push -u origin main
```

### En Admin Panel:

1. **📤 Publicar en GitHub**
2. Token: (generar en https://github.com/settings/tokens)
3. ¡Listo!

---

## 🌐 Deploy en Render

1. https://render.com
2. New → Web Service
3. Conecta repo GitHub
4. Rellena:
   - Start Command: `npm start`
   - Build Command: `npm install`
5. Environment: Agregar
   - PORT=3000
   - ADMIN_PASSWORD=admin2024
6. Create

**Tu sitio en 2 minutos** 🎉

---

## 🆘 Problemas Comunes

### Node no está instalado
- Descarga: https://nodejs.org
- Instala versión LTS

### `npm: command not found`
- Reinicia terminal
- O recorre: C:\Program Files\nodejs\npm.cmd

### Admin no aparece
- Abre F12 → Console
- Busca errores en rojo
- Verifica que admin.js esté incluido en index.html

### Las imágenes no cargan
- Copia archivos a carpeta `img/`
- Verifica las rutas en products.js

---

## 📖 Documentación Completa

Ver **README.md** para:
- ✅ Setup completo
- ✅ Estructura de datos
- ✅ API endpoints
- ✅ Personalización
- ✅ Troubleshooting

---

**¡Listo para comenzar!** 🧶
