// --- BASE DE DATOS LOCAL ---
window.db = {
  usuarios: JSON.parse(localStorage.getItem('chamos_usuarios')) || [
    { usuario: 'Admin', pin: '1234', rol: 'admin' },
    { usuario: 'Encargada', pin: '2222', rol: 'encargada' }
  ],
  bebidas: JSON.parse(localStorage.getItem('chamos_bebidas')) || [
    { id: 1, nombre: 'Cerveza Aguilas', precio: 4000, stock: 24, sugerido: 48 }
  ],
  insumosDesechables: JSON.parse(localStorage.getItem('chamos_insumos_desechables')) || [],
  almacen: JSON.parse(localStorage.getItem('chamos_almacen')) || [
    { id: 1, nombre: 'Bulto Harina 25kg', unidad: 'Bulto', stock: 4 }
  ],
  movimientos: JSON.parse(localStorage.getItem('chamos_movimientos')) || [],
  tareasCocina: JSON.parse(localStorage.getItem('chamos_tareas')) || [],
  usuarioActual: null
};

function guardarBD() {
  localStorage.setItem('chamos_usuarios', JSON.stringify(window.db.usuarios));
  localStorage.setItem('chamos_bebidas', JSON.stringify(window.db.bebidas));
  localStorage.setItem('chamos_insumos_desechables', JSON.stringify(window.db.insumosDesechables));
  localStorage.setItem('chamos_almacen', JSON.stringify(window.db.almacen));
  localStorage.setItem('chamos_movimientos', JSON.stringify(window.db.movimientos));
  localStorage.setItem('chamos_tareas', JSON.stringify(window.db.tareasCocina));
}

// AUTENTICACIÓN
function validarAccesoPin() {
  const pinInput = document.getElementById('input-pin-user').value.trim();
  const user = window.db.usuarios.find(u => u.pin === pinInput);

  if (user) {
    window.db.usuarioActual = user;
    document.getElementById('login-error').style.display = 'none';
    document.getElementById('vista-login').classList.add('hidden');
    document.getElementById('app-content').classList.remove('hidden');

    document.getElementById('user-role-badge').innerText = user.usuario;

    const esAdmin = user.rol === 'admin';
    document.querySelectorAll('.modulo-solo-admin').forEach(el => {
      el.style.display = esAdmin ? '' : 'none';
    });

    document.getElementById('kpi-panel-admin').style.display = esAdmin ? 'block' : 'none';
    cargarAdminHub();
    document.getElementById('input-pin-user').value = '';
  } else {
    document.getElementById('login-error').style.display = 'block';
  }
}

function cerrarSesion() {
  window.db.usuarioActual = null;
  document.getElementById('app-content').classList.add('hidden');
  document.getElementById('vista-login').classList.remove('hidden');
  volverAlHub();
}

// CONTROL DE RUTAS
function cargarAdminHub() {
  let saldos = { Bancolombia: 0, Nequi: 0, Efectivo: 0, Datáfono: 0 };

  window.db.movimientos.forEach(m => {
    if (m.ingresos) {
      saldos.Bancolombia += m.ingresos.Bancolombia || 0;
      saldos.Nequi += m.ingresos.Nequi || 0;
      saldos.Efectivo += m.ingresos.Efectivo || 0;
      saldos.Datáfono += m.ingresos.Datáfono || 0;
    }
    if (m.gastos) {
      m.gastos.forEach(g => {
        if (saldos[g.cuenta] !== undefined) saldos[g.cuenta] -= g.valor;
      });
    }
  });

  document.getElementById('saldo-bancolombia').innerText = `$${saldos.Bancolombia.toLocaleString()}`;
  document.getElementById('saldo-nequi').innerText = `$${saldos.Nequi.toLocaleString()}`;
  document.getElementById('saldo-efectivo').innerText = `$${saldos.Efectivo.toLocaleString()}`;
  document.getElementById('saldo-datafono').innerText = `$${saldos.Datáfono.toLocaleString()}`;
}

function ocultarSubmodulos() {
  const ids = ['pos-container', 'almacen-container', 'finanzas-container', 'metricas-container', 'bebidas-container', 'insumos-container', 'checklist-container', 'usuarios-container'];
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.add('hidden');
  });
}

function verSubModuloAdmin(modulo) {
  document.getElementById('vista-hub').classList.add('hidden');
  document.getElementById('vista-submodulo').classList.remove('hidden');
  ocultarSubmodulos();

  document.querySelectorAll('.nav-item').forEach(btn => btn.classList.remove('active'));

  if (modulo === 'pos') {
    document.getElementById('pos-container').classList.remove('hidden');
    document.getElementById('nav-item-pos').classList.add('active');
    if (typeof renderPOS === 'function') renderPOS();
  } else if (modulo === 'almacen') {
    document.getElementById('almacen-container').classList.remove('hidden');
    document.getElementById('nav-item-almacen').classList.add('active');
    renderAlmacenAdmin();
  } else if (modulo === 'finanzas') {
    document.getElementById('finanzas-container').classList.remove('hidden');
    document.getElementById('nav-item-finanzas').classList.add('active');
    renderFinanzasAdmin();
  } else if (modulo === 'metricas') {
    document.getElementById('metricas-container').classList.remove('hidden');
    document.getElementById('nav-item-metricas').classList.add('active');
    renderDesempenoAdmin();
  } else if (modulo === 'usuarios') {
    document.getElementById('usuarios-container').classList.remove('hidden');
    renderListaUsuariosAdmin();
  }
}

function volverAlHub() {
  document.getElementById('vista-submodulo').classList.add('hidden');
  document.getElementById('vista-hub').classList.remove('hidden');
  ocultarSubmodulos();
  document.querySelectorAll('.nav-item').forEach(btn => btn.classList.remove('active'));
  document.getElementById('nav-item-hub').classList.add('active');
  cargarAdminHub();
}

// LOGICA DE SUBMODULOS ADMIN
function renderAlmacenAdmin() {
  const select = document.getElementById('almacen-item-select');
  if (select) {
    select.innerHTML = window.db.almacen.map(i => `<option value="${i.id}">${i.nombre} (${i.stock} ${i.unidad})</option>`).join('');
  }
  const cont = document.getElementById('admin-lista-almacen');
  if (cont) {
    cont.innerHTML = window.db.almacen.map(i => `
      <div class="inner-card" style="display:flex; justify-content:space-between; align-items:center;">
        <div><strong>${i.nombre}</strong><br><small style="color:#94a3b8;">Stock: ${i.stock} ${i.unidad}</small></div>
      </div>
    `).join('');
  }
}

function registrarMovimientoAlmacen(e) {
  e.preventDefault();
  const itemId = parseInt(document.getElementById('almacen-item-select').value);
  const tipo = document.getElementById('almacen-tipo-op').value;
  const cant = parseFloat(document.getElementById('almacen-cant-op').value) || 0;

  const item = window.db.almacen.find(i => i.id === itemId);
  if (item) {
    if (tipo === 'entrada') item.stock += cant;
    else item.stock = Math.max(0, item.stock - cant);
    guardarBD();
    renderAlmacenAdmin();
    e.target.reset();
  }
}

function renderFinanzasAdmin() {
  document.getElementById('lista-movimientos-diarios-finanzas').innerHTML = window.db.movimientos.map(m => {
    const totIng = (m.ingresos.Efectivo || 0) + (m.ingresos.Nequi || 0) + (m.ingresos.Bancolombia || 0) + (m.ingresos.Datáfono || 0);
    const totGas = (m.gastos || []).reduce((a, b) => a + b.valor, 0);
    return `
      <div class="daily-row">
        <span>${m.fecha}</span>
        <div><span class="txt-green">+$${totIng.toLocaleString()}</span> | <span class="txt-red">-$${totGas.toLocaleString()}</span></div>
      </div>
    `;
  }).join('');
}

function registrarMovimientoAdmin(e) {
  e.preventDefault();
  const tipo = document.getElementById('admin-fin-tipo').value;
  const concepto = document.getElementById('admin-fin-concepto').value;
  const valor = parseFloat(document.getElementById('admin-fin-valor').value) || 0;
  const cuenta = document.getElementById('admin-fin-cuenta').value;

  const hoyFecha = new Date().toLocaleDateString();
  let movHoy = window.db.movimientos.find(m => m.fechaRaw === hoyFecha);

  if (!movHoy) {
    movHoy = {
      fecha: `${new Date().toLocaleDateString('es-CO', { weekday: 'short' })} (${hoyFecha})`,
      fechaRaw: hoyFecha,
      isoDate: new Date().toISOString().substring(0, 7),
      diaSemanaIndex: new Date().getDay(),
      ingresos: { Efectivo: 0, Nequi: 0, Bancolombia: 0, Datáfono: 0 },
      gastos: []
    };
    window.db.movimientos.push(movHoy);
  }

  if (tipo === 'ingreso') movHoy.ingresos[cuenta] = (movHoy.ingresos[cuenta] || 0) + valor;
  else movHoy.gastos.push({ concepto: `[ADMIN] ${concepto}`, valor, cuenta });

  guardarBD();
  renderFinanzasAdmin();
  cargarAdminHub();
  e.target.reset();
}

function renderDesempenoAdmin() {
  const select = document.getElementById('desempeno-mes-select');
  if (!select.value) select.value = new Date().toISOString().substring(0, 7);
  renderRendimientoMensual();
}

function renderRendimientoMensual() {
  const mesSel = document.getElementById('desempeno-mes-select').value;
  const movs = window.db.movimientos.filter(m => m.isoDate === mesSel);

  let totV = 0, totG = 0;
  movs.forEach(m => {
    totV += (m.ingresos.Efectivo || 0) + (m.ingresos.Nequi || 0) + (m.ingresos.Bancolombia || 0) + (m.ingresos.Datáfono || 0);
    totG += (m.gastos || []).reduce((a, b) => a + b.valor, 0);
  });

  document.getElementById('resumen-mes-ventas').innerText = `$${totV.toLocaleString()}`;
  document.getElementById('resumen-mes-gastos').innerText = `$${totG.toLocaleString()}`;
  document.getElementById('resumen-mes-utilidad').innerText = `$${(totV - totG).toLocaleString()}`;
}

function renderListaUsuariosAdmin() {
  document.getElementById('admin-lista-usuarios').innerHTML = window.db.usuarios.map((u, i) => `
    <div class="inner-card" style="display:flex; justify-content:space-between; align-items:center;">
      <div><strong>${u.usuario}</strong> (${u.rol})</div>
      ${u.usuario !== 'Admin' ? `<button class="btn-secondary" onclick="eliminarUsuario(${i})" style="width:auto;">🗑️</button>` : ''}
    </div>
  `).join('');
}

function agregarNuevoUsuario(e) {
  e.preventDefault();
  window.db.usuarios.push({
    usuario: document.getElementById('nuevo-user-nombre').value,
    pin: document.getElementById('nuevo-user-pin').value,
    rol: document.getElementById('nuevo-user-rol').value
  });
  guardarBD();
  renderListaUsuariosAdmin();
  e.target.reset();
}

function eliminarUsuario(i) {
  window.db.usuarios.splice(i, 1);
  guardarBD();
  renderListaUsuariosAdmin();
}
