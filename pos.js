// --- ESTADO GLOBAL Y CONFIGURACIÓN ---
if (!window.db) window.db = {};

if (!window.db.mesasPOS) {
  window.db.mesasPOS = {
    'Mesa 1': [], 'Mesa 2': [], 'Mesa 3': [], 'Mesa 4': [], 
    'Mesa 5': [], 'Mesa 6': [], 'Mesa 7': [], 'Para Llevar / Domicilio': []
  };
}

if (!window.db.ventasPorCategoria) {
  window.db.ventasPorCategoria = {
    Pizzas: 0, Arepas: 0, Perros: 0, Patacones: 0, Otros: 0
  };
}

let mesaActiva = null; 
let categoriaSeleccionada = 'Pizzas';

const OPCIONES_PIZZAS = {
  clasica: {
    nombre: 'Pizza Clásica',
    tamanos: { Personal: 15000, Mediana: 28000, Familiar: 38000 },
    gratis: 2,
    precioExtra: 3000
  },
  premium: {
    nombre: 'Pizza Premium',
    tamanos: { Mediana: 35000, Familiar: 45000 },
    gratis: 2,
    precioExtra: 4000
  }
};

const INGREDIENTES = ['Jamón', 'Queso', 'Tocineta', 'Champiñones', 'Maíz', 'Piña', 'Pollo', 'Pepperoni'];

const CATALOGO_OTROS = [
  { id: 101, categoria: 'Arepas', nombre: 'Arepa Mixta', precio: 14000 },
  { id: 102, categoria: 'Arepas', nombre: 'Arepa de Carne Desmechada', precio: 15000 },
  { id: 103, categoria: 'Arepas', nombre: 'Arepa de Pollo y Queso', precio: 13000 },
  { id: 201, categoria: 'Perros', nombre: 'Perro Sencillo', precio: 10000 },
  { id: 202, categoria: 'Perros', nombre: 'Perro Especial (Tocineta/Queso)', precio: 14000 },
  { id: 301, categoria: 'Patacones', nombre: 'Patacón con Carne', precio: 18000 },
  { id: 302, categoria: 'Patacones', nombre: 'Patacón Mixto', precio: 22000 }
];

// --- RENDERIZADO PRINCIPAL ---
function renderPOS() {
  const container = document.getElementById('pos-container');
  if (!container) return;

  if (!mesaActiva) {
    renderVistaMesasGrid(container);
  } else {
    renderVistaMesaDetalle(container);
  }
}

// 1. VISTA CUADRÍCULA DE MESAS
function renderVistaMesasGrid(container) {
  const nombresMesas = Object.keys(window.db.mesasPOS);

  container.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
      <h3 style="margin: 0;">🪑 Selección de Mesas</h3>
      <span style="font-size: 0.85rem; background: #e2e8f0; padding: 4px 10px; border-radius: 12px; font-weight: bold;">
        Mesas: ${nombresMesas.length}
      </span>
    </div>

    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 10px;">
      ${nombresMesas.map(nombre => {
        const comanda = window.db.mesasPOS[nombre] || [];
        const ocupada = comanda.length > 0;
        const total = comanda.reduce((acc, item) => acc + item.precioTotal, 0);

        return `
          <div onclick="abrirMesa('${nombre}')" style="
            background: ${ocupada ? '#dcfce7' : '#ffffff'};
            border: 2px solid ${ocupada ? '#22c55e' : '#cbd5e1'};
            border-radius: 12px;
            padding: 12px 8px;
            text-align: center;
            cursor: pointer;
            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
            display: flex;
            flex-direction: column;
            justify-content: space-between;
          ">
            <div>
              <strong style="font-size: 0.95rem; color: #1e293b;">${nombre}</strong><br>
              <small style="color: ${ocupada ? '#15803d' : '#64748b'}; font-size: 0.75rem;">
                ${ocupada ? 'Ocupada' : 'Disponible'}
              </small>
            </div>

            <div style="margin: 10px 0;">
              <span style="font-size: 1.8rem;">${ocupada ? '🪑🔴' : '🪑🟢'}</span>
            </div>

            <div style="background: ${ocupada ? '#15803d' : '#f1f5f9'}; color: ${ocupada ? 'white' : '#475569'}; padding: 4px; border-radius: 6px; font-weight: bold; font-size: 0.8rem;">
              $${total.toLocaleString()}
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

// 2. VISTA COMANDA Y MENÚ POR CATEGORÍAS
function renderVistaMesaDetalle(container) {
  const comanda = window.db.mesasPOS[mesaActiva] || [];
  const totalMesa = comanda.reduce((acc, item) => acc + item.precioTotal, 0);

  const categorias = ['Pizzas', 'Arepas', 'Perros', 'Patacones'];

  container.innerHTML = `
    <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 10px;">
      <button class="btn-secondary" onclick="cerrarMesa()" style="width: auto; padding: 4px 10px; margin: 0;">← Volver a Mesas</button>
      <h3 style="margin: 0; font-size: 1.1rem;">Mesa: <span style="color: var(--primary);">${mesaActiva}</span></h3>
    </div>

    <!-- PESTAÑAS DE CATEGORÍAS -->
    <div style="display: flex; gap: 4px; margin-bottom: 10px; overflow-x: auto; padding-bottom: 4px;">
      ${categorias.map(cat => `
        <button onclick="cambiarCategoria('${cat}')" style="
          padding: 6px 12px;
          border-radius: 8px;
          border: 1px solid #cbd5e1;
          font-weight: bold;
          font-size: 0.8rem;
          white-space: nowrap;
          cursor: pointer;
          background: ${categoriaSeleccionada === cat ? 'var(--primary)' : '#ffffff'};
          color: ${categoriaSeleccionada === cat ? '#ffffff' : '#334155'};
        ">${cat}</button>
      `).join('')}
    </div>

    <!-- VISTA FORMULARIO SEGÚN CATEGORÍA -->
    <div class="inner-card" style="padding: 10px; margin-bottom: 10px; background: #fff7ed; border: 1px solid #ffedd5;">
      ${renderFormularioCategoria()}
    </div>

    <!-- COMANDA ACTUAL MESA -->
    <div class="inner-card" style="padding: 10px;">
      <h4 style="margin-bottom: 8px; color: #475569; font-size: 0.9rem;">Comanda Actual</h4>
      
      <div id="pos-items-mesa" style="min-height: 100px; max-height: 200px; overflow-y: auto;">
        ${comanda.length === 0 ? '<p style="font-size:0.8rem; color:#94a3b8; text-align:center;">No hay productos cargados</p>' : ''}
        ${comanda.map((item, index) => `
          <div class="daily-row" style="padding: 6px 0; border-bottom: 1px solid #f1f5f9;">
            <div style="line-height: 1.2;">
              <strong style="font-size: 0.85rem;">[${item.categoria}] ${item.nombre} ${item.tamano ? `(${item.tamano})` : ''}</strong><br>
              ${item.ingredientes && item.ingredientes.length > 0 ? `<small style="color: #64748b; font-size: 0.7rem;">Ing: ${item.ingredientes.join(', ')}</small><br>` : ''}
              ${item.obs ? `<small style="color: #d97706; font-size: 0.7rem;">📝 ${item.obs}</small>` : ''}
            </div>
            <div style="display: flex; align-items: center; gap: 6px;">
              <span style="font-size: 0.85rem; font-weight: bold;">$${item.precioTotal.toLocaleString()}</span>
              <button class="btn-secondary" onclick="eliminarItemMesa(${index})" style="padding: 2px 6px; width: auto; font-size: 0.7rem;">❌</button>
            </div>
          </div>
        `).join('')}
      </div>

      <hr style="margin: 10px 0; border: 0; border-top: 1px dashed #cbd5e1;">

      <div style="display: flex; justify-content: space-between; align-items: center; font-weight: bold; font-size: 1.1rem; margin-bottom: 10px;">
        <span>Total Mesa:</span>
        <span style="color: var(--primary);">$${totalMesa.toLocaleString()}</span>
      </div>

      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 6px;">
        <button class="btn-primary" onclick="cobrarMesa('Efectivo')" style="background:#16a34a; margin:0; font-size:0.75rem;">💵 Efectivo</button>
        <button class="btn-primary" onclick="cobrarMesa('Nequi')" style="background:#4f46e5; margin:0; font-size:0.75rem;">📱 Nequi</button>
        <button class="btn-primary" onclick="cobrarMesa('Bancolombia')" style="background:#d97706; margin:0; font-size:0.75rem;">🏦 Bancolombia</button>
        <button class="btn-primary" onclick="cobrarMesa('Datáfono')" style="background:#0284c7; margin:0; font-size:0.75rem;">💳 Datáfono</button>
      </div>
    </div>
  `;

  if (categoriaSeleccionada === 'Pizzas') actualizarOpcionesPizza();
}

// RENDERIZADOR DE FORMULARIO POR CATEGORÍA
function renderFormularioCategoria() {
  if (categoriaSeleccionada === 'Pizzas') {
    return `
      <h4 style="margin-bottom: 8px; color: #c2410c; font-size: 0.9rem;">🍕 Armar Pizza</h4>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-bottom: 8px;">
        <select id="pz-tipo" onchange="actualizarOpcionesPizza()" style="padding: 6px; border-radius: 6px; border: 1px solid #cbd5e1; font-size: 0.8rem;">
          <option value="clasica">Pizza Clásica</option>
          <option value="premium">Pizza Premium</option>
        </select>
        <select id="pz-tamano" style="padding: 6px; border-radius: 6px; border: 1px solid #cbd5e1; font-size: 0.8rem;"></select>
      </div>

      <div style="font-size: 0.75rem; color: #475569; margin-bottom: 4px; font-weight: bold;">Ingredientes (2 Gratis - Adicionales de pago):</div>
      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 4px; margin-bottom: 8px;">
        ${INGREDIENTES.map(ing => `
          <label style="font-size: 0.75rem; display: flex; align-items: center; gap: 4px; background: white; padding: 4px 6px; border-radius: 4px; border: 1px solid #e2e8f0;">
            <input type="checkbox" name="ing-check" value="${ing}"> ${ing}
          </label>
        `).join('')}
      </div>

      <input type="text" id="item-obs" placeholder="Observaciones de la comanda..." style="width: 100%; padding: 6px; border-radius: 6px; border: 1px solid #cbd5e1; font-size: 0.75rem; margin-bottom: 8px; box-sizing: border-box;">
      <button class="btn-primary" onclick="agregarPizzaMesa()" style="margin: 0; padding: 8px; font-size: 0.8rem;">+ Agregar Pizza</button>
    `;
  }

  const productosCat = CATALOGO_OTROS.filter(p => p.categoria === categoriaSeleccionada);
  return `
    <h4 style="margin-bottom: 8px; color: #c2410c; font-size: 0.9rem;">🍔 Categoría: ${categoriaSeleccionada}</h4>
    <div style="display: flex; flex-direction: column; gap: 6px; margin-bottom: 8px;">
      ${productosCat.map(p => `
        <div class="daily-row" style="background: white; padding: 6px 8px; border-radius: 6px; border: 1px solid #e2e8f0;">
          <div>
            <strong style="font-size: 0.85rem;">${p.nombre}</strong><br>
            <small style="color: #64748b;">$${p.precio.toLocaleString()}</small>
          </div>
          <button class="btn-primary" onclick="agregarOtrosMesa(${p.id})" style="width: auto; padding: 4px 8px; margin: 0; font-size: 0.75rem;">+ Agregar</button>
        </div>
      `).join('')}
    </div>
    <input type="text" id="item-obs-otros" placeholder="Observación para el producto..." style="width: 100%; padding: 6px; border-radius: 6px; border: 1px solid #cbd5e1; font-size: 0.75rem; margin-bottom: 4px; box-sizing: border-box;">
  `;
}

// --- LOGICA ACCIONES Y NAVEGACIÓN ---
function abrirMesa(nombre) { mesaActiva = nombre; renderPOS(); }
function cerrarMesa() { mesaActiva = null; renderPOS(); }
function cambiarCategoria(cat) { categoriaSeleccionada = cat; renderPOS(); }

function actualizarOpcionesPizza() {
  const selectTipo = document.getElementById('pz-tipo');
  const selectTamano = document.getElementById('pz-tamano');
  if (!selectTipo || !selectTamano) return;

  const config = OPCIONES_PIZZAS[selectTipo.value];
  selectTamano.innerHTML = Object.keys(config.tamanos).map(t => `
    <option value="${t}">${t} - $${config.tamanos[t].toLocaleString()}</option>
  `).join('');
}

function agregarPizzaMesa() {
  const tipoKey = document.getElementById('pz-tipo').value;
  const tamano = document.getElementById('pz-tamano').value;
  const obs = document.getElementById('item-obs').value.trim();
  
  const config = OPCIONES_PIZZAS[tipoKey];
  const precioBase = config.tamanos[tamano];
  const ingSeleccionados = Array.from(document.querySelectorAll('input[name="ing-check"]:checked')).map(el => el.value);

  const adicionalesCount = Math.max(0, ingSeleccionados.length - config.gratis);
  const costoAdicionales = adicionalesCount * config.precioExtra;

  window.db.mesasPOS[mesaActiva].push({
    categoria: 'Pizzas',
    nombre: config.nombre,
    tamano: tamano,
    ingredientes: ingSeleccionados,
    obs: obs,
    precioTotal: precioBase + costoAdicionales
  });

  renderPOS();
}

function agregarOtrosMesa(idProd) {
  const prod = CATALOGO_OTROS.find(p => p.id === idProd);
  if (!prod) return;

  const obsInput = document.getElementById('item-obs-otros');
  const obs = obsInput ? obsInput.value.trim() : '';

  window.db.mesasPOS[mesaActiva].push({
    categoria: prod.categoria,
    nombre: prod.nombre,
    obs: obs,
    precioTotal: prod.precio
  });

  renderPOS();
}

function eliminarItemMesa(index) {
  window.db.mesasPOS[mesaActiva].splice(index, 1);
  renderPOS();
}

function cobrarMesa(metodoPago) {
  const comanda = window.db.mesasPOS[mesaActiva] || [];
  if (comanda.length === 0) {
    alert("⚠️ No hay productos en esta mesa para cobrar.");
    return;
  }

  const totalVenta = comanda.reduce((acc, i) => acc + i.precioTotal, 0);
  const hoyFecha = new Date().toLocaleDateString();

  // 1. Acumular conteo y monto por Categoría para Métricas
  if (!window.db.ventasPorCategoria) window.db.ventasPorCategoria = {};
  comanda.forEach(item => {
    const cat = item.categoria || 'Otros';
    window.db.ventasPorCategoria[cat] = (window.db.ventasPorCategoria[cat] || 0) + item.precioTotal;
  });

  // 2. Acumular a Flujo de Caja
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
  alert(`✅ ${mesaActiva} cobrada con éxito ($${totalVenta.toLocaleString()} en ${metodoPago})`);
  cerrarMesa();
}
