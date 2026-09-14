// --- ESTADO Y DATOS DEL POS ---
let posState = {
  mesas: JSON.parse(localStorage.getItem('chamos_pos_mesas')) || [
    { id: 1, nombre: 'Mesa 1', estado: 'libre', pedido: [] },
    { id: 2, nombre: 'Mesa 2', estado: 'libre', pedido: [] },
    { id: 3, nombre: 'Mesa 3', estado: 'libre', pedido: [] },
    { id: 4, nombre: 'Mesa 4', estado: 'libre', pedido: [] },
    { id: 5, nombre: 'Barra', estado: 'libre', pedido: [] },
    { id: 6, nombre: 'Domicilio 1', estado: 'libre', pedido: [] }
  ],
  mesaSeleccionada: null,
  categoriaActiva: 'Todas',
  
  productos: [
    { id: 201, nombre: 'Arepa Queso', precio: 8000, categoria: 'Arepas' },
    { id: 202, nombre: 'Arepa Mixta', precio: 14000, categoria: 'Arepas' },
    { id: 203, nombre: 'Arepa Catira', precio: 12000, categoria: 'Arepas' },

    { id: 301, nombre: 'Pizza Jamón y Queso', precio: 25000, categoria: 'Pizzas', admiteAdicionales: true },
    { id: 302, nombre: 'Pizza Pepperoni', precio: 28000, categoria: 'Pizzas', admiteAdicionales: true },
    { id: 303, nombre: 'Pizza Especial Chamos', precio: 35000, categoria: 'Pizzas', admiteAdicionales: true },

    { id: 401, nombre: 'Patacón con Carne', precio: 16000, categoria: 'Patacones' },
    { id: 402, nombre: 'Patacón Mixto', precio: 20000, categoria: 'Patacones' },

    { id: 101, nombre: 'Pan de Jamón', precio: 35000, categoria: 'Panadería' },
    { id: 102, nombre: 'Tequeños (6 und)', precio: 12000, categoria: 'Panadería' },
    { id: 103, nombre: 'Golfeado c/Queso', precio: 8000, categoria: 'Panadería' }
  ],

  adicionales: [
    { nombre: 'Extra Queso', precio: 3000 },
    { nombre: 'Tocineta', precio: 4000 },
    { nombre: 'Champiñones', precio: 3500 },
    { nombre: 'Maíz', precio: 2000 },
    { nombre: 'Salsa Especial', precio: 1500 }
  ]
};

function guardarEstadoPOS() {
  localStorage.setItem('chamos_pos_mesas', JSON.stringify(posState.mesas));
}

// --- SONIDO DE ALERTA ---
function reproducirSonidoComanda() {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); 
    osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.15); 
    gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.4);
  } catch (e) {
    console.log("Audio no disponible");
  }
}

// --- RENDERIZADO PRINCIPAL ---
function renderPOS() {
  const container = document.getElementById('pos-container');
  if (!container) return;

  if (posState.mesaSeleccionada === null) {
    renderGridMesas(container);
  } else {
    renderDetalleMesa(container);
  }
}

function renderGridMesas(container) {
  let html = `
    <div style="margin-bottom: 15px;">
      <h3 style="color:#ea580c; font-size:1.1rem;">🍽️ Control de Mesas y Domicilios</h3>
      <p style="font-size:0.8rem; color:#64748b;">Selecciona una mesa para tomar comanda o cobrar.</p>
    </div>
    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;">
  `;

  posState.mesas.forEach(m => {
    const total = m.pedido.reduce((acc, p) => acc + (p.precio * p.cant), 0);
    const bg = m.estado === 'ocupada' ? '#fef2f2' : '#f0fdf4';
    const border = m.estado === 'ocupada' ? '#ef4444' : '#22c55e';
    const txtColor = m.estado === 'ocupada' ? '#dc2626' : '#16a34a';

    html += `
      <div class="inner-card" onclick="seleccionarMesa(${m.id})" style="background:${bg}; border: 2px solid ${border}; cursor:pointer; margin:0;">
        <div style="font-weight:bold; font-size:1rem; color:#1e293b;">${m.nombre}</div>
        <div style="font-size:0.75rem; color:${txtColor}; font-weight:bold; margin-top:4px;">
          ${m.estado === 'ocupada' ? '🔴 Ocupada' : '🟢 Libre'}
        </div>
        <div style="font-size:0.85rem; font-weight:bold; color:#0f172a; margin-top:8px;">
          $${total.toLocaleString()}
        </div>
      </div>
    `;
  });

  html += `</div>`;
  container.innerHTML = html;
}

function seleccionarMesa(id) {
  posState.mesaSeleccionada = id;
  renderPOS();
}

function volverAMesas() {
  posState.mesaSeleccionada = null;
  renderPOS();
}

// --- DETALLE DE LA MESA Y PEDIDO CON OBSERVACIONES ---
function renderDetalleMesa(container) {
  const mesa = posState.mesas.find(m => m.id === posState.mesaSeleccionada);
  const total = mesa.pedido.reduce((acc, p) => acc + (p.precio * p.cant), 0);
  const categorias = ['Todas', 'Arepas', 'Pizzas', 'Patacones', 'Panadería'];

  let html = `
    <button class="btn-secondary" onclick="volverAMesas()" style="margin-bottom:10px; width:auto;">← Volver a Mesas</button>
    <div class="inner-card">
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <h4>📋 Comanda: ${mesa.nombre}</h4>
        <span style="font-weight:bold; color:#ea580c; font-size:1.1rem;">$${total.toLocaleString()}</span>
      </div>
    </div>

    <!-- LISTA DE PRODUCTOS AGREGADOS -->
    <div class="inner-card">
      <h5 style="margin-bottom:8px; color:#475569;">Items en Pedido:</h5>
  `;

  if (mesa.pedido.length === 0) {
    html += `<p style="font-size:0.8rem; color:#94a3b8;">No hay productos agregados.</p>`;
  } else {
    mesa.pedido.forEach((p, idx) => {
      html += `
        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:10px; padding-bottom:6px; border-bottom: 1px dashed #e2e8f0; font-size:0.85rem;">
          <div>
            <strong>${p.nombre}</strong><br>
            ${p.nota ? `<span style="font-size:0.75rem; color:#ef4444; font-style:italic;">📝 Nota: ${p.nota}</span><br>` : ''}
            <small style="color:#64748b;">$${p.precio.toLocaleString()} x ${p.cant} = $${(p.precio * p.cant).toLocaleString()}</small>
          </div>
          <div style="display:flex; gap:4px;">
            <button onclick="cambiarCantItem(${idx}, -1)" style="padding:2px 8px;">-</button>
            <button onclick="cambiarCantItem(${idx}, 1)" style="padding:2px 8px;">+</button>
          </div>
        </div>
      `;
    });
  }

  html += `
    </div>

    <!-- ACCIONES -->
    <div style="display:flex; gap:8px; margin-top:10px;">
      <button onclick="confirmarComanda()" class="btn-primary" style="flex:1; background-color:#22c55e; margin-top:0;">🔔 Comandar</button>
      <button onclick="imprimirTicketMesa()" class="btn-secondary" style="flex:1; margin-top:0;">🖨️ Ticket</button>
    </div>

    <!-- SECTOR DE CATEGORÍAS -->
    <div class="inner-card" style="margin-top:15px;">
      <h5 style="margin-bottom:8px; color:#475569;">Categorías:</h5>
      <div style="display:flex; gap:6px; overflow-x:auto; padding-bottom:6px;">
  `;

  categorias.forEach(cat => {
    const isSelected = posState.categoriaActiva === cat;
    const bg = isSelected ? '#ea580c' : '#f1f5f9';
    const color = isSelected ? '#ffffff' : '#334155';
    html += `
      <button onclick="filtrarCategoria('${cat}')" style="background:${bg}; color:${color}; border:none; padding:6px 12px; border-radius:16px; font-size:0.75rem; font-weight:bold; white-space:nowrap; cursor:pointer;">
        ${cat}
      </button>
    `;
  });

  html += `
      </div>

      <!-- PRODUCTOS FILTRADOS -->
      <div style="display:grid; grid-template-columns: 1fr 1fr; gap:6px; margin-top:10px;">
  `;

  const filtrados = posState.categoriaActiva === 'Todas' 
    ? posState.productos 
    : posState.productos.filter(p => p.categoria === posState.categoriaActiva);

  filtrados.forEach(prod => {
    html += `
      <button onclick="solicitarDetalleProducto(${prod.id})" class="btn-secondary" style="text-align:left; font-size:0.75rem; padding:8px; margin-top:0;">
        <strong>${prod.nombre} ${prod.admiteAdicionales ? '➕' : ''}</strong><br>
        <span style="color:#ea580c;">$${prod.precio.toLocaleString()}</span>
      </button>
    `;
  });

  html += `
      </div>
    </div>
  `;

  container.innerHTML = html;
}

function filtrarCategoria(cat) {
  posState.categoriaActiva = cat;
  renderPOS();
}

// --- MODAL PARA OBSERVACIONES Y ADICIONALES ---
function solicitarDetalleProducto(prodId) {
  const prod = posState.productos.find(p => p.id === prodId);
  if (!prod) return;

  let adicionalesHTML = '';
  if (prod.admiteAdicionales) {
    adicionalesHTML = `
      <p style="font-size:0.75rem; font-weight:bold; color:#475569; margin-top:10px; margin-bottom:6px;">Adicionales:</p>
      ${posState.adicionales.map((adic, idx) => `
        <label style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px; font-size:0.8rem; cursor:pointer;">
          <input type="checkbox" id="adic-${idx}" value="${adic.precio}" data-nombre="${adic.nombre}">
          <span>${adic.nombre}</span>
          <strong style="color:#ea580c;">+$${adic.precio.toLocaleString()}</strong>
        </label>
      `).join('')}
    `;
  }

  const modal = document.createElement('div');
  modal.id = 'pos-modal-opciones';
  modal.style = "position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(0,0,0,0.5); display:flex; align-items:center; justify-content:center; z-index:9999;";
  modal.innerHTML = `
    <div style="background:white; padding:20px; border-radius:12px; width:85%; max-width:320px;">
      <h4 style="margin-bottom:4px; color:#0f172a;">${prod.nombre}</h4>
      
      ${adicionalesHTML}

      <p style="font-size:0.75rem; font-weight:bold; color:#475569; margin-top:10px; margin-bottom:4px;">Observación / Nota Especial:</p>
      <input type="text" id="input-nota-producto" placeholder="Ej: Sin cebolla, Salsa aparte..." style="width:100%; padding:8px; border:1px solid #cbd5e1; border-radius:6px; font-size:0.8rem; margin-bottom:12px;">

      <div style="display:flex; gap:8px;">
        <button onclick="cerrarModalOpciones()" class="btn-secondary" style="margin-top:0;">Cancelar</button>
        <button onclick="confirmarAgregarProducto(${prod.id})" class="btn-primary" style="margin-top:0;">Agregar al Pedido</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
}

function cerrarModalOpciones() {
  const modal = document.getElementById('pos-modal-opciones');
  if (modal) modal.remove();
}

function confirmarAgregarProducto(prodId) {
  const prod = posState.productos.find(p => p.id === prodId);
  let nombreFinal = prod.nombre;
  let precioFinal = prod.precio;

  // Procesar Adicionales si aplican
  if (prod.admiteAdicionales) {
    let extras = [];
    posState.adicionales.forEach((adic, idx) => {
      const chk = document.getElementById(`adic-${idx}`);
      if (chk && chk.checked) {
        precioFinal += adic.precio;
        extras.push(adic.nombre);
      }
    });

    if (extras.length > 0) {
      nombreFinal += ` (+${extras.join(', ')})`;
    }
  }

  // Capturar Observación
  const notaInput = document.getElementById('input-nota-producto');
  const nota = notaInput ? notaInput.value.trim() : '';

  agregarProductoAMesa(nombreFinal, precioFinal, nota);
  cerrarModalOpciones();
}

// --- AGREGAR Y MANEJAR PEDIDOS ---
function agregarProductoAMesa(nombre, precio, nota = '') {
  const mesa = posState.mesas.find(m => m.id === posState.mesaSeleccionada);
  
  // Buscar si existe el mismo producto CON LA MISMA NOTA
  const existe = mesa.pedido.find(p => p.nombre === nombre && p.nota === nota);

  if (existe) {
    existe.cant += 1;
  } else {
    mesa.pedido.push({ nombre, precio, cant: 1, nota });
  }

  mesa.estado = 'ocupada';
  guardarEstadoPOS();
  renderPOS();
}

function cambiarCantItem(index, delta) {
  const mesa = posState.mesas.find(m => m.id === posState.mesaSeleccionada);
  mesa.pedido[index].cant += delta;

  if (mesa.pedido[index].cant <= 0) {
    mesa.pedido.splice(index, 1);
  }

  if (mesa.pedido.length === 0) {
    mesa.estado = 'libre';
  }

  guardarEstadoPOS();
  renderPOS();
}

function confirmarComanda() {
  reproducirSonidoComanda();
  alert("🔔 ¡Comanda enviada a cocina!");
}

// --- IMPRESIÓN CON NOTAS DE COCINA ---
function imprimirTicketMesa() {
  const mesa = posState.mesas.find(m => m.id === posState.mesaSeleccionada);
  if (!mesa || mesa.pedido.length === 0) {
    alert("⚠️ La mesa no tiene consumo para imprimir.");
    return;
  }

  const total = mesa.pedido.reduce((acc, p) => acc + (p.precio * p.cant), 0);
  
  const ventanaImpresion = window.open('', '', 'width=300,height=400');
  ventanaImpresion.document.write(`
    <html>
      <head>
        <title>Ticket - ${mesa.nombre}</title>
        <style>
          body { font-family: monospace; font-size: 12px; padding: 10px; margin: 0; }
          .center { text-align: center; }
          .row { display: flex; justify-content: space-between; margin: 4px 0; }
          .nota { font-size: 10px; color: #000; font-weight: bold; margin-bottom: 4px; padding-left: 8px; }
          hr { border-top: 1px dashed #000; }
        </style>
      </head>
      <body>
        <div class="center">
          <strong>LOS CHAMOS</strong><br>
          ${mesa.nombre}<br>
          ${new Date().toLocaleString()}<br>
        </div>
        <hr>
        ${mesa.pedido.map(p => `
          <div class="row">
            <span>${p.cant}x ${p.nombre}</span>
            <span>$${(p.precio * p.cant).toLocaleString()}</span>
          </div>
          ${p.nota ? `<div class="nota">** NOTA: ${p.nota} **</div>` : ''}
        `).join('')}
        <hr>
        <div class="row" style="font-weight:bold; font-size:14px;">
          <span>TOTAL:</span>
          <span>$${total.toLocaleString()}</span>
        </div>
        <br><br>
        <div class="center">¡Gracias por su compra!</div>
      </body>
    </html>
  `);

  ventanaImpresion.document.close();
  ventanaImpresion.focus();
  ventanaImpresion.print();
  ventanaImpresion.close();
}
