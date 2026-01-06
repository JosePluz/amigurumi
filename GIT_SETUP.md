# 🔧 SETUP INICIAL (WINDOWS)

## 1️⃣ Instalar Git (si no lo tienes)

Descarga desde: https://git-scm.com/download/win

---

## 2️⃣ Inicializar el repo LOCAL

Abre PowerShell o CMD en la carpeta `yadi/`:

```powershell
cd C:\Users\josep\Downloads\yadi
git init
git add .
git commit -m "Initial commit: Amigurumis static site v1.0"
```

**Resultado esperado:**
```
[main (root-commit) abc1234] Initial commit
 12 files changed, ...
```

---

## 3️⃣ Crear Repo en GitHub

1. Ve a **https://github.com/new**
2. **Repository name:** `amigurumis` (o el que prefieras)
3. **Description:** "Catálogo estático de amigurumis hechos a mano"
4. **Public** (para que Render lo vea)
5. **Create repository**

---

## 4️⃣ Conectar Local con GitHub

GitHub te dará un comando tipo:

```powershell
git remote add origin https://github.com/tu-usuario/amigurumis.git
git branch -M main
git push -u origin main
```

Cópialo y ejecútalo en PowerShell.

**Resultado:** Tu código está en GitHub ☁️

---

## 5️⃣ Conectar GitHub a Render

1. Ve a **https://render.com**
2. Login / Sign Up (con GitHub es más fácil)
3. **Dashboard** → **New** → **Static Site**
4. **Connect Repository** → Selecciona `amigurumis`
5. Rellena:
   - **Name:** `amigurumis`
   - **Build Command:** (vacío)
   - **Publish Directory:** `.`
   - **Branch:** `main`
6. **Create Static Site**

✅ En 1 minuto tienes URL: `https://amigurumis.onrender.com`

---

## 6️⃣ PRÓXIMAS ACTUALIZACIONES (Flujo normal)

**Siempre que edites `products.js`:**

```powershell
git add products.js
git commit -m "Agregué nuevo producto: [nombre]"
git push origin main
```

Render **auto-redeploy** en 30 segundos. 🚀

---

## 📝 COMANDOS ÚTILES

```powershell
# Ver estado del repo
git status

# Ver historial de cambios
git log --oneline

# Deshacer último commit (si te equivocaste)
git reset --soft HEAD~1

# Ver diferencias
git diff
```

---

## 🆘 PROBLEMAS COMUNES

**"Permission denied (publickey)"**
→ Genera SSH key: https://docs.github.com/en/authentication/connecting-to-github-with-ssh

**"fatal: not a git repository"**
→ Estás en la carpeta equivocada. Asegúrate de estar en `/yadi/`

**"Everything up-to-date"**
→ No hay cambios. Edita `products.js` primero.

---

**¡Listo!** Ahora dominas el flujo: Editar → Commit → Push → Render 🎉
