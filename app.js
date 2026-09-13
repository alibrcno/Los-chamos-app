// Base de datos inicial en memoria local
let bebidas = [
  { id: 1, nombre: "Coca-Cola 400ml", stock: 12, precio: 4000 },
  { id: 2, nombre: "Malta Pony", stock: 8, precio: 3500 },
  { id: 3, nombre: "Agua Mineral", stock: 15, precio: 2500 }
];

let cocina = [
  { id: 1, nombre: "Harina de Trigo (Kg)", stock: 5, minimo: 10 },
  { id: 2, nombre: "Queso Costeño (Kg)", stock: 3, minimo: 5 },
  { id: 3, nombre: "Carne para Hamburguesa (Unidades)", stock: 20, minimo: 30 }
];

let saldos = { efectivo: 100000, nequi: 50000, bancolombia: 80000 };
let historial = [];
let ultimoCierreBebidas = { 1: 12, 2: 8, 3: 15 };

function seleccionarRol(rol) {
  document.getElementById('sec-login').classList.add('hidden');
  if (rol === 'encargada') {
    document.getElementById('sec-encargada').classList.remove('hidden');
    cambiarTabEncargada('apertura');
    renderBebidasApertura();
  } else if (rol === 'cocina') {
    document.getElementById('sec-cocina').classList.remove('hidden');
    renderCocina();
  } else if (rol === 'admin') {
    document.getElementById('sec-admin').classList.remove('hidden');
    renderAdmin();
  }
}

function volverInicio() {
  document.querySelectorAll('section').forEach(s => s.classList.add('hidden'));
  document.getElementById('sec-login').classList.remove('hidden');
}

// CAMBIO DE PESTAÑAS
function cambiarTabEncargada(tabName) {
  document.querySelectorAll('.tab-content').forEach(tab => tab.classList.add('hidden'));
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));

  document.getElementById(`tab-${tabName}`).classList.remove('hidden');
  
  // Resaltar botón activo
  const indexMap = { 'apertura': 0, 'gastos': 1, 'cierre': 2 };
  const buttons = document.querySelectorAll('.tab-btn');
  if(buttons[indexMap[tabName]]) {
    buttons[indexMap[tabName]].classList.add('active');
  }

  if (tabName === 'gastos') renderSelectBebidasCompra();
  if (tabName === 'cierre') renderBebidasCierre();
}

// LÓGICA ENCARGADA - APERTURA
function renderBebidasApertura() {
  const cont = document.getElementById('lista-bebidas-inicio');
  cont.innerHTML = bebidas.map(b => `
    <div style="margin-bottom: 10px;">
      <label>${b.nombre} (Esperado: ${ultimoCierreBebidas[b.id] || 0})</label>
      <input type="number" id="init-bebida-${b.id}" value="${ultimoCierreBebidas[b.id] || 0}">
    </div>
  `).join('');
}

function guardarApertura() {
  let discrepancias = [];
  bebidas.forEach(b => {
    let cantIngresada = parseInt(document.getElementById(`init-bebida-${b.id}`).value) || 0;
    let esperado = ultimoCierreBebidas[b.id] || 0;
    b.stock = cantIngresada; // Actualiza el stock
    if (cantIngresada !== esperado) {
      discrepancias.push(`${b.nombre}: inició con ${cantIngresada} (Se esperaban ${esperado})`);
    }
  });

  const alertDiv = document.getElementById('alerta-discrepancia');
  if (discrepancias.length > 0) {
    alertDiv.innerHTML = `<strong>⚠️ Alerta de Discrepancia:</strong><br>${discrepancias.join('<br>')}`;
    alertDiv.classList.remove('hidden');
  } else {
    alertDiv.innerHTML = "✅ Apertura iniciada sin novedades.";
    alertDiv.classList.remove('hidden');
  }
}

// LÓGICA ENCARGADA - GASTOS
function toggleBebidasCompra() {
  const check = document.getElementById('gasto-es-bebida').checked;
  const fields = document.getElementById('compra-bebida-fields');
  if (check) fields.classList.remove('hidden');
  else fields.classList.add('hidden');
}

function renderSelectBebidasCompra() {
  const sel = document.getElementById('select-bebida-compra');
  sel.innerHTML = bebidas.map(b => `<option value="${b.id}">${b.nombre}</option>`).join('');
}

function registrarGasto(e) {
  e.preventDefault();
  const concepto = document.getElementById('gasto-concepto').value;
  const valor = parseInt(document.getElementById('gasto-valor').value) || 0;
  const esBebida = document.getElementById('gasto-es-bebida').checked;

  if (esBebida) {
    const bebidaId = parseInt(document.getElementById('select-bebida-compra').value);
    const cant = parseInt(document.getElementById('cant-bebida-compra').value) || 0;
    let b = bebidas.find(item => item.id === bebidaId);
    if (b) b.stock += cant;
  }

  saldos.efectivo -= valor;
  alert(`Gasto de $${valor.toLocaleString('es-CO')} registrado con éxito.`);
  document.getElementById('form-gasto').reset();
  toggleBebidasCompra();
}

// LÓGICA ENCARGADA - CIERRE
function renderBebidasCierre() {
  const cont = document.getElementById('lista-bebidas-cierre');
  cont.innerHTML = bebidas.map(b => `
    <div style="margin-bottom: 10px;">
      <label>${b.nombre} (Stock actual: ${b.stock})</label>
      <input type="number" id="cierre-bebida-${b.id}" placeholder="Cantidad final">
    </div>
  `).join('');
}

function generarReporteCierre() {
  let totalBebidasVendidasCOP = 0;
  let desgloseText = "";

  bebidas.forEach(b => {
    let finalCant = parseInt(document.getElementById(`cierre-bebida-${b.id}`).value) || 0;
    let inicialCant = b.stock;
    let vendidas = inicialCant - finalCant;
    if (vendidas < 0) vendidas = 0;
    let subtotal = vendidas * b.precio;
    totalBebidasVendidasCOP += subtotal;
    desgloseText += `• ${b.nombre}: ${vendidas} vendidas ($${subtotal.toLocaleString('es-CO')})\n`;
    ultimoCierreBebidas[b.id] = finalCant; // Guarda cierre para la próxima apertura
  });

  let ef = parseInt(document.getElementById('cierre-efectivo').value) || 0;
  let nq = parseInt(document.getElementById('cierre-nequi').value) || 0;
  let bc = parseInt(document.getElementById('cierre-bancolombia').value) || 0;

  saldos.efectivo += ef;
  saldos.nequi += nq;
  saldos.bancolombia += bc;

  const resumen = document.getElementById('resumen-cierre');
  resumen.innerHTML = `
    <h4>Reporte de Cierre de Turno</h4>
    <p><strong>Ventas Estimadas en Bebidas:</strong> $${totalBebidasVendidasCOP.toLocaleString('es-CO')}</p>
    <pre style="white-space: pre-wrap;">${desgloseText}</pre>
    <p><strong>Recaudo Total Ingresado:</strong> $${(ef+nq+bc).toLocaleString('es-CO')}</p>
  `;
  resumen.classList.remove('hidden');
}

// LÓGICA COCINA
function renderCocina() {
  const cont = document.getElementById('lista-cocina');
  cont.innerHTML = cocina.map(c => `
    <div style="margin-bottom: 10px;">
      <label>${c.nombre} (Sugerido mín: ${c.minimo})</label>
      <input type="number" id="cocina-item-${c.id}" value="${c.stock}">
    </div>
  `).join('');
}

function generarListaCompras() {
  let listaCompras = [];
  cocina.forEach(c => {
    let cantActual = parseInt(document.getElementById(`cocina-item-${c.id}`).value) || 0;
    if (cantActual < c.minimo) {
      listaCompras.push(`• ${c.nombre}: comprar ${c.minimo - cantActual} unidades`);
    }
  });

  const rep = document.getElementById('reporte-compras');
  if (listaCompras.length > 0) {
    rep.innerHTML = `<h4>📋 Lista de Compras para Mañana:</h4>${listaCompras.join('<br>')}`;
  } else {
    rep.innerHTML = "✅ Todos los insumos están por encima del mínimo.";
  }
  rep.classList.remove('hidden');
}

// LÓGICA ADMINISTRADORA
function renderAdmin() {
  document.getElementById('saldo-efectivo').innerText = `$${saldos.efectivo.toLocaleString('es-CO')}`;
  document.getElementById('saldo-nequi').innerText = `$${saldos.nequi.toLocaleString('es-CO')}`;
  document.getElementById('saldo-bancolombia').innerText = `$${saldos.bancolombia.toLocaleString('es-CO')}`;

  const canvas = document.getElementById('chartFinanzas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
        datasets: [
          { label: 'Ingresos ($)', data: [150000, 200000, 180000, 220000, 350000, 500000, 400000], backgroundColor: '#22c55e' },
          { label: 'Gastos ($)', data: [50000, 40000, 60000, 30000, 100000, 120000, 90000], backgroundColor: '#ef4444' }
        ]
      }
    });
  }
}
