// --- MÓDULO POS / MESAS Y DOMICILIOS (BETA) ---
const posData = {
  mesas: [
    { id: 1, nombre: 'Mesa 1', estado: 'libre', orden: [], hora: null },
    { id: 2, nombre: 'Mesa 2', estado: 'libre', orden: [], hora: null },
    { id: 3, nombre: 'Mesa 3', estado: 'libre', orden: [], hora: null },
    { id: 4, nombre: 'Mesa 4', estado: 'libre', orden: [], hora: null },
    { id: 5, nombre: 'Barra 1', estado: 'libre', orden: [], hora: null },
    { id: 6, nombre: 'Barra 2', estado: 'libre', orden: [], hora: null }
  ],
  domicilios: [],
  productos: [
    { id: 1, nombre: 'Pizza Jamón y Queso', categoria: 'Pizzas', precio: 25000 },
    { id: 2, nombre: 'Arepa Cabimera', categoria: 'Arepas', precio: 18000 },
    { id: 3, nombre: 'Hamburguesa Mixta', categoria: 'Hamburguesas', precio: 22000 },
    { id: 4, nombre: 'Gaseosa 1.5L', categoria: 'Bebidas', precio: 7000 }
  ]
};

function renderPOS() {
  const container = document.getElementById('pos-container');
  if (!container) return;

  let html = `
    <div style="padding: 15px; font-family: sans-serif; max-width: 800px; margin: 0 auto;">
      <h2 style="text-align: center; color: #d97706;">POS / Mesas & Domicilios (Beta)</h2>
      
      <div style="display: flex; gap: 10px; margin-bottom: 20px; justify-content: center;">
        <button onclick="mostrarVistaPOS('mesas')" style="padding: 10px 20px; font-weight: bold; background: #ea580c; color: white; border: none; border-radius: 8px; cursor: pointer;">📋 Salón / Mesas</button>
        <button onclick="mostrarVistaPOS('domicilios')" style="padding: 10px 20px; font-weight: bold; background: #0284c7; color: white; border: none; border-radius: 8px; cursor: pointer;">🛵 Domicilios Rápido</button>
      </div>

      <div id="pos-contenido"></div>
    </div>
  `;
  container.innerHTML = html;
  mostrarVistaPOS('mesas');
}

function mostrarVistaPOS(vista) {
  const div = document.getElementById('pos-contenido');
  if (vista === 'mesas') {
    let mesasHtml = `<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 15px;">`;
    posData.mesas.forEach(m => {
      const color = m.estado === 'libre' ? '#dcfce7' : m.estado === 'ocupada' ? '#fee2e2' : '#fef9c3';
      const border = m.estado === 'libre' ? '#16a34a' : m.estado === 'ocupada' ? '#dc2626' : '#ca8a04';
      const total = m.orden.reduce((acc, i) => acc + (i.precio * i.cantidad), 0);

      mesasHtml += `
        <div onclick="abrirMesaPOS(${m.id})" style="background: ${color}; border: 2px solid ${border}; border-radius: 12px; padding: 15px; cursor: pointer; text-align: center;">
          <h3 style="margin: 0;">${m.nombre}</h3>
          <p style="font-size: 11px; text-transform: uppercase; font-weight: bold; margin: 5px 0;">${m.estado}</p>
          <p style="font-size: 18px; font-weight: bold; margin: 5px 0;">$${total.toLocaleString()}</p>
          ${m.hora ? `<small>⏰ ${m.hora}</small>` : ''}
        </div>
      `;
    });
    mesasHtml += `</div>`;
    div.innerHTML = mesasHtml;
  } else {
    div.innerHTML = `
      <div style="background: white; padding: 15px; border-radius: 8px; border: 1px solid #ccc;">
        <h3>Registrar Domicilio Rápido</h3>
        <input id="dom-cliente" placeholder="Nombre cliente" style="width: 100%; padding: 8px; margin-bottom: 8px; box-sizing: border-box;">
        <input id="dom-tel" placeholder="Teléfono" style="width: 100%; padding: 8px; margin-bottom: 8px; box-sizing: border-box;">
        <input id="dom-dir" placeholder="Dirección de entrega" style="width: 100%; padding: 8px; margin-bottom: 8px; box-sizing: border-box;">
        <button onclick="guardarDomicilioPOS()" style="width: 100%; padding: 10px; background: #16a34a; color: white; font-weight: bold; border: none; border-radius: 6px; cursor: pointer;">Guardar Domicilio</button>
      </div>
    `;
  }
}

function abrirMesaPOS(id) {
  alert('Mesa ' + id + ' seleccionada. ¡Lista para cargar comandas!');
}

function guardarDomicilioPOS() {
  const cli = document.getElementById('dom-cliente').value;
  if (!cli) return alert('Escribe el nombre del cliente');
  alert('Domicilio guardado para ' + cli);
  document.getElementById('dom-cliente').value = '';
}
