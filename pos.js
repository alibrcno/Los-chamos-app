// --- ESTADO GLOBAL Y CONFIGURACIÓN ---
if (!window.db) window.db = {};

if (!window.db.mesasPOS) {
  window.db.mesasPOS = {
    'Mesa 1': [], 'Mesa 2': [], 'Mesa 3': [], 'Mesa 4': [], 
    'Mesa 5': [], 'Mesa 6': [], 'Mesa 7': []
  };
}

if (!window.db.domiciliosPOS) window.db.domiciliosPOS = [];
if (!window.db.ventasPorCategoria) {
  window.db.ventasPorCategoria = { Pizzas: 0, Arepas: 0, Perros: 0, Patacones: 0, Otros: 0 };
}

let mesaActiva = null; 
let vistaActual = 'mesas'; // 'mesas' o 'domicilios'
let categoriaSeleccionada = 'Pizzas';

// Estado para el constructor paso a paso de Pizzas
let pasoPizza = 1; // 1: Tipo | 2: Tamaño | 3: Ingredientes
let pizzaEnProceso = { tipo: null, tamano: null, precioBase: 0, gratis: 2, precioExtra: 3000 };

const CONFIG_PIZZAS = {
  tradicional: {
    nombre: 'Pizza Tradicional',
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
  { id: 201, categoria: 'Perros', nombre: 'Perro Especial', precio: 14000 },
  { id: 301, categoria: 'Patacones', nombre: 'Patacón Mixto', precio: 22000 }
];

// --- RENDERIZADO PRINCIPAL ---
function renderPOS() {
  const container = document.getElementById('pos-container');
  if (!container) return;

  if (vistaActual === 'domicilios') {
    renderVistaDomicilios(container);
  } else if (!mesaActiva) {
    renderVistaMesasGrid(container);
  } else {
    renderVistaMesaDetalle(container);
  }
}

// BARRA NAVEGACIÓN (MESAS / DOMICILIOS)
function renderBarraModos() {
  const countDom = window.db.domiciliosPOS.length;
  return `
    <div style="display: flex; gap: 8px; margin-bottom: 12px;">
      <button onclick="cambiarVista('mesas')" style="flex: 1; padding: 10px; border-radius: 8px; font-weight: bold; border: 1px solid #cbd5e1; background: ${vistaActual === 'mesas' ? 'var(--primary)' : '#f8fafc'}; color: ${vistaActual === 'mesas' ? 'white' : '#334155'}; cursor: pointer;">
        🪑 Mesas Salon
      </button>
      <button onclick="cambiarVista('domicilios')" style="flex: 1; padding: 10px; border-radius: 8px; font-weight: bold; border: 1px solid #cbd5e1; background: ${vistaActual === 'domicilios' ? 'var(--primary)' : '#f8fafc'}; color: ${vistaActual === 'domicilios' ? 'white' : '#334155'}; cursor: pointer;">
        🛵 Domicilios (${countDom})
      </button>
    </div>
  `;
}

// 1. CUADRÍCULA DE MESAS
function renderVistaMesasGrid(container) {
  const nombresMesas = Object.keys(window.db.mesasPOS);

  container.innerHTML = `
    ${renderBarraModos()}
    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 10px;">
      ${nombresMesas.map(nombre => {
        const comanda = window.db.mesasPOS[nombre] || [];
        const ocupada = comanda.length > 0;
        const total = comanda.reduce((acc, item) => acc + item.precioTotal, 0);

        return `
          <div onclick="abrirMesa('${nombre}')" style="background: ${ocupada ? '#dcfce7' : '#ffffff'}; border: 2px solid ${ocupada ? '#22c55e' : '#cbd5e1'}; border-radius: 12px; padding: 10px; text-align: center; cursor: pointer;">
            <strong style="font-size: 0.9rem;">${nombre}</strong><br>
            <span style="font-size: 1.5rem;">${ocupada ? '🪑🔴' : '🪑🟢'}</span>
            <div style="background: ${ocupada ? '#15803d' : '#f1f5f9'}; color: ${ocupada ? 'white' : '#475569'}; padding: 4px; border-radius: 6px; font-weight: bold; font-size: 0.8rem; margin-top: 6px;">
              $${total.toLocaleString()}
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

// 2. VISTA COMANDA MESA CON FLUJO PASO A PASO
function renderVistaMesaDetalle(container) {
  const comanda = window.db.mesasPOS[mesaActiva] || [];
  const totalMesa = comanda.reduce((acc, item) => acc + item.precioTotal, 0);

  container.innerHTML = `
    <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 10px;">
      <button class="btn-secondary" onclick="cerrarMesa()" style="width: auto; padding: 4px 10px; margin: 0;">← Volver</button>
      <h3 style="margin: 0; font-size: 1.1rem;">Mesa: <span style="color: var(--primary);">${mesaActiva}</span></h3>
    </div>

    <!-- BOTONES DE CATEGORÍAS -->
    <div style="display: flex; gap: 4px; margin-bottom: 10px; overflow-x: auto;">
      ${['Pizzas', 'Arepas', 'Perros', 'Patacones'].map(cat => `
        <button onclick="cambiarCategoria('${cat}')" style="padding: 8px 14px; border-radius: 8px; border: 1px solid #cbd5e1; font-weight: bold; font-size: 0.85rem; background: ${categoriaSeleccionada === cat ? 'var(--primary)' : '#ffffff'}; color: ${categoriaSeleccionada === cat ? '#ffffff' : '#334155'}; cursor: pointer;">
          ${cat}
        </button>
      `).join('')}
    </div>

    <!-- PANEL DINÁMICO DE PRODUCTOS / PASOS PIZZA -->
    <div class="inner-card" style="padding: 12px; margin-bottom: 10px; background: #fff7ed; border: 1px solid #ffedd5;">
      ${renderContenidoCategoria()}
    </div>

    <!-- COMANDA Y ACCIONES -->
    <div class="inner-card" style="padding: 10px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
        <h4 style="margin: 0; color: #475569; font-size: 0.9rem;">Comanda Actual</h4>
        <button onclick="enviarComandaCocina()" style="background: #eab308; color: black; border: none; padding: 6px 12px; border-radius: 6px; font-weight: bold; font-size: 0.75rem; cursor: pointer;">
          🔔 Enviar Comanda
        </button>
      </div>

      <div id="pos-items-mesa" style="min-height: 80px; max-height: 180px; overflow-y: auto;">
        ${comanda.length === 0 ? '<p style="font-size:0.8rem; color:#94a3b8; text-align:center;">Mesa sin productos</p>' : ''}
        ${comanda.map((item, index) => `
          <div class="daily-row" style="padding: 6px 0; border-bottom: 1px solid #f1f5f9;">
            <div style="line-height: 1.2;">
              <strong style="font-size: 0.85rem;">${item.nombre} ${item.tamano ? `(${item.tamano})` : ''}</strong><br>
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

      <div style="display: flex; justify-content: space-between; align-items: center; font-weight: bold; font-size: 1.1rem; margin-bottom: 8px;">
        <span>Total Mesa:</span>
        <span style="color: var(--primary);">$${totalMesa.toLocaleString()}</span>
      </div>

      <button class="btn-secondary" onclick="imprimirPrecuenta()" style="width: 100%; padding: 6px; margin-bottom: 8px; font-size: 0.75rem; font-weight: bold; background: #f1f5f9;">
        📄 Imprimir Pre-Cuenta (Para la Mesa)
      </button>

      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 6px;">
        <button class="btn-primary" onclick="cobrarMesa('Efectivo')" style="background:#16a34a; margin:0; font-size:0.75rem;">💵 Cobrar Efectivo</button>
        <button class="btn-primary" onclick="cobrarMesa('Nequi')" style="background:#4f46e5; margin:0; font-size:0.75rem;">📱 Cobrar Nequi</button>
        <button class="btn-primary" onclick="cobrarMesa('Bancolombia')" style="background:#d97706; margin:0; font-size:0.75rem;">🏦 Bancolombia</button>
        <button class="btn-primary" onclick="cobrarMesa('Datáfono')" style="background:#0284c7; margin:0; font-size:0.75rem;">💳 Datáfono</button>
      </div>
    </div>
  `;
}

// FORMULARIO INTERACTIVO (PASO A PASO PIZZA VS OTROS)
function renderContenidoCategoria() {
  if (categoriaSeleccionada !== 'Pizzas') {
    const productosCat = CATALOGO_OTROS.filter(p => p.categoria === categoriaSeleccionada);
    return `
      <h4 style="margin-bottom: 8px; color: #c2410c; font-size: 0.85rem;">🍔 Categoría ${categoriaSeleccionada}</h4>
      <div style="display: flex; flex-direction: column; gap: 6px; margin-bottom: 6px;">
        ${productosCat.map(p => `
          <div class="daily-row" style="background: white; padding: 6px; border-radius: 6px; border: 1px solid #e2e8f0;">
            <span style="font-size: 0.8rem; font-weight: bold;">${p.nombre} - $${p.precio.toLocaleString()}</span>
            <button class="btn-primary" onclick="agregarOtrosMesa(${p.id})" style="width: auto; padding: 4px 8px; margin: 0; font-size: 0.7rem;">+ Añadir</button>
          </div>
        `).join('')}
      </div>
      <input type="text" id="item-obs-otros" placeholder="Observaciones..." style="width: 100%; padding: 4px; border-radius: 6px; border: 1px solid #cbd5e1; font-size: 0.75rem; box-sizing: border-box;">
    `;
  }

  // PASO 1: SELECCIONAR TIPO DE PIZZA
  if (pasoPizza === 1) {
    return `
      <h4 style="margin-bottom: 8px; color: #c2410c; font-size: 0.9rem;">🍕 Paso 1: Selecciona el Tipo de Pizza</h4>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
        <button onclick="seleccionarTipoPizza('tradicional')" style="padding: 12px; border-radius: 8px; border: 2px solid #ea580c; background: white; font-weight: bold; cursor: pointer; color: #c2410c;">
          🍕 Tradicional<br><small style="font-weight: normal; color: #64748b;">Desde $15.000</small>
        </button>
        <button onclick="seleccionarTipoPizza('premium')" style="padding: 12px; border-radius: 8px; border: 2px solid #ea580c; background: white; font-weight: bold; cursor: pointer; color: #c2410c;">
          ⭐ Premium<br><small style="font-weight: normal; color: #64748b;">Desde $35.000</small>
        </button>
      </div>
    `;
  }

  // PASO 2: SELECCIONAR TAMAÑO
  if (pasoPizza === 2) {
    const config = CONFIG_PIZZAS[pizzaEnProceso.tipo];
    return `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
        <h4 style="margin: 0; color: #c2410c; font-size: 0.85rem;">🍕 Paso 2: Tamaño (${config.nombre})</h4>
        <button class="btn-secondary" onclick="pasoPizza=1; renderPOS();" style="width: auto; padding: 2px 6px; font-size: 0.7rem;">← Cambiar Tipo</button>
      </div>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(80px, 1fr)); gap: 6px;">
        ${Object.keys(config.tamanos).map(t => `
          <button onclick="seleccionarTamanoPizza('${t}', ${config.tamanos[t]})" style="padding: 10px 4px; border-radius: 8px; border: 1px solid #cbd5e1; background: white; font-weight: bold; cursor: pointer; text-align: center; font-size: 0.8rem;">
            ${t}<br><span style="color: #2563eb;">$${config.tamanos[t].toLocaleString()}</span>
          </button>
        `).join('')}
      </div>
    `;
  }

  // PASO 3: INGREDIENTES Y OBSERVACIONES
  if (pasoPizza === 3) {
    return `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
        <h4 style="margin: 0; color: #c2410c; font-size: 0.85rem;">🍕 Paso 3: Ingredientes (${pizzaEnProceso.tamano})</h4>
        <button class="btn-secondary" onclick="pasoPizza=2; renderPOS();" style="width: auto; padding: 2px 6px; font-size: 0.7rem;">← Tamaño</button>
      </div>
      <small style="display: block; color: #64748b; font-size: 0.7rem; margin-bottom: 6px;">2 Ingredientes Gratis (Adicional +$${pizzaEnProceso.precioExtra.toLocaleString()})</small>
      
      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 4px; margin-bottom: 6px;">
        ${INGREDIENTES.map(ing => `
          <label style="font-size: 0.7rem; display: flex; align-items: center; gap: 4px; background: white; padding: 3px 6px; border-radius: 4px; border: 1px solid #e2e8f0;">
            <input type="checkbox" name="ing-check" value="${ing}"> ${ing}
          </label>
        `).join('')}
      </div>

      <input type="text" id="item-obs" placeholder="Observaciones (ej: Bien tostada)..." style="width: 100%; padding: 4px; border-radius: 6px; border: 1px solid #cbd5e1; font-size: 0.75rem; margin-bottom: 6px; box-sizing: border-box;">
      <button class="btn-primary" onclick="confirmarAgregarPizza()" style="margin: 0; padding: 6px; font-size: 0.8rem;">+ Agregar a la Comanda</button>
    `;
  }
}

// LOGICA DE NAVEGACIÓN PASO A PASO PIZZAS
function seleccionarTipoPizza(tipo) {
  const config = CONFIG_PIZZAS[tipo];
  pizzaEnProceso = { tipo: tipo, tamano: null, precioBase: 0, gratis: config.gratis, precioExtra: config.precioExtra };
  pasoPizza = 2;
  renderPOS();
}

function seleccionarTamanoPizza(tamano, precioBase) {
  pizzaEnProceso.tamano = tamano;
  pizzaEnProceso.precioBase = precioBase;
  pasoPizza = 3;
  renderPOS();
}

function confirmarAgregarPizza() {
  const config = CONFIG_PIZZAS[pizzaEnProceso.tipo];
  const obs = document.getElementById('item-obs').value.trim();
  const ingSeleccionados = Array.from(document.querySelectorAll('input[name="ing-check"]:checked')).map(el => el.value);

  const adicionalesCount = Math.max(0, ingSeleccionados.length - pizzaEnProceso.gratis);
  const costoAdicionales = adicionalesCount * pizzaEnProceso.precioExtra;

  window.db.mesasPOS[mesaActiva].push({
    categoria: 'Pizzas',
    nombre: config.nombre,
    tamano: pizzaEnProceso.tamano,
    ingredientes: ingSeleccionados,
    obs: obs,
    precioTotal: pizzaEnProceso.precioBase + costoAdicionales
  });

  // Reiniciar flujo a Paso 1 para armar otra pizza
  pasoPizza = 1;
  renderPOS();
}

// ACCIONES GENERALES
function cambiarVista(vista) { vistaActual = vista; mesaActiva = null; renderPOS(); }
function abrirMesa(nombre) { mesaActiva = nombre; pasoPizza = 1; renderPOS(); }
function cerrarMesa() { mesaActiva = null; renderPOS(); }
function cambiarCategoria(cat) { categoriaSeleccionada = cat; pasoPizza = 1; renderPOS(); }

function agregarOtrosMesa(idProd) {
  const prod = CATALOGO_OTROS.find(p => p.id === idProd);
  if (!prod) return;
  const obsInput = document.getElementById('item-obs-otros');
  window.db.mesasPOS[mesaActiva].push({
    categoria: prod.categoria, nombre: prod.nombre, obs: obsInput ? obsInput.value.trim() : '', precioTotal: prod.precio
  });
  renderPOS();
}

function eliminarItemMesa(index) {
  window.db.mesasPOS[mesaActiva].splice(index, 1);
  renderPOS();
}

// ENVIAR COMANDA Y VOLVER A VISTA MESAS PRINCIPAL
function enviarComandaCocina() {
  const comanda = window.db.mesasPOS[mesaActiva] || [];
  if (comanda.length === 0) return alert("⚠️ La comanda está vacía.");

  // Disparar evento para servidor / impresoras
  const event = new CustomEvent('alertaCentralPOS', {
    detail: { tipo: 'COMANDA_COCINA', origen: mesaActiva, items: comanda, fecha: new Date() }
  });
  window.dispatchEvent(event);

  // Imprimir comanda
  imprimirTicketGenerico(`COMANDA - ${mesaActiva}`, comanda, 0, true);

  // Volver al panel de selección de mesas
  cerrarMesa();
}

function imprimirPrecuenta() {
  const comanda = window.db.mesasPOS[mesaActiva] || [];
  if (comanda.length === 0) return alert("⚠️ No hay items para pre-cuenta.");
  const total = comanda.reduce((acc, i) => acc + i.precioTotal, 0);
  imprimirTicketGenerico(`PRE-CUENTA - ${mesaActiva}`, comanda, total);
}

function cobrarMesa(metodoPago) {
  const comanda = window.db.mesasPOS[mesaActiva] || [];
  if (comanda.length === 0) return alert("⚠️ No hay productos en la mesa.");

  const totalVenta = comanda.reduce((acc, i) => acc + i.precioTotal, 0);
  imprimirTicketGenerico(`FACTURA - ${mesaActiva}`, comanda, totalVenta);

  comanda.forEach(item => {
    const cat = item.categoria || 'Otros';
    window.db.ventasPorCategoria[cat] = (window.db.ventasPorCategoria[cat] || 0) + item.precioTotal;
  });

  registrarIngresoVenta(totalVenta, metodoPago, 'Mesa');
  window.db.mesasPOS[mesaActiva] = [];
  if (typeof guardarBD === 'function') guardarBD();
  alert(`✅ ${mesaActiva} cobrada con éxito ($${totalVenta.toLocaleString()} en ${metodoPago})`);
  cerrarMesa();
}

function registrarIngresoVenta(monto, metodoPago, origen) {
  const hoyFecha = new Date().toLocaleDateString();
  if (!window.db.movimientos) window.db.movimientos = [];
  let movHoy = window.db.movimientos.find(m => m.fechaRaw === hoyFecha);
  if (!movHoy) {
    const fechaActual = new Date();
    movHoy = {
      fecha: `${fechaActual.toLocaleDateString('es-CO', { weekday: 'long' })} (${hoyFecha})`,
      fechaRaw: hoyFecha, isoDate: fechaActual.toISOString().substring(0, 7),
      diaSemanaIndex: fechaActual.getDay(), ingresos: { Efectivo: 0, Nequi: 0, Bancolombia: 0, Datáfono: 0 }, gastos: []
    };
    window.db.movimientos.push(movHoy);
  }
  movHoy.ingresos[metodoPago] = (movHoy.ingresos[metodoPago] || 0) + monto;
}

// MOTOR DE IMPRESIÓN TICKET
function imprimirTicketGenerico(titulo, items, total, esCocina = false) {
  const ventanaImp = window.open('', '_blank', 'width=300,height=500');
  ventanaImp.document.write(`
    <html>
      <head>
        <title>${titulo}</title>
        <style>
          body { font-family: monospace; font-size: 12px; margin: 0; padding: 10px; width: 250px; }
          .center { text-align: center; }
          .bold { font-weight: bold; }
          .line { border-bottom: 1px dashed #000; margin: 6px 0; }
          .row { display: flex; justify-content: space-between; }
        </style>
      </head>
      <body>
        <div class="center bold">LOS CHAMOS</div>
        <div class="center">${titulo}</div>
        <div class="center">${new Date().toLocaleString()}</div>
        <div class="line"></div>
        ${items.map(i => `
          <div>
            <div class="bold">${i.nombre} ${i.tamano ? `(${i.tamano})` : ''}</div>
            ${i.ingredientes ? `<div style="font-size:10px;">Ing: ${i.ingredientes.join(', ')}</div>` : ''}
            ${i.obs ? `<div style="font-size:10px;">📝 ${i.obs}</div>` : ''}
            ${!esCocina ? `<div class="row"><span>Subtotal:</span><span>$${i.precioTotal.toLocaleString()}</span></div>` : ''}
          </div>
          <div class="line"></div>
        `).join('')}
        ${!esCocina ? `<div class="row bold" style="font-size: 14px;"><span>TOTAL:</span><span>$${total.toLocaleString()}</span></div>` : ''}
        <div class="center" style="margin-top: 15px;">*** GRACIAS ***</div>
      </body>
    </html>
  `);
  ventanaImp.document.close();
  ventanaImp.focus();
  ventanaImp.print();
  ventanaImp.close();
}

// DOMICILIOS
function renderVistaDomicilios(container) {
  container.innerHTML = `
    ${renderBarraModos()}
    <div class="inner-card" style="padding: 10px; margin-bottom: 12px; background: #eff6ff; border: 1px solid #bfdbfe;">
      <h4 style="margin-bottom: 8px; color: #1e40af; font-size: 0.9rem;">➕ Nuevo Domicilio</h4>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-bottom: 6px;">
        <input type="text" id="dom-cliente" placeholder="Nombre Cliente" style="padding: 6px; border-radius: 6px; border: 1px solid #cbd5e1; font-size: 0.8rem;">
        <input type="text" id="dom-direccion" placeholder="Dirección Envío" style="padding: 6px; border-radius: 6px; border: 1px solid #cbd5e1; font-size: 0.8rem;">
      </div>
      <input type="text" id="dom-pedido" placeholder="Resumen del pedido..." style="width: 100%; padding: 6px; border-radius: 6px; border: 1px solid #cbd5e1; font-size: 0.8rem; margin-bottom: 6px; box-sizing: border-box;">
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px;">
        <input type="number" id="dom-monto" placeholder="Monto a Pagar ($)" style="padding: 6px; border-radius: 6px; border: 1px solid #cbd5e1; font-size: 0.8rem;">
        <button class="btn-primary" onclick="crearDomicilio()" style="margin: 0; padding: 6px; font-size: 0.8rem;">+ Registrar Domicilio</button>
      </div>
    </div>

    <h4 style="margin-bottom: 8px; font-size: 0.9rem;">🛵 Envíos en Curso</h4>
    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px;">
      ${window.db.domiciliosPOS.length === 0 ? '<p style="font-size:0.8rem; color:#94a3b8;">No hay domicilios pendientes</p>' : ''}
      ${window.db.domiciliosPOS.map((dom, index) => `
        <div style="background: white; border: 2px solid #3b82f6; border-radius: 10px; padding: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
          <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 0.85rem; border-bottom: 1px solid #f1f5f9; padding-bottom: 4px;">
            <span>👤 ${dom.cliente}</span>
            <span style="color: #2563eb;">$${dom.monto.toLocaleString()}</span>
          </div>
          <p style="font-size: 0.75rem; color: #475569; margin: 6px 0;">📍 <strong>Dirección:</strong> ${dom.direccion}</p>
          <p style="font-size: 0.75rem; color: #334155; margin: 6px 0; background: #f8fafc; padding: 4px; border-radius: 4px;">📋 ${dom.pedido}</p>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px; margin-top: 8px;">
            <button class="btn-secondary" onclick="imprimirTicketGenerico('DOMICILIO: ${dom.cliente}', [{'nombre': dom.pedido, 'precioTotal': dom.monto}], ${dom.monto})" style="padding: 4px; font-size: 0.7rem;">🖨️ Ticket</button>
            <button class="btn-primary" onclick="cobrarDomicilio(${index}, 'Efectivo')" style="background: #16a34a; padding: 4px; font-size: 0.7rem; margin:0;">✅ Entregado</button>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function crearDomicilio() {
  const cliente = document.getElementById('dom-cliente').value.trim();
  const direccion = document.getElementById('dom-direccion').value.trim();
  const pedido = document.getElementById('dom-pedido').value.trim();
  const monto = parseFloat(document.getElementById('dom-monto').value);

  if (!cliente || !direccion || !pedido || isNaN(monto)) return alert("⚠️ Completa los campos del domicilio.");

  window.db.domiciliosPOS.push({ cliente, direccion, pedido, monto });
  renderPOS();
}

function cobrarDomicilio(index, metodoPago) {
  const dom = window.db.domiciliosPOS[index];
  registrarIngresoVenta(dom.monto, metodoPago, 'Domicilios');
  window.db.domiciliosPOS.splice(index, 1);
  if (typeof guardarBD === 'function') guardarBD();
  alert(`✅ Domicilio de ${dom.cliente} cobrado.`);
  renderPOS();
}
