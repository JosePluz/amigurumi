#!/bin/bash
# Build script para Render - ejecutado automáticamente

set -e

echo "🚀 Build Render iniciado..."
echo "📦 Instalando dependencias..."

npm ci --production

echo "✅ Build completado"
echo "   Node.js: $(node --version)"
echo "   NPM: $(npm --version)"
echo ""
echo "⏳ Servidor iniciará en: npm start"
echo "🌐 Puerto: 3000"
echo ""
