// --- INITIALIZACIÓN Y DATOS DEL POS ---
if (!window.db) window.db = {};
if (!window.db.catalogoPOS) {
  window.db.catalogoPOS = [
    { id: 1, nombre: 'Empanada', precio: 3000 },
    { id: 2, nombre: 'Tequeño', precio: 2500 },
    { id: 3, nombre: 'Pan de Jamón', precio: 15000 },
    { id: 4, nombre: 'Refresco / Bebida', precio: 4000 }
  ];
}
if (!window.db.carritoPOS) window.db.carritoPOS = [];

// --- FUNCIÓN PRINCIPAL DE RENDERIZADO DEL POS ---
function renderPOS() {
  const container = document.getElementById('pos-container');
  if (!container) return;

  // Insertar HTML de la interfaz del POS si no existe
  container.innerHTML = `
    <h3>🍽️ Punto de Venta (POS)</h3>
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 10px;">
      
      <!-- COLUMNA CATÁLOGO DE PRODUCTOS -->
      <div class="inner-card">
        <h4 style="margin-bottom: 8px;">Catálogo</h4>
        <div id="pos-catalogo-list">
          ${db.catalogoPOS.map(p => `
            <div class="daily-row">
              <div>
                <strong>${p.nombre}</strong><br>
                <small>$${p.precio.toLocaleString()}</small>
              </div>
              <button class="btn-primary" onclick="agregarAlCarrito(${p.id})" style="width:auto; padding:4px 8px; margin:0;">+ Añadir</button>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- COLUMNA CARRITO Y COBRO -->
      <div class="inner-card">
        <h4 style="margin-bottom: 8px;">Pedido Actual</h4>
        <div id="pos-lista-carrito"></div>
        <hr style="margin: 10px 0; border: 0; border-top: 1px solid #e2e8f0;">
        <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 1rem; margin-bottom: 10px;">
          <span>Total:</span>
          <span id="pos-total-monto">$0</span>
        </div>

        <h5 style="margin-bottom: 6px; font-size: 0.8rem; color: #475569;">Cobrar con:</h5>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px;">
          <button class="btn-primary" onclick="registrarVentaPOS('Efectivo')" style="background:#16a34a; font-size:0.75rem;">💵 Efectivo</button>
          <button class="btn-primary" onclick="registrarVentaPOS('Nequi')" style="background:#6366f1; font-size:0.75rem;">📱 Nequi</button>
          <button class="btn-primary" onclick="registrarVentaPOS('Bancolombia')" style="background:#f59e0b; font-size:0.75rem;">🏦 Bancolombia</button>
          <button class="btn-primary" onclick="registrarVentaPOS('Datáfono')" style="background:#0284c7; font-size:0.75rem;">💳 Datáfono</button>
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
  if (db.carritoPOS.length === 0) {
    cont.innerHTML = '<p style="font-size:0.8rem; color:#94a3b8; text-align:center;">Carrito vacío</p>';
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
          <div>
            <span>$${subtotal.toLocaleString()}</span>
            <button class="btn-secondary" onclick="eliminarDelCarrito(${index})" style="padding:2px 6px; margin-left:5px; width:auto; display:inline;">❌</button>
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
