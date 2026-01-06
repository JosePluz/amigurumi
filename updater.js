/**
 * Auto-refresh inteligente
 * Recarga automáticamente productos cuando hay cambios
 */

class ProductsUpdater {
  constructor() {
    this.lastHash = null;
    this.checkInterval = 30000; // Cada 30 segundos
    this.init();
  }

  async init() {
    // Verificar cambios cada 30 segundos
    setInterval(() => this.checkForUpdates(), this.checkInterval);
    
    // También verificar cuando la página recupera el foco
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        console.log('🔄 Página visible, verificando actualizaciones...');
        this.checkForUpdates();
      }
    });
  }

  async checkForUpdates() {
    try {
      const response = await fetch('/api/products?t=' + Date.now(), {
        cache: 'no-store',
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      });

      if (!response.ok) return;

      const data = await response.json();
      const currentHash = JSON.stringify(data.data);
      
      // Si cambió, recargar catálogo
      if (this.lastHash && this.lastHash !== currentHash) {
        console.log('✅ Productos actualizados, recargando...');
        window.productsData = data.data || [];
        if (window.renderCatalog) {
          await window.renderCatalog();
        }
      }

      this.lastHash = currentHash;
    } catch (err) {
      console.warn('No se pudo verificar actualizaciones:', err.message);
    }
  }

  // Forzar actualización inmediata
  forceUpdate() {
    console.log('🔄 Forzando actualización...');
    this.lastHash = null;
    this.checkForUpdates();
  }
}

// Inicializar automáticamente
window.productsUpdater = new ProductsUpdater();

// Exportar para llamadas manuales
window.forceProductsUpdate = () => {
  if (window.productsUpdater) {
    window.productsUpdater.forceUpdate();
  }
};
