// --- ESTADO INICIAL POS ---
if (!window.db) window.db = {};

if (!window.db.catalogoPOS) {
  window.db.catalogoPOS = [
    { id: 1, nombre: 'Pizza Familiar', precio: 35000, cat: 'Comida' },
    { id: 2, nombre: 'Hamburguesa Especial', precio: 18000, cat: 'Comida' },
    { id: 3, nombre: 'Perro Caliente', precio: 12000, cat: 'Comida' },
    { id: 4, nombre: 'Tequeños x 6', precio: 15000, cat: 'Entradas' },
    { id: 5, nombre: 'Refresco 1.5L', precio: 7000, cat: 'Bebidas' },
    { id: 6, nombre: 'Jugo Natural', precio: 5000, cat: 'Bebidas' }
  ];
}

if (!window.db.mesasPOS) {
  window.db.mesasPOS = {
    'Mesa 1': [],
    'Mesa 2': [],
    'Mesa 3': [],
    'Mesa 4': [],
    'Mesa 5': [],
    'Para Llevar / Domicilio': []
  };
}

let mesaActiva = 'Mesa 1';

// --- RENDERIZADO PRINCIPAL POS ---
function renderPOS() {
  const container = document.getElementById('pos-container');
  if (!container) return;

  const nombresMesas = Object.keys(window.db.mesasPOS);

  container.innerHTML = `
    <h3 style="margin-bottom: 10px;">🍽️ Punto de Venta (POS)</h3>
    
    <!-- SELECTOR DE MESAS -->
    <div style="display: flex; gap: 6px; overflow-x: auto; padding-bottom: 8px; margin-bottom: 10px;">
      ${nombresMesas.map(nombreMesa => {
        const tieneItems = window.db.mesasPOS[nombreMesa].length > 0;
        const esSeleccionada = nombreMesa === mesaActiva;
        
        let bg = esSeleccionada ? 'var(--primary)' : '#f1f5f9';
        let color = esSeleccionada ? 'white' : '#334155';
        let border = tieneItems && !esSeleccionada ? '2px solid #ea580c' : '1px solid #cbd5e1';

        return `
          <button onclick="seleccionarMesa('${nombreMesa}')" style="background: ${bg}; color: ${color}; border: ${border}; padding: 8px 12px; border-radius: 8px; font-weight: bold; white-space: nowrap; cursor: pointer; font-size: 0.8rem;">
            ${nombreMesa} ${tieneItems ? '🔴' : ''}
          </button>
        `;
      }).join('')}
    </div>

    <!-- VISTA PRINCIPAL (CATÁLOGO + COMANDA) -->
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
      
      <!-- COLUMNA CATÁLOGO DE PRODUCTOS -->
      <div class="inner-card" style="padding: 10px;">
        <h4 style="font-size: 0.85rem; color: #475569; margin-bottom: 8px;">Catálogo</h4>
        <div style="display: flex; flex-direction: column; gap: 6px; max-height: 400px; overflow-y: auto;">
          ${window.db.catalogoPOS.map(p => `
            <div class="daily-row" style="padding: 6px 0;">
              <div style="line-height: 1.1;">
                <strong style="font-size: 0.85rem;">${p.nombre}</strong><br>
                <small style="color: #64748b; font-size: 0.75rem;">$${p.precio.toLocaleString()}</small>
              </div>
              <button class="btn-primary" onclick="agregarAlCarritoMesa(${p.id})" style="width: auto; padding: 4px 8px; margin: 0; font-size: 0.75rem;">+ Añadir</button>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- COLUMNA COMANDA MESA ACTIVA -->
      <div class="inner-card" style="padding: 10px;">
        <h4 style="font-size: 0.85rem; color: #475569; margin-bottom: 6px;">
          Comanda: <span style="color: var(--primary);">${mesaActiva}</span>
        </h4>
        
        <div id="pos-lista-carrito" style="min-height: 150px; max-height: 250px; overflow-y: auto;"></div>
        
        <hr style="margin: 8px 0; border: 0; border-top: 1px dashed #cbd5e1;">
        
        <div style="display: flex; justify-content: space-between; align-items: center; font-weight: bold; font-size: 0.95rem; margin-bottom: 8px;">
          <span>Total:</span>
          <span id="pos-total-monto" style="color: var(--primary);">$0</span>
        </div>

        <div style="font-size: 0.75rem; color: #64748b; margin-bottom: 4px; font-weight: bold;">Cobrar Mesa:</div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px;">
          <button class="btn-primary" onclick="cobrarMesaActiva('Efectivo')" style="background:#16a34a; margin:0; padding:6px; font-size:0.7rem;">💵 Efectivo</button>
          <button class="btn-primary" onclick="cobrarMesaActiva('Nequi')" style="background:#4f46e5; margin:0; padding:6px; font-size:0.7rem;">📱 Nequi</button>
          <button class="btn-primary" onclick="cobrarMesaActiva('Bancolombia')" style="background:#d97706; margin:0; padding:6px; font-size:0.7rem;">🏦 Bancolombia</button>
          <button class="btn-primary" onclick="cobrarMesaActiva('Datáfono')" style="background:#0284c7; margin:0; padding:6px; font-size:0.7rem;">💳 Datáfono</button>
        </div>
      </div>

    </div>
  `;

  renderCarritoMesa();
}

// --- GESTIÓN DE SELECCIÓN DE MESAS ---
function seleccionarMesa(nombreMesa) {
  mesaActiva = nombreMesa;
  renderPOS();
}

// --- AGREGAR Y RENDERIZAR PEDIDOS POR MESA ---
function agregarAlCarritoMesa(productoId) {
  const prod = window.db.catalogoPOS.find(p => p.id === productoId);
  if (!prod) return;

  const comanda = window.db.mesasPOS[mesaActiva];
  const itemExistente = comanda.find(i => i.id === productoId);

  if (itemExistente) {
    itemExistente.cantidad++;
  } else {
    comanda.push({ ...prod, cantidad: 1 });
  }

  renderPOS();
}

function renderCarritoMesa() {
  const cont = document.getElementById('pos-lista-carrito');
  const totEl = document.getElementById('pos-total-monto');
  if (!cont || !totEl) return;

  const comanda = window.db.mesasPOS[mesaActiva] || [];

  if (comanda.length === 0) {
    cont.innerHTML = '<p style="font-size:0.75rem; color:#94a3b8; text-align:center; padding: 20px 0;">Mesa libre / Sin productos</p>';
    totEl.innerText = '$0';
    return;
  }

  let total = 0;
  cont.innerHTML = comanda.map((item, index) => {
    const subtotal = item.precio * item.cantidad;
    total += subtotal;
    return `
      <div class="daily-row" style="padding: 4px 0;">
        <div style="line-height: 1.1;">
          <strong style="font-size: 0.8rem;">${item.nombre}</strong><br>
          <small style="color: #64748b; font-size: 0.7rem;">${item.cantidad} x $${item.precio.toLocaleString()}</small>
        </div>
        <div style="display: flex; align-items: center; gap: 4px;">
          <span style="font-size: 0.8rem; font-weight: bold;">$${subtotal.toLocaleString()}</span>
          <button class="btn-secondary" onclick="eliminarDelCarritoMesa(${index})" style="padding: 1px 5px; width: auto; font-size: 0.7rem;">❌</button>
        </div>
      </div>
    `;
  }).join('');

  totEl.innerText = `$${total.toLocaleString()}`;
}

function eliminarDelCarritoMesa(index) {
  window.db.mesasPOS[mesaActiva].splice(index, 1);
  renderPOS();
}

// --- COBRO Y REGISTRO DE VENTA ---
function cobrarMesaActiva(metodoPago) {
  const comanda = window.db.mesasPOS[mesaActiva] || [];
  if (comanda.length === 0) {
    alert("⚠️ Esta mesa no tiene productos cargados.");
    return;
  }

  const totalVenta = comanda.reduce((acc, i) => acc + (i.precio * i.cantidad), 0);
  const hoyFecha = new Date().toLocaleDateString();
  
  if (!window.db.movimientos) window.db.movimientos = [];
  let movHoy = window.db.movimientos.find(m => m.fechaRaw === hoyFecha);
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
    window.db.movimientos.push(movHoy);
  }

  movHoy.ingresos[metodoPago] = (movHoy.ingresos[metodoPago] || 0) + totalVenta;
  
  if (typeof guardarBD === 'function') guardarBD();
  
  window.db.mesasPOS[mesaActiva] = [];
  renderPOS();
  
  alert(`✅ Cobrado $${totalVenta.toLocaleString()} (${mesaActiva}) mediante ${metodoPago}`);
}
