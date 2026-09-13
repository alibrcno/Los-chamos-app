// BASE DE DATOS LOCAL
let usuarios = [
  { user: "admin", pin: "1234", rol: "admin", nombre: "Administradora" },
  { user: "encargada", pin: "1111", rol: "encargada", nombre: "Encargada" },
  { user: "cocina", pin: "2222", rol: "cocina", nombre: "Cocinero" }
];

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
let ultimoCierreBebidas = { 1: 12, 2: 8, 3: 15 };
let turnoAbierto = false;
let usuarioActual = null;

// AUTENTICACIÓN Y LOGIN
function iniciarSesion(e) {
  e.preventDefault();
  const u = document.getElementById('login-usuario').value.trim();
  const p = document.getElementById('login-pin').value.trim();

  const encontrado = usuarios.find(usr => usr.user.toLowerCase() === u.toLowerCase() && usr.pin === p);

  if (encontrado) {
    usuarioActual = encontrado;
    document.getElementById('login-error').classList.add('hidden');
    document.getElementById('form-login').reset();
    document.getElementById('sec-login').classList.add('hidden');
    document.getElementById('btn-logout').classList.remove('hidden');

    if (encontrado.rol === 'encargada') {
      document.getElementById('sec-encargada').classList.remove('hidden');
      if (!turnoAbierto) {
        cambiarTabEncargada('apertura');
      } else {
        cambiarTabEncargada('gastos');
      }
      renderBebidasApertura();
    } else if (encontrado.rol === 'cocina') {
      document.getElementById('sec-cocina').classList.remove('hidden');
      renderCocina();
    } else if (encontrado.rol === 'admin') {
      document.getElementById('sec-admin').classList.remove('hidden');
      renderAdmin();
    }
  } else {
    document.getElementById('login-error').classList.remove('hidden');
  }
}

function cerrarSesion() {
  usuarioActual = null;
  document.querySelectorAll('section').forEach(s => s.classList.add('hidden'));
  document.getElementById('btn-logout').classList.add('hidden');
  document.getElementById('sec-login').classList.remove('hidden');
}

// CONTROL PESTAÑAS ENCARGADA
function cambiarTabEncargada(tabName) {
  if (tabName === 'apertura' && turnoAbierto) {
    alert("⚠️ La apertura de turno ya fue confirmada. Para modificar inventario contacta a la administradora.");
    return;
  }

  document.querySelectorAll('.tab-content').forEach(tab => tab.classList.add('hidden'));
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));

  document.getElementById(`tab-${tabName}`).classList.remove('hidden');
  document.getElementById(`tab-btn-${tabName}`).classList.add('active');

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
    b.stock = cantIngresada;
    if (cantIngresada !== esperado) {
      discrepancias.push(`${b.nombre}: inició con ${cantIngresada} (Se esperaban ${esperado})`);
    }
  });

  turnoAbierto = true;
  document.getElementById('tab-btn-apertura').style.opacity = '0.5';

  const alertDiv = document.getElementById('alerta-discrepancia');
  if (discrepancias.length > 0) {
    alertDiv.innerHTML = `<strong>⚠️ Alerta de Discrepancia Registrada:</strong><br>${discrepancias.join('<br>')}`;
  } else {
    alertDiv.innerHTML = "✅ Apertura confirmada sin novedades.";
  }
  alertDiv.classList.remove('hidden');

  setTimeout(() => {
    cambiarTabEncargada('gastos');
  }, 1200);
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
  alert(`Gasto de $${valor.toLocaleString('es-CO')} registrado.`);
  document.getElementById('form-gasto').reset();
  toggleBebidasCompra();
}

// LÓGICA ENCARGADA - CIERRE
function renderBebidasCierre() {
  const cont = document.getElementById('lista-bebidas-cierre');
  cont.innerHTML = bebidas.map(b => `
    <div style="margin-bottom: 10px;">
      <label>${b.nombre} (Stock en sistema: ${b.stock})</label>
      <input type="number" id="cierre-bebida-${b.id}" placeholder="Cantidad final física">
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
    ultimoCierreBebidas[b.id] = finalCant;
    b.stock = finalCant;
  });

  let ef = parseInt(document.getElementById('cierre-efectivo').value) || 0;
  let nq = parseInt(document.getElementById('cierre-nequi').value) || 0;
  let bc = parseInt(document.getElementById('cierre-bancolombia').value) || 0;

  saldos.efectivo += ef;
  saldos.nequi += nq;
  saldos.bancolombia += bc;

  turnoAbierto = false; // Se reabre la apertura para el próximo turno
  document.getElementById('tab-btn-apertura').style.opacity = '1';

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
      listaCompras.push(`• ${c.nombre}: comprar ${c.minimo - cantActual}`);
    }
  });

  const rep = document.getElementById('reporte-compras');
  if (listaCompras.length > 0) {
    rep.innerHTML = `<h4>📋 Lista de Compras Recomendada:</h4>${listaCompras.join('<br>')}`;
  } else {
    rep.innerHTML = "✅ Todos los insumos están completos.";
  }
  rep.classList.remove('hidden');
}

// LÓGICA ADMINISTRADORA
function renderAdmin() {
  document.getElementById('saldo-efectivo').innerText = `$${saldos.efectivo.toLocaleString('es-CO')}`;
  document.getElementById('saldo-nequi').innerText = `$${saldos.nequi.toLocaleString('es-CO')}`;
  document.getElementById('saldo-bancolombia').innerText = `$${saldos.bancolombia.toLocaleString('es-CO')}`;

  // Render Inventario de Bebidas para Admin
  const contBebidas = document.getElementById('admin-gestion-bebidas');
  contBebidas.innerHTML = bebidas.map(b => `
    <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 8px; background: #1e293b; padding: 8px; border-radius: 6px;">
      <span style="flex: 1;">${b.nombre}</span>
      <input type="number" value="${b.precio}" style="width: 80px;" onchange="actualizarPrecioBebida(${b.id}, this.value)" title="Precio Venta">
      <input type="number" value="${b.stock}" style="width: 60px;" onchange="actualizarStockBebida(${b.id}, this.value)" title="Stock Actual">
      <button onclick="eliminarBebida(${b.id})" style="background: #ef4444; color: white; border: none; border-radius: 4px; padding: 4px 8px; cursor: pointer;">🗑️</button>
    </div>
  `).join('');

  // Render Usuarios para Admin
  const contUsers = document.getElementById('admin-lista-usuarios');
  contUsers.innerHTML = usuarios.map((u, i) => `
    <div style="display: flex; justify-content: space-between; align-items: center; background: #1e293b; padding: 8px; border-radius: 6px; margin-bottom: 6px;">
      <div>
        <strong>${u.user}</strong> <small style="color: #94a3b8;">(${u.rol})</small>
      </div>
      <div>
        <small style="color: #38bdf8; margin-right: 10px;">PIN: ${u.pin}</small>
        ${u.user !== 'admin' ? `<button onclick="eliminarUsuario(${i})" style="background: #ef4444; color: white; border: none; border-radius: 4px; padding: 2px 6px;">🗑️</button>` : ''}
      </div>
    </div>
  `).join('');

  // Gráfico
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

// FUNCIONES GESTIÓN BEBIDAS ADMIN
function actualizarPrecioBebida(id, nuevoPrecio) {
  let b = bebidas.find(x => x.id === id);
  if (b) b.precio = parseInt(nuevoPrecio) || 0;
}

function actualizarStockBebida(id, nuevoStock) {
  let b = bebidas.find(x => x.id === id);
  if (b) b.stock = parseInt(nuevoStock) || 0;
}

function eliminarBebida(id) {
  bebidas = bebidas.filter(x => x.id !== id);
  renderAdmin();
}

function agregarNuevaBebida(e) {
  e.preventDefault();
  const nombre = document.getElementById('nueva-bebida-nombre').value;
  const precio = parseInt(document.getElementById('nueva-bebida-precio').value) || 0;
  const stock = parseInt(document.getElementById('nueva-bebida-stock').value) || 0;

  const nuevoId = bebidas.length > 0 ? Math.max(...bebidas.map(b => b.id)) + 1 : 1;
  bebidas.push({ id: nuevoId, nombre, precio, stock });
  document.getElementById('form-add-bebida').reset();
  renderAdmin();
}

// FUNCIONES GESTIÓN USUARIOS ADMIN
function agregarNuevoUsuario(e) {
  e.preventDefault();
  const user = document.getElementById('nuevo-user-nombre').value.trim();
  const pin = document.getElementById('nuevo-user-pin').value.trim();
  const rol = document.getElementById('nuevo-user-rol').value;

  if (usuarios.some(u => u.user.toLowerCase() === user.toLowerCase())) {
    alert("⚠️ Este nombre de usuario ya existe.");
    return;
  }

  usuarios.push({ user, pin, rol, nombre: user });
  document.getElementById('form-add-usuario').reset();
  renderAdmin();
  alert(`Usuario '${user}' creado con éxito para el rol '${rol}'.`);
}

function eliminarUsuario(index) {
  usuarios.splice(index, 1);
  renderAdmin();
}
