// --- INICIALIZACIÓN Y DATOS DEL POS ---
if (!window.db) window.db = {};
if (!window.db.catalogoPOS) {
  window.db.catalogoPOS = [
    { id: 1, nombre: 'Pizza Familiar', precio: 35000 },
    { id: 2, nombre: 'Hamburguesa Especial', precio: 18000 },
    { id: 3, nombre: 'Perro Caliente', precio: 12000 },
    { id: 4, nombre: 'Tequeños x 6', precio: 15000 }
  ];
}
if (!window.db.carritoPOS) window.db.carritoPOS = [];

// --- FUNCIÓN PRINCIPAL DE RENDERIZADO DEL POS ---
function renderPOS() {
  const container = document.getElementById('pos-container');
  if (!container) return;

  container.innerHTML = `
    <h3 style="margin-bottom: 12px;">🍽️ Punto de Venta (POS)</h3>
    <div style="display: flex; flex-direction: column; gap: 12px;">
      
      <!-- SECCIÓN CATÁLOGO -->
      <div class="inner-card">
        <h4 style="margin-bottom: 10px; color: #475569;">Catálogo de Productos</h4>
        <div id="pos-catalogo-list">
          ${db.catalogoPOS.map(p => `
            <div class="daily-row" style="padding: 10px 0;">
              <div>
                <strong style="font-size: 0.95rem;">${p.nombre}</strong><br>
                <small style="color: #64748b; font-size: 0.85rem;">$${p.precio.toLocaleString()}</small>
              </div>
              <button class="btn-primary" onclick="agregarAlCarrito(${p.id})" style="width: auto; padding: 6px 12px; margin: 0; font-size: 0.8rem;">+ Añadir</button>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- SECCIÓN PEDIDO Y COBRO -->
      <div class="inner-card">
        <h4 style="margin-bottom: 10px; color: #475569;">Pedido Actual</h4>
        <div id="pos-lista-carrito"></div>
        <hr style="margin: 12px 0; border: 0; border-top: 1px dashed #cbd5e1;">
        <div style="display: flex; justify-content: space-between; align-items: center; font-weight: bold; font-size: 1.1rem; margin-bottom: 12px;">
          <span>Total:</span>
          <span id="pos-total-monto" style="color: var(--primary);">$0</span>
        </div>

        <h5 style="margin-bottom: 8px; font-size: 0.8rem; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Método de Pago:</h5>
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px;">
          <button class="btn-primary" onclick="registrarVentaPOS('Efectivo')" style="background:#16a34a; margin:0;">💵 Efectivo</button>
          <button class="btn-primary" onclick="registrarVentaPOS('Nequi')" style="background:#4f46e5; margin:0;">📱 Nequi</button>
          <button class="btn-primary" onclick="registrarVentaPOS('Bancolombia')" style="background:#d97706; margin:0;">🏦 Bancolombia</button>
          <button class="btn-primary" onclick="registrarVentaPOS('Datáfono')" style="background:#0284c7; margin:0;">💳 Datáfono</button>
        </div>
      </div>

    </div>
  `;

  renderCarritoPOS();
}

// --- COMPLEMENTO POS & GESTIÓN DE VENTAS Y DOMICILIOS ---
function agregarAlCarrito(productoId) {
  const prod = db.catalogoPOS.find(p => p.id === productoId);
  if (!prod) return;

  const enCarrito = db.carritoPOS.find(i => i.id === productoId);
  if (enCarrito) enCarrito.cantidad++;
  else db.carritoPOS.push({ ...prod, cantidad: 1 });

  renderCarritoPOS();
}

function renderCarritoPOS() {
  const cont = document.getElementById('pos-lista-carrito');
  const totEl = document.getElementById('pos-total-monto');
  if (!cont || !totEl) return;

  let total = 0;
  if (!db.carritoPOS || db.carritoPOS.length === 0) {
    cont.innerHTML = '<p style="font-size:0.85rem; color:#94a3b8; text-align:center; padding: 10px 0;">Carrito vacío</p>';
  } else {
    cont.innerHTML = db.carritoPOS.map((item, index) => {
      const subtotal = item.precio * item.cantidad;
      total += subtotal;
      return `
        <div class="daily-row">
          <div>
            <strong>${item.nombre}</strong><br>
            <small>${item.cantidad} x $${item.precio.toLocaleString()}</small>
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-weight: bold;">$${subtotal.toLocaleString()}</span>
            <button class="btn-secondary" onclick="eliminarDelCarrito(${index})" style="padding: 2px 8px; width: auto; font-size: 0.75rem;">❌</button>
          </div>
        </div>
      `;
    }).join('');
  }

  totEl.innerText = `$${total.toLocaleString()}`;
}

function eliminarDelCarrito(index) {
  db.carritoPOS.splice(index, 1);
  renderCarritoPOS();
}

function registrarVentaPOS(metodoPago) {
  if (!db.carritoPOS || db.carritoPOS.length === 0) {
    alert("⚠️ El carrito está vacío");
    return;
  }

  const totalVenta = db.carritoPOS.reduce((acc, i) => acc + (i.precio * i.cantidad), 0);
  const hoyFecha = new Date().toLocaleDateString();
  
  if (!db.movimientos) db.movimientos = [];
  let movHoy = db.movimientos.find(m => m.fechaRaw === hoyFecha);
  if (!movHoy) {
    const fechaActual = new Date();
    movHoy = {
      fecha: `${fechaActual.toLocaleDateString('es-CO', { weekday: 'long' })} (${hoyFecha})`,
      fechaRaw: hoyFecha,
      isoDate: fechaActual.toISOString().substring(0, 7),
      diaSemanaIndex: fechaActual.getDay(),
      ingresos: { Efectivo: 0, Nequi: 0, Bancolombia: 0, Datáfono: 0 },
      gastos: []
    };
    db.movimientos.push(movHoy);
  }

  movHoy.ingresos[metodoPago] = (movHoy.ingresos[metodoPago] || 0) + totalVenta;
  
  if (typeof guardarBD === 'function') guardarBD();
  db.carritoPOS = [];
  renderCarritoPOS();
  alert(`✅ Venta cobrada por $${totalVenta.toLocaleString()} en ${metodoPago}`);
}
