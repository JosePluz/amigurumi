#!/bin/bash
# Script para incrementar versión de caché y hacer publish

# Colores para terminal
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Publicar con Caché Actualizado${NC}"
echo ""

# Leer versión actual
CURRENT_VERSION=$(grep -oP '?v=\K[0-9.]+' index.html | head -1)
echo "Versión actual: $CURRENT_VERSION"

# Calcular nueva versión
NEW_VERSION=$(echo "$CURRENT_VERSION + 0.1" | bc)

echo "Nueva versión: $NEW_VERSION"
echo ""

# Reemplazar versiones en archivos
echo "📝 Actualizando versiones..."

# En Windows (si usa PowerShell)
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
  echo "En Windows, ejecuta en PowerShell:"
  echo ""
  echo "(Get-Content index.html) -replace '?v=.*?\"', \"?v=$NEW_VERSION\" | Set-Content index.html"
  echo ""
else
  # En Linux/Mac
  sed -i "s/?v=[0-9.]*/?v=$NEW_VERSION/g" index.html
  echo "✅ Versiones actualizadas a $NEW_VERSION"
fi

echo ""
echo "📤 Pasos siguientes:"
echo "1. git add ."
echo "2. git commit -m '🔄 Auto-refresh v$NEW_VERSION'"
echo "3. git push origin main"
echo ""
echo -e "${GREEN}✨ Render se actualizará automáticamente (2-3 min)${NC}"
