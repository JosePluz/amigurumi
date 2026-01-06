/**
 * Catálogo de Productos - Amigurumis
 * 
 * INSTRUCCIONES:
 * 1. Cada producto DEBE tener: id, name, imgs, desc, size, price
 * 2. imgs es un ARRAY de rutas (ej: ["img/producto1.jpg", "img/producto1-2.jpg"])
 * 3. Los IDs deben ser únicos y > 0
 * 4. El precio debe ser un número positivo
 * 5. Size es el tamaño en cm (ancho x alto)
 * 
 * Este archivo se carga automáticamente en:
 * - Frontend: para renderizar el catálogo
 * - Backend: vía API /api/products
 * - Admin: para administrar y publicar cambios
 */

export const products = [
  // Agregar productos aquí siguiendo el formato:
  // {
  //   "id": 1,
  //   "name": "Nombre del Amigurumi",
  //   "imgs": ["img/foto1.jpg", "img/foto2.jpg"],
  //   "desc": "Descripción breve del producto",
  //   "size": { "width": 15, "height": 20 },
  //   "price": 24.99
  // }
];

/**
 * Renderizar catálogo en el DOM
 */
async function renderCatalog() {
  const catalog = document.getElementById('catalog');
  if (!catalog) return;
  
  let itemsToRender = [];
  
  // Intentar cargar desde API primero (más fresco)
  try {
    const response = await fetch('/api/products?t=' + Date.now(), {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      itemsToRender = data.data || [];
    }
  } catch (err) {
    // Si falla la API, usar productos locales
    console.log('API no disponible, usando productos locales');
    itemsToRender = window.productsData || products;
  }
  
  // Fallback: usar datos del repo si nada funciona
  if (!itemsToRender || itemsToRender.length === 0) {
    itemsToRender = window.productsData || products;
  }
  
  // Migración: convertir "img" a "imgs" si existen datos viejos
  itemsToRender = itemsToRender.map(p => ({
    ...p,
    imgs: p.imgs || (p.img ? [p.img] : [])
  }));

  // Validar y filtrar productos sin imágenes válidas
  itemsToRender = itemsToRender.filter(p => p.imgs && p.imgs.length > 0 && p.name && p.price);
  
  // Si no hay productos, mostrar mensaje
  if (itemsToRender.length === 0) {
    catalog.innerHTML = `
      <div class="empty-state" style="grid-column: 1/-1; text-align: center; padding: 3rem 1rem;">
        <p style="font-size: 1.2rem; color: #999;">
          📦 Próximamente: Nuestros amigurumis exclusivos
        </p>
        <p style="color: #ccc; font-size: 0.9rem;">
          Sigue @amigurumis en redes para las novedades
        </p>
      </div>
    `;
    return;
  }
  
  // Ordenar por precio ascendente
  itemsToRender.sort((a, b) => a.price - b.price);

  // Renderizar productos
  catalog.innerHTML = itemsToRender.map(product => `
    <article class="card" aria-label="Producto: ${escapeHtml(product.name)}, $${product.price.toFixed(2)}">
      <img 
        src="${escapeHtml(product.imgs[0])}" 
        alt="${escapeHtml(product.name)} - Amigurumi hecho a mano"
        class="card__img"
        loading="lazy"
        width="400"
        height="400"
      />
      <h3 class="card__name">${escapeHtml(product.name)}</h3>
      <p class="card__desc">${escapeHtml(product.desc)}</p>
      ${product.imgs.length > 1 ? `<p class="card__badge">+${product.imgs.length - 1} fotos</p>` : ''}
      <p class="card__size">
        <span class="card__label">Medidas:</span> 
        ${product.size.width} × ${product.size.height} cm
      </p>
      <p class="card__price">$${product.price.toFixed(2)}</p>
    </article>
  `).join('');

  // Lightbox: ver imagen en grande
  setupLightbox(itemsToRender);
}

/**
 * Setup del lightbox para galerías de imágenes
 */
function setupLightbox(itemsToRender) {
  const catalogEl = document.getElementById('catalog');
  const lightbox = document.getElementById('lightbox');
  
  if (!catalogEl || !lightbox) return;
  
  catalogEl.onclick = (e) => {
    const img = e.target.closest && e.target.closest('.card__img');
    if (!img) return;
    
    const card = img.closest('.card');
    const productName = card.querySelector('.card__name').textContent;
    const product = itemsToRender.find(p => p.name === productName);
    
    if (!product) return;

    // Mostrar galería
    const galleryHTML = product.imgs.length > 1 
      ? `<div class="lightbox__gallery">
           <img src="${escapeHtml(product.imgs[0])}" alt="${escapeHtml(productName)}" class="lightbox__img" />
           <div class="lightbox__thumbs">
             ${product.imgs.map((imgSrc, idx) => `
               <button class="lightbox__thumb ${idx === 0 ? 'active' : ''}" data-src="${escapeHtml(imgSrc)}" aria-label="Foto ${idx+1}"></button>
             `).join('')}
           </div>
         </div>`
      : `<img src="${escapeHtml(product.imgs[0])}" alt="${escapeHtml(productName)}" class="lightbox__img" />`;

    lightbox.innerHTML = `
      <div class="lightbox__backdrop" tabindex="0">
        ${galleryHTML}
      </div>`;
    lightbox.hidden = false;
    lightbox.querySelector('.lightbox__backdrop').focus();

    // Cambiar entre miniaturas
    lightbox.querySelectorAll('.lightbox__thumb').forEach(thumb => {
      thumb.onclick = (ev) => {
        const src = ev.target.dataset.src;
        lightbox.querySelector('.lightbox__img').src = src;
        lightbox.querySelectorAll('.lightbox__thumb').forEach(t => t.classList.remove('active'));
        ev.target.classList.add('active');
      };
    });
  };

  // Cerrar con ESC o click en backdrop
  window.addEventListener('keydown', (ev) => { 
    if (ev.key === 'Escape') lightbox.hidden = true; 
  });
  
  lightbox.onclick = (ev) => { 
    if (ev.target.classList.contains('lightbox__backdrop')) lightbox.hidden = true; 
  };
}

/**
 * Escapar HTML para prevenir XSS
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Exportar para usar en admin.js
window.renderCatalog = renderCatalog;

// Renderizar cuando carga el DOM
window.addEventListener('load', renderCatalog);
