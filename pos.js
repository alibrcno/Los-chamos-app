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
  productos: [
    { id: 101, nombre: 'Pan de Jamón', precio: 35000, categoria: 'Panadería' },
    { id: 102, nombre: 'Tequeños (6 und)', precio: 12000, categoria: 'Entradas' },
    { id: 103, nombre: 'Golfeado c/Queso', precio: 8000, categoria: 'Panadería' },
    { id: 104, nombre: 'Hamburguesa Especial', precio: 18000, categoria: 'Cocina' },
    { id: 105, nombre: 'Piñita', precio: 3000, categoria: 'Panadería' },
    { id: 106, nombre: 'Pan Canilla', precio: 4000, categoria: 'Panadería' }
  ]
};

function guardarEstadoPOS() {
  localStorage.setItem('chamos_pos_mesas', JSON.stringify(posState.mesas));
}

// --- SONIDO DE ALERTA AL COMANDAR ---
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

// --- RENDERIZADO DE LA INTERFAZ POS ---
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

function renderDetalleMesa(container) {
  const mesa = posState.mesas.find(m => m.id === posState.mesaSeleccionada);
  const total = mesa.pedido.reduce((acc, p) => acc + (p.precio * p.cant), 0);

  let html = `
    <button class="btn-secondary" onclick="volverAMesas()" style="margin-bottom:10px; width:auto;">← Volver a Mesas</button>
    <div class="inner-card">
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <h4>📋 Comanda: ${mesa.nombre}</h4>
        <span style="font-weight:bold; color:#ea580c; font-size:1.1rem;">$${total.toLocaleString()}</span>
      </div>
    </div>

    <!-- LISTA DE PRODUCTOS EN EL PEDIDO -->
    <div class="inner-card">
      <h5 style="margin-bottom:8px; color:#475569;">Items en Pedido:</h5>
  `;

  if (mesa.pedido.length === 0) {
    html += `<p style="font-size:0.8rem; color:#94a3b8;">No hay productos agregados.</p>`;
  } else {
    mesa.pedido.forEach((p, idx) => {
      html += `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; font-size:0.85rem;">
          <div>
            <strong>${p.nombre}</strong><br>
            <small>$${p.precio.toLocaleString()} x ${p.cant} = $${(p.precio * p.cant).toLocaleString()}</small>
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

    <!-- CATÁLOGO DE PRODUCTOS -->
    <div class="inner-card" style="margin-top:15px;">
      <h5 style="margin-bottom:8px; color:#475569;">Agregar Productos:</h5>
      <div style="display:grid; grid-template-columns: 1fr 1fr; gap:6px;">
  `;

  const listaBebidas = (window.db.bebidas || []).map(b => ({ id: `beb-${b.id}`, nombre: b.nombre, precio: b.precio }));
  const catalogoCompleto = [...posState.productos, ...listaBebidas];

  catalogoCompleto.forEach(prod => {
    html += `
      <button onclick="agregarProductoAMesa('${prod.nombre}', ${prod.precio})" class="btn-secondary" style="text-align:left; font-size:0.75rem; padding:8px; margin-top:0;">
        <strong>${prod.nombre}</strong><br>
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

function agregarProductoAMesa(nombre, precio) {
  const mesa = posState.mesas.find(m => m.id === posState.mesaSeleccionada);
  const existe = mesa.pedido.find(p => p.nombre === nombre);

  if (existe) {
    existe.cant += 1;
  } else {
    mesa.pedido.push({ nombre, precio, cant: 1 });
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
