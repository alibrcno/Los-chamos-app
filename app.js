// --- BASE DE DATOS Y ESTADO LOCAL ---
let db = {
  usuarios: JSON.parse(localStorage.getItem('chamos_usuarios')) || [
    { usuario: 'admin', pin: '1234', rol: 'admin' },
    { usuario: 'encargada', pin: '1111', rol: 'encargada' },
    { usuario: 'cocina', pin: '2222', rol: 'cocina' }
  ],
  bebidas: JSON.parse(localStorage.getItem('chamos_bebidas')) || [
    { id: 1, nombre: 'Cerveza Aguila', precio: 4000, stock: 24, sugerido: 48 },
    { id: 2, nombre: 'Gatorade', precio: 5000, stock: 12, sugerido: 24 }
  ],
  insumosDesechables: JSON.parse(localStorage.getItem('chamos_insumos_desechables')) || [
    { id: 1, nombre: 'Servilletas', unidad: 'Paquete', stock: 10, sugerido: 20 },
    { id: 2, nombre: 'Tenedores', unidad: 'Paquete', stock: 5, sugerido: 10 },
    { id: 3, nombre: 'Vasos 12oz', unidad: 'Paquete', stock: 8, sugerido: 15 },
    { id: 4, nombre: 'Cuchillos', unidad: 'Paquete', stock: 4, sugerido: 10 }
  ],
  insumosCocina: JSON.parse(localStorage.getItem('chamos_insumos')) || [
    { id: 1, nombre: 'Jamón', cantidad: 500, unidad: 'gr', ideal: 1000 },
    { id: 2, nombre: 'Lechuga', cantidad: 2, unidad: 'und', ideal: 5 }
  ],
  tareasCocina: JSON.parse(localStorage.getItem('chamos_tareas')) || [
    { id: 1, tarea: 'Hacer salsa de pizza' },
    { id: 2, tarea: 'Hacer guiso de caraota' }
  ],
  almacen: JSON.parse(localStorage.getItem('chamos_almacen')) || [
    { id: 1, nombre: 'Bulto de Harina (25kg)', unidad: 'Bulto', stock: 5 },
    { id: 2, nombre: 'Paca de Maltas', unidad: 'Paca', stock: 10 }
  ],
  movimientos: JSON.parse(localStorage.getItem('chamos_movimientos')) || [],
  
  // Estado Temporal del Turno
  gastosTurnoActual: [],
  entradasBebidasTurno: {},
  aperturaDatos: {
    bebidas: {},
    insumos: {},
    bases: { Efectivo: 0, Nequi: 0, Bancolombia: 0, Datáfono: 0 }
  },
  usuarioActual: null
};

const NUMERO_WHATSAPP_ADMIN = "573218382315";

function guardarBD() {
  localStorage.setItem('chamos_usuarios', JSON.stringify(db.usuarios));
  localStorage.setItem('chamos_bebidas', JSON.stringify(db.bebidas));
  localStorage.setItem('chamos_insumos_desechables', JSON.stringify(db.insumosDesechables));
  localStorage.setItem('chamos_insumos', JSON.stringify(db.insumosCocina));
  localStorage.setItem('chamos_tareas', JSON.stringify(db.tareasCocina));
  localStorage.setItem('chamos_almacen', JSON.stringify(db.almacen));
  localStorage.setItem('chamos_movimientos', JSON.stringify(db.movimientos));
}

// AL CARGAR LA PÁGINA: AUTORECORDAR USUARIO
window.addEventListener('DOMContentLoaded', () => {
  const usuarioGuardado = localStorage.getItem('chamos_usuario_recordado');
  if (usuarioGuardado) {
    document.getElementById('login-usuario').value = usuarioGuardado;
    document.getElementById('login-recordar').checked = true;
  }
});

// --- AUTENTICACIÓN ---
function iniciarSesion(e) {
  e.preventDefault();
  const user = document.getElementById('login-usuario').value.trim();
  const pin = document.getElementById('login-pin').value.trim();
  const recordar = document.getElementById('login-recordar').checked;

  const usuario = db.usuarios.find(u => u.usuario.toLowerCase() === user.toLowerCase() && u.pin === pin);

  if (usuario) {
    db.usuarioActual = usuario;

    if (recordar) {
      localStorage.setItem('chamos_usuario_recordado', user);
    } else {
      localStorage.removeItem('chamos_usuario_recordado');
    }

    document.getElementById('sec-login').classList.add('hidden');
    document.getElementById('btn-logout').classList.remove('hidden');

    if (usuario.rol === 'admin') {
      document.getElementById('header-titulo').innerText = "Los Chamos Admin";
      document.getElementById('sec-admin').classList.remove('hidden');
      document.getElementById('app-nav').classList.remove('hidden');
      cargarAdminHub();
    } else if (usuario.rol === 'encargada') {
      document.getElementById('header-titulo').innerText = "Los Chamos Encargada";
      document.getElementById('sec-encargada').classList.remove('hidden');
      volverEncargadaHub();
    } else if (usuario.rol === 'cocina') {
      document.getElementById('header-titulo').innerText = "Los Chamos Cocina";
      document.getElementById('sec-cocina').classList.remove('hidden');
      cargarModuloCocina();
    }
  } else {
    document.getElementById('login-error').classList.remove('hidden');
  }
}

function cerrarSesion() {
  db.usuarioActual = null;
  document.getElementById('sec-login').classList.remove('hidden');
  document.getElementById('sec-admin').classList.add('hidden');
  document.getElementById('sec-encargada').classList.add('hidden');
  document.getElementById('sec-cocina').classList.add('hidden');
  document.getElementById('app-nav').classList.add('hidden');
  document.getElementById('btn-logout').classList.add('hidden');
  document.getElementById('login-pin').value = '';
}

// --- MÓDULO ADMIN HUB ---
function cargarAdminHub() {
  let saldos = { Bancolombia: 0, Nequi: 0, Efectivo: 0, Datáfono: 0 };

  db.movimientos.forEach(m => {
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

function verSubModuloAdmin(modulo) {
  const modulos = ['hub', 'almacen', 'finanzas', 'desempeno', 'bebidas', 'insumos', 'checklist', 'usuarios'];
  modulos.forEach(m => {
    const el = document.getElementById(`admin-view-${m}`);
    if (el) el.classList.add('hidden');
  });

  document.getElementById(`admin-view-${modulo}`).classList.remove('hidden');

  if (modulo === 'almacen') renderAlmacenAdmin();
  else if (modulo === 'finanzas') renderFinanzasAdmin();
  else if (modulo === 'desempeno') renderDesempenoAdmin();
  else if (modulo === 'bebidas') renderListaBebidasAdmin();
  else if (modulo === 'insumos') renderListaInsumosAdmin();
  else if (modulo === 'checklist') renderListaChecklistAdmin();
  else if (modulo === 'usuarios') renderListaUsuariosAdmin();
}

function volverAdminHub() {
  verSubModuloAdmin('hub');
  cargarAdminHub();
}

function navegarBarra(vista) {
  verSubModuloAdmin(vista);
}

// --- EDICIÓN Y GESTIÓN COMPLETA DE USUARIOS / PINs ---
function renderListaUsuariosAdmin() {
  document.getElementById('admin-lista-usuarios').innerHTML = db.usuarios.map((u, index) => `
    <div class="inner-card" style="margin-bottom:10px;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
        <strong>👤 ${u.usuario} (${u.rol.toUpperCase()})</strong>
        ${u.usuario !== 'admin' ? `<button class="btn-secondary" onclick="eliminarUsuario(${index})">🗑️</button>` : ''}
      </div>
      <div style="display:flex; gap:8px;">
        <input type="password" id="edit-pin-${index}" value="${u.pin}" style="padding:6px; font-size:0.85rem;" placeholder="PIN">
        <button class="btn-secondary" onclick="modificarPinUsuario(${index})" style="background:#ea580c; color:white; border:none;">💾 Guardar</button>
      </div>
    </div>
  `).join('');
}

function modificarPinUsuario(index) {
  const nuevoPin = document.getElementById(`edit-pin-${index}`).value.trim();
  if (!nuevoPin) { alert("⚠️ El PIN no puede estar vacío"); return; }
  
  db.usuarios[index].pin = nuevoPin;
  guardarBD();
  alert(`✅ PIN del usuario '${db.usuarios[index].usuario}' actualizado exitosamente.`);
  renderListaUsuariosAdmin();
}

function agregarNuevoUsuario(e) {
  e.preventDefault();
  const nom = document.getElementById('nuevo-user-nombre').value.trim();
  const pin = document.getElementById('nuevo-user-pin').value.trim();
  const rol = document.getElementById('nuevo-user-rol').value;

  db.usuarios.push({ usuario: nom, pin, rol });
  guardarBD();
  renderListaUsuariosAdmin();
  e.target.reset();
  alert("✅ Usuario creado exitosamente");
}

function eliminarUsuario(index) {
  if (confirm(`¿Eliminar al usuario ${db.usuarios[index].usuario}?`)) {
    db.usuarios.splice(index, 1);
    guardarBD();
    renderListaUsuariosAdmin();
  }
}

// --- OTROS SUBMÓDULOS ADMIN ---
function renderAlmacenAdmin() {
  const select = document.getElementById('almacen-item-select');
  select.innerHTML = db.almacen.map(i => `<option value="${i.id}">${i.nombre} (${i.stock} ${i.unidad})</option>`).join('');

  const cont = document.getElementById('admin-lista-almacen');
  cont.innerHTML = db.almacen.map(i => `
    <div class="inner-card" style="display:flex; justify-content:space-between; align-items:center;">
      <div><strong>${i.nombre}</strong><br><small style="color:#64748b;">Stock Bodega: <strong>${i.stock} ${i.unidad}</strong></small></div>
      <button class="btn-secondary" onclick="eliminarItemAlmacen(${i.id})">🗑️</button>
    </div>
  `).join('');
}

function registrarMovimientoAlmacen(e) {
  e.preventDefault();
  const itemId = parseInt(document.getElementById('almacen-item-select').value);
  const tipo = document.getElementById('almacen-tipo-op').value;
  const cant = parseFloat(document.getElementById('almacen-cant-op').value) || 0;

  const item = db.almacen.find(i => i.id === itemId);
  if (item) {
    if (tipo === 'entrada') item.stock += cant;
    else {
      if (cant > item.stock) { alert(`⚠️ Stock insuficiente en bodega`); return; }
      item.stock -= cant;
    }
    guardarBD(); renderAlmacenAdmin(); e.target.reset();
  }
}

function agregarNuevoItemAlmacen(e) {
  e.preventDefault();
  db.almacen.push({
    id: Date.now(),
    nombre: document.getElementById('nuevo-almacen-nombre').value,
    unidad: document.getElementById('nuevo-almacen-unidad').value,
    stock: parseFloat(document.getElementById('nuevo-almacen-stock').value) || 0
  });
  guardarBD(); renderAlmacenAdmin(); e.target.reset();
}

function eliminarItemAlmacen(id) {
  db.almacen = db.almacen.filter(i => i.id !== id);
  guardarBD(); renderAlmacenAdmin();
}

function renderFinanzasAdmin() {
  document.getElementById('lista-movimientos-diarios-finanzas').innerHTML = db.movimientos.map(m => {
    const totIngresos = (m.ingresos.Efectivo || 0) + (m.ingresos.Nequi || 0) + (m.ingresos.Bancolombia || 0) + (m.ingresos.Datáfono || 0);
    const totGastos = (m.gastos || []).reduce((acc, g) => acc + g.valor, 0);
    return `
      <div class="daily-row">
        <div><strong>${m.fecha}</strong></div>
        <div><span class="txt-green">Ing: $${totIngresos.toLocaleString()}</span> | <span class="txt-red">Gas: $${totGastos.toLocaleString()}</span></div>
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
  let movHoy = db.movimientos.find(m => m.fechaRaw === hoyFecha);

  if (!movHoy) {
    movHoy = {
      fecha: `${new Date().toLocaleDateString('es-CO', { weekday: 'long' })} (${hoyFecha})`,
      fechaRaw: hoyFecha,
      isoDate: new Date().toISOString().substring(0, 7),
      diaSemanaIndex: new Date().getDay(),
      ingresos: { Efectivo: 0, Nequi: 0, Bancolombia: 0, Datáfono: 0 },
      gastos: []
    };
    db.movimientos.push(movHoy);
  }

  if (tipo === 'ingreso') movHoy.ingresos[cuenta] = (movHoy.ingresos[cuenta] || 0) + valor;
  else movHoy.gastos.push({ concepto: `[ADMIN] ${concepto}`, valor, cuenta });

  guardarBD(); renderFinanzasAdmin(); cargarAdminHub(); alert("✅ Registrado"); e.target.reset();
}

function renderDesempenoAdmin() {
  const mesInput = document.getElementById('desempeno-mes-select');
  if (!mesInput.value) mesInput.value = new Date().toISOString().substring(0, 7);
  renderRendimientoMensual();
}

function renderRendimientoMensual() {
  const mesSel = document.getElementById('desempeno-mes-select').value;
  const movsMes = db.movimientos.filter(m => m.isoDate === mesSel || (m.fechaRaw && m.fechaRaw.includes(mesSel)));

  let totVentas = 0, totGastos = 0;
  const nombresDias = { 3: 'Miércoles', 4: 'Jueves', 5: 'Viernes', 6: 'Sábado', 0: 'Domingo', 1: 'Lunes' };
  let acumuladoDias = { 3: 0, 4: 0, 5: 0, 6: 0, 0: 0, 1: 0 }, conteoDias = { 3: 0, 4: 0, 5: 0, 6: 0, 0: 0, 1: 0 };

  movsMes.forEach(m => {
    const ing = (m.ingresos.Efectivo || 0) + (m.ingresos.Nequi || 0) + (m.ingresos.Bancolombia || 0) + (m.ingresos.Datáfono || 0);
    const gas = (m.gastos || []).reduce((acc, g) => acc + g.valor, 0);
    totVentas += ing; totGastos += gas;

    const idx = m.diaSemanaIndex !== undefined ? m.diaSemanaIndex : 0;
    if (acumuladoDias[idx] !== undefined) { acumuladoDias[idx] += ing; conteoDias[idx] += 1; }
  });

  document.getElementById('resumen-mes-utilidad').innerText = `$${(totVentas - totGastos).toLocaleString()}`;
  document.getElementById('resumen-mes-ventas').innerText = `$${totVentas.toLocaleString()}`;
  document.getElementById('resumen-mes-gastos').innerText = `$${totGastos.toLocaleString()}`;

  let maxProm = 1;
  const promedios = {};
  [3, 4, 5, 6, 0, 1].forEach(d => {
    promedios[d] = conteoDias[d] > 0 ? acumuladoDias[d] / conteoDias[d] : 0;
    if (promedios[d] > maxProm) maxProm = promedios[d];
  });

  document.getElementById('desempeno-grafica-dias').innerHTML = [3, 4, 5, 6, 0, 1].map(d => `
    <div style="margin-bottom: 12px;">
      <div style="display:flex; justify-content:space-between; font-size:0.8rem;">
        <strong>${nombresDias[d]}</strong>
        <span style="color:#ea580c; font-weight:bold;">$${Math.round(promedios[d]).toLocaleString()} / día</span>
      </div>
      <div class="bar-container"><div class="bar-fill" style="width: ${Math.round((promedios[d] / maxProm) * 100)}%;"></div></div>
    </div>
  `).join('');
}

function renderListaBebidasAdmin() {
  document.getElementById('admin-lista-bebidas').innerHTML = db.bebidas.map(b => `
    <div class="inner-card" style="display:flex; justify-content:space-between; align-items:center;">
      <div><strong>${b.nombre}</strong><br><small style="color:#64748b;">$${b.precio.toLocaleString()} | Stock: ${b.stock} | Sugerido: ${b.sugerido}</small></div>
      <button class="btn-secondary" onclick="eliminarBebida(${b.id})">🗑️</button>
    </div>
  `).join('');
}

function agregarNuevaBebida(e) {
  e.preventDefault();
  db.bebidas.push({
    id: Date.now(),
    nombre: document.getElementById('nueva-bebida-nombre').value,
    precio: parseFloat(document.getElementById('nueva-bebida-precio').value) || 0,
    stock: parseInt(document.getElementById('nueva-bebida-stock').value) || 0,
    sugerido: parseInt(document.getElementById('nueva-bebida-sugerido').value) || 0
  });
  guardarBD(); renderListaBebidasAdmin(); e.target.reset();
}

function eliminarBebida(id) {
  db.bebidas = db.bebidas.filter(b => b.id !== id);
  guardarBD(); renderListaBebidasAdmin();
}

function renderListaInsumosAdmin() {
  document.getElementById('admin-lista-insumos').innerHTML = db.insumosDesechables.map(i => `
    <div class="inner-card" style="display:flex; justify-content:space-between; align-items:center;">
      <div><strong>${i.nombre}</strong><br><small style="color:#64748b;">Stock: ${i.stock} ${i.unidad} | Sugerido: ${i.sugerido} ${i.unidad}</small></div>
      <button class="btn-secondary" onclick="eliminarInsumoDesechable(${i.id})">🗑️</button>
    </div>
  `).join('');
}

function agregarNuevoInsumoDesechable(e) {
  e.preventDefault();
  db.insumosDesechables.push({
    id: Date.now(),
    nombre: document.getElementById('nuevo-insumo-desechable-nombre').value,
    unidad: document.getElementById('nuevo-insumo-desechable-unidad').value,
    stock: parseInt(document.getElementById('nuevo-insumo-desechable-stock').value) || 0,
    sugerido: parseInt(document.getElementById('nuevo-insumo-desechable-sugerido').value) || 0
  });
  guardarBD(); renderListaInsumosAdmin(); e.target.reset();
}

function eliminarInsumoDesechable(id) {
  db.insumosDesechables = db.insumosDesechables.filter(i => i.id !== id);
  guardarBD(); renderListaInsumosAdmin();
}

function renderListaChecklistAdmin() {
  document.getElementById('admin-lista-checklist').innerHTML = db.tareasCocina.map(t => `
    <div class="inner-card" style="display:flex; justify-content:space-between; align-items:center;">
      <div><strong>${t.tarea}</strong></div>
      <button class="btn-secondary" onclick="eliminarTarea(${t.id})">🗑️</button>
    </div>
  `).join('');
}

function agregarNuevaTarea(e) {
  e.preventDefault();
  db.tareasCocina.push({ id: Date.now(), tarea: document.getElementById('nueva-tarea-nombre').value.trim() });
  guardarBD(); renderListaChecklistAdmin(); e.target.reset();
}

function eliminarTarea(id) {
  db.tareasCocina = db.tareasCocina.filter(t => t.id !== id);
  guardarBD(); renderListaChecklistAdmin();
}

// --- MÓDULO ENCARGADA (NUEVO DISEÑO TARJETERÍA) ---
function volverEncargadaHub() {
  document.getElementById('encargada-hub').classList.remove('hidden');
  document.getElementById('encargada-apertura-paso1').classList.add('hidden');
  document.getElementById('encargada-apertura-paso2').classList.add('hidden');
  document.getElementById('encargada-apertura-paso3').classList.add('hidden');
  document.getElementById('encargada-view-gasto').classList.add('hidden');
  document.getElementById('encargada-view-entrada').classList.add('hidden');
  document.getElementById('encargada-cierre-paso1').classList.add('hidden');
  document.getElementById('encargada-cierre-paso2').classList.add('hidden');
  document.getElementById('encargada-cierre-paso3').classList.add('hidden');
}

function verSubModuloEncargada(modulo) {
  document.getElementById('encargada-hub').classList.add('hidden');

  if (modulo === 'apertura') {
    iniciarAperturaEncargada();
  } else if (modulo === 'gasto') {
    document.getElementById('encargada-view-gasto').classList.remove('hidden');
  } else if (modulo === 'entrada') {
    document.getElementById('encargada-view-entrada').classList.remove('hidden');
    renderFormularioEntradaMasivaBebidas();
  } else if (modulo === 'cierre') {
    irACierrePaso1Bebidas();
  }
}

function iniciarAperturaEncargada() {
  document.getElementById('encargada-apertura-paso1').classList.remove('hidden');
  document.getElementById('lista-apertura-bebidas').innerHTML = db.bebidas.map(b => `
    <div class="form-group">
      <label>${b.nombre} (Stock actual: ${b.stock}):</label>
      <input type="number" id="apertura-bebida-${b.id}" value="${b.stock}">
    </div>
  `).join('');
}

function irAAperturaInsumosPaso2() {
  db.bebidas.forEach(b => {
    db.aperturaDatos.bebidas[b.id] = parseInt(document.getElementById(`apertura-bebida-${b.id}`).value) || 0;
  });

  document.getElementById('encargada-apertura-paso1').classList.add('hidden');
  document.getElementById('encargada-apertura-paso2').classList.remove('hidden');

  document.getElementById('lista-apertura-insumos').innerHTML = db.insumosDesechables.map(i => `
    <div class="form-group">
      <label>${i.nombre} (${i.unidad}) - Stock actual: ${i.stock}:</label>
      <input type="number" id="apertura-insumo-${i.id}" value="${i.stock}">
    </div>
  `).join('');
}

function volverAAperturaBebidasPaso1() {
  document.getElementById('encargada-apertura-paso2').classList.add('hidden');
  document.getElementById('encargada-apertura-paso1').classList.remove('hidden');
}

function irAAperturaSaldosPaso3() {
  db.insumosDesechables.forEach(i => {
    db.aperturaDatos.insumos[i.id] = parseInt(document.getElementById(`apertura-insumo-${i.id}`).value) || 0;
  });

  document.getElementById('encargada-apertura-paso2').classList.add('hidden');
  document.getElementById('encargada-apertura-paso3').classList.remove('hidden');
}

function volverAAperturaInsumosPaso2() {
  document.getElementById('encargada-apertura-paso3').classList.add('hidden');
  document.getElementById('encargada-apertura-paso2').classList.remove('hidden');
}

function finalizarAperturaYNotificarAdmin() {
  const efec = parseFloat(document.getElementById('apertura-base-efectivo').value) || 0;
  const neq = parseFloat(document.getElementById('apertura-base-nequi').value) || 0;
  const ban = parseFloat(document.getElementById('apertura-base-bancolombia').value) || 0;
  const dat = parseFloat(document.getElementById('apertura-base-datafono').value) || 0;

  db.aperturaDatos.bases = { Efectivo: efec, Nequi: neq, Bancolombia: ban, Datáfono: dat };
  db.gastosTurnoActual = [];
  db.entradasBebidasTurno = {};

  let msg = `*🔔 ALERTA DE APERTURA DE TURNO - LOS CHAMOS*\n📅 Fecha: ${new Date().toLocaleDateString()}\n\n`;
  msg += `*💵 BASES Y SALDOS INICIALES:*\n`;
  msg += `- Efectivo en Caja: $${efec.toLocaleString()}\n`;
  msg += `- Nequi: $${neq.toLocaleString()}\n`;
  msg += `- Bancolombia: $${ban.toLocaleString()}\n`;
  msg += `- Datáfono: $${dat.toLocaleString()}\n\n`;

  msg += `*🥤 INVENTARIO INICIAL BEBIDAS:*\n`;
  db.bebidas.forEach(b => {
    msg += `• ${b.nombre}: ${db.aperturaDatos.bebidas[b.id] || 0} unds\n`;
  });

  msg += `\n*🍽️ INVENTARIO INICIAL INSUMOS:*\n`;
  db.insumosDesechables.forEach(i => {
    msg += `• ${i.nombre}: ${db.aperturaDatos.insumos[i.id] || 0} ${i.unidad}\n`;
  });

  alert("✅ Apertura registrada con éxito. Se enviará la notificación al Administrador.");
  
  const url = `https://wa.me/${NUMERO_WHATSAPP_ADMIN}?text=${encodeURIComponent(msg)}`;
  window.open(url, '_blank');

  volverEncargadaHub();
}

function renderFormularioEntradaMasivaBebidas() {
  const cont = document.getElementById('contenedor-entradas-masivas-bebidas');
  cont.innerHTML = db.bebidas.map(b => `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
      <span style="font-size:0.85rem; font-weight:600;">${b.nombre}</span>
      <input type="number" id="entrada-masiva-bebida-${b.id}" placeholder="+0" style="width:90px; text-align:center;">
    </div>
  `).join('');
}

function guardarEntradasMasivasBebidas() {
  let cargadas = 0;
  db.bebidas.forEach(b => {
    const cant = parseInt(document.getElementById(`entrada-masiva-bebida-${b.id}`).value) || 0;
    if (cant > 0) {
      if (!db.entradasBebidasTurno[b.id]) db.entradasBebidasTurno[b.id] = 0;
      db.entradasBebidasTurno[b.id] += cant;
      cargadas++;
      document.getElementById(`entrada-masiva-bebida-${b.id}`).value = '';
    }
  });

  if (cargadas > 0) {
    alert("✅ Se agregaron las bebidas al inventario del turno.");
    volverEncargadaHub();
  } else {
    alert("ℹ️ No ingresaste cantidades.");
  }
}

function registrarGasto(e) {
  e.preventDefault();
  const concepto = document.getElementById('gasto-concepto').value;
  const valor = parseFloat(document.getElementById('gasto-valor').value) || 0;
  const cuenta = document.getElementById('gasto-cuenta').value;

  db.gastosTurnoActual.push({ concepto, valor, cuenta });
  alert(`✅ Gasto registrado ($${valor.toLocaleString()})`);
  e.target.reset();
  volverEncargadaHub();
}

// CIERRE DE TURNO
function irACierrePaso1Bebidas() {
  document.getElementById('encargada-cierre-paso1').classList.remove('hidden');

  document.getElementById('lista-cierre-bebidas').innerHTML = db.bebidas.map(b => {
    const ini = db.aperturaDatos.bebidas[b.id] || 0;
    const ent = db.entradasBebidasTurno[b.id] || 0;
    return `
      <div class="form-group">
        <label>${b.nombre} (Inicial: ${ini} + Entradas: ${ent} = ${ini + ent}):</label>
        <input type="number" id="cierre-bebida-${b.id}" placeholder="Cantidad final física">
      </div>
    `;
  }).join('');
}

function irACierrePaso2Insumos() {
  document.getElementById('encargada-cierre-paso1').classList.add('hidden');
  document.getElementById('encargada-cierre-paso2').classList.remove('hidden');

  document.getElementById('lista-cierre-insumos').innerHTML = db.insumosDesechables.map(i => `
    <div class="form-group">
      <label>${i.nombre} (${i.unidad}):</label>
      <input type="number" id="cierre-insumo-${i.id}" placeholder="Cantidad final física">
    </div>
  `).join('');
}

function volverACierrePaso1Bebidas() {
  document.getElementById('encargada-cierre-paso2').classList.add('hidden');
  document.getElementById('encargada-cierre-paso1').classList.remove('hidden');
}

function irACierrePaso3Saldos() {
  document.getElementById('encargada-cierre-paso2').classList.add('hidden');
  document.getElementById('encargada-cierre-paso3').classList.remove('hidden');
}

function volverACierrePaso2Insumos() {
  document.getElementById('encargada-cierre-paso3').classList.add('hidden');
  document.getElementById('encargada-cierre-paso2').classList.remove('hidden');
}

function generarReporteCierreCompleto() {
  const efecFinal = parseFloat(document.getElementById('cierre-final-efectivo').value) || 0;
  const neqFinal = parseFloat(document.getElementById('cierre-final-nequi').value) || 0;
  const banFinal = parseFloat(document.getElementById('cierre-final-bancolombia').value) || 0;
  const datFinal = parseFloat(document.getElementById('cierre-final-datafono').value) || 0;

  let ventaEstimadaBebidas = 0;
  let resumenBebidas = "";
  let comprasSugeridasBebidas = [];

  db.bebidas.forEach(b => {
    const ini = db.aperturaDatos.bebidas[b.id] || 0;
    const ent = db.entradasBebidasTurno[b.id] || 0;
    const fin = parseInt(document.getElementById(`cierre-bebida-${b.id}`).value) || 0;
    const vendidas = (ini + ent) - fin;
    const totVenta = vendidas * b.precio;
    ventaEstimadaBebidas += totVenta;

    resumenBebidas += `• ${b.nombre}: Quedan ${fin} (Vendidas: ${vendidas} = $${totVenta.toLocaleString()})\n`;
    b.stock = fin;

    if (fin < b.sugerido) {
      comprasSugeridasBebidas.push(`• Comprar ${b.sugerido - fin} unds de ${b.nombre}`);
    }
  });

  let resumenInsumos = "";
  let comprasSugeridasInsumos = [];

  db.insumosDesechables.forEach(i => {
    const fin = parseInt(document.getElementById(`cierre-insumo-${i.id}`).value) || 0;
    resumenInsumos += `• ${i.nombre}: ${fin} ${i.unidad}\n`;
    i.stock = fin;

    if (fin < i.sugerido) {
      comprasSugeridasInsumos.push(`• Comprar ${i.sugerido - fin} ${i.unidad} de ${i.nombre}`);
    }
  });

  const totalIngresoEfectivo = efecFinal - db.aperturaDatos.bases.Efectivo;
  const totalIngresoNequi = neqFinal - db.aperturaDatos.bases.Nequi;
  const totalIngresoBancolombia = banFinal - db.aperturaDatos.bases.Bancolombia;
  const totalIngresoDatáfono = datFinal - db.aperturaDatos.bases.Datáfono;

  const totalIngresoBrutoGeneral = totalIngresoEfectivo + totalIngresoNequi + totalIngresoBancolombia + totalIngresoDatáfono;
  const totalGastos = db.gastosTurnoActual.reduce((acc, g) => acc + g.valor, 0);

  const observaciones = document.getElementById('encargada-observaciones').value.trim();

  const fechaActual = new Date();
  const hoyFecha = fechaActual.toLocaleDateString();

  db.movimientos.push({
    fecha: `${fechaActual.toLocaleDateString('es-CO', { weekday: 'long' })} (${hoyFecha})`,
    fechaRaw: hoyFecha,
    isoDate: fechaActual.toISOString().substring(0, 7),
    diaSemanaIndex: fechaActual.getDay(),
    ingresos: { Efectivo: totalIngresoEfectivo, Nequi: totalIngresoNequi, Bancolombia: totalIngresoBancolombia, Datáfono: totalIngresoDatáfono },
    gastos: [...db.gastosTurnoActual]
  });

  guardarBD();

  let msg = `*📊 CIERRE DE TURNO Y REPORTE OPERATIVO*\n📅 ${hoyFecha}\n\n`;
  msg += `*💵 INGRESO NETO TOTAL DEL RESTAURANTE:*\n`;
  msg += `- Ingreso Efectivo: $${totalIngresoEfectivo.toLocaleString()}\n`;
  msg += `- Ingreso Nequi: $${totalIngresoNequi.toLocaleString()}\n`;
  msg += `- Ingreso Bancolombia: $${totalIngresoBancolombia.toLocaleString()}\n`;
  msg += `- Ingreso Datáfono: $${totalIngresoDatáfono.toLocaleString()}\n`;
  msg += `👉 *INGRESO BRUTO TOTAL:* $${totalIngresoBrutoGeneral.toLocaleString()}\n`;
  msg += `👉 *TOTAL GASTOS:* -$${totalGastos.toLocaleString()}\n\n`;

  msg += `*🥤 REFERENCIA VENTA BEBIDAS:* $${ventaEstimadaBebidas.toLocaleString()}\n`;
  msg += `${resumenBebidas}\n`;

  msg += `*🍽️ INVENTARIO INSUMOS Y DOBLADOS:*\n${resumenInsumos}\n`;

  msg += `*🛒 COMPRAS SUGERIDAS (REABASTECIMIENTO):*\n`;
  const todasSugeridas = [...comprasSugeridasBebidas, ...comprasSugeridasInsumos];
  if (todasSugeridas.length > 0) {
    msg += todasSugeridas.join('\n') + `\n\n`;
  } else {
    msg += `✅ Stock de bebidas e insumos completo.\n\n`;
  }

  if (observaciones !== "") {
    msg += `*📝 OBSERVACIONES / NOVEDADES:*\n${observaciones}\n`;
  }

  const url = `https://wa.me/${NUMERO_WHATSAPP_ADMIN}?text=${encodeURIComponent(msg)}`;
  window.open(url, '_blank');
  cerrarSesion();
}

// --- MÓDULO COCINA ---
function cargarModuloCocina() {
  document.getElementById('lista-checklist-cocina').innerHTML = db.tareasCocina.map(t => `
    <label class="checkbox-item"><input type="checkbox" id="tarea-check-${t.id}"><span>${t.tarea}</span></label>
  `).join('');

  document.getElementById('lista-cocina').innerHTML = db.insumosCocina.map(i => `
    <div class="inner-card">
      <label><strong>${i.nombre}</strong> (Ideal: ${i.ideal} ${i.unidad})</label>
      <input type="number" id="cocina-cant-${i.id}" value="${i.cantidad}">
    </div>
  `).join('');
}

function generarReporteCocina() {
  let msg = `*🥬 INVENTARIO COCINA - LOS CHAMOS*\n📅 Fecha: ${new Date().toLocaleDateString()}\n\n`;

  let tareas = [];
  db.tareasCocina.forEach(t => {
    const chk = document.getElementById(`tarea-check-${t.id}`);
    if (chk && chk.checked) tareas.push(`✅ ${t.tarea}`);
  });

  if (tareas.length > 0) msg += `*📋 PREPARACIONES REALIZADAS:*\n${tareas.join('\n')}\n\n`;

  let dispon = [], compr = [];
  db.insumosCocina.forEach(i => {
    const cant = parseFloat(document.getElementById(`cocina-cant-${i.id}`).value) || 0;
    i.cantidad = cant;
    dispon.push(`• ${i.nombre}: ${cant} ${i.unidad}`);
    if (cant < i.ideal) compr.push(`• Comprar ${i.ideal - cant} ${i.unidad} de ${i.nombre}`);
  });

  msg += `*📦 STOCK ACTUAL:*\n${dispon.join('\n')}\n\n`;
  msg += `*🛒 COMPRAS SUGERIDAS COCINA:*\n${compr.length > 0 ? compr.join('\n') : '✅ Stock completo.'}\n\n`;

  const obs = document.getElementById('cocina-observaciones').value.trim();
  if (obs !== "") msg += `*📝 OBSERVACIONES:*\n${obs}\n`;

  guardarBD();
  const url = `https://wa.me/${NUMERO_WHATSAPP_ADMIN}?text=${encodeURIComponent(msg)}`;
  window.open(url, '_blank');
  cerrarSesion();
}
