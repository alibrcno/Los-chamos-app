// --- BASE DE DATOS Y ESTADO LOCAL ---
let db = {
  usuarios: JSON.parse(localStorage.getItem('chamos_usuarios')) || [
    { usuario: 'admin', pin: '1234', rol: 'admin' },
    { usuario: 'encargada', pin: '1111', rol: 'encargada' },
    { usuario: 'cocina', pin: '2222', rol: 'cocina' }
  ],
  bebidas: JSON.parse(localStorage.getItem('chamos_bebidas')) || [
    { id: 1, nombre: 'Cerveza Aguila', precio: 4000, stock: 24 },
    { id: 2, nombre: 'Gatorade', precio: 5000, stock: 12 }
  ],
  insumosCocina: JSON.parse(localStorage.getItem('chamos_insumos')) || [
    { id: 1, nombre: 'Jamón', cantidad: 500, unidad: 'gr', ideal: 1000 },
    { id: 2, nombre: 'Lechuga', cantidad: 2, unidad: 'und', ideal: 5 }
  ],
  tareasCocina: JSON.parse(localStorage.getItem('chamos_tareas')) || [
    { id: 1, tarea: 'Hacer salsa de pizza' },
    { id: 2, tarea: 'Hacer guiso de caraota' },
    { id: 3, tarea: 'Hacer pollo guisado' }
  ],
  almacen: JSON.parse(localStorage.getItem('chamos_almacen')) || [
    { id: 1, nombre: 'Bulto de Harina (25kg)', unidad: 'Bulto', stock: 5 },
    { id: 2, nombre: 'Paca de Maltas', unidad: 'Paca', stock: 10 }
  ],
  movimientos: JSON.parse(localStorage.getItem('chamos_movimientos')) || [],
  gastosTurnoActual: [],
  entradasBebidasTurno: {},
  inventarioInicialTurno: {},
  usuarioActual: null
};

const NUMERO_WHATSAPP = "573218382315";

function guardarBD() {
  localStorage.setItem('chamos_usuarios', JSON.stringify(db.usuarios));
  localStorage.setItem('chamos_bebidas', JSON.stringify(db.bebidas));
  localStorage.setItem('chamos_insumos', JSON.stringify(db.insumosCocina));
  localStorage.setItem('chamos_tareas', JSON.stringify(db.tareasCocina));
  localStorage.setItem('chamos_almacen', JSON.stringify(db.almacen));
  localStorage.setItem('chamos_movimientos', JSON.stringify(db.movimientos));
}

// --- AUTENTICACIÓN ---
function iniciarSesion(e) {
  e.preventDefault();
  const user = document.getElementById('login-usuario').value.trim();
  const pin = document.getElementById('login-pin').value.trim();

  const usuario = db.usuarios.find(u => u.usuario.toLowerCase() === user.toLowerCase() && u.pin === pin);

  if (usuario) {
    db.usuarioActual = usuario;
    document.getElementById('sec-login').classList.add('hidden');
    document.getElementById('btn-logout').classList.remove('hidden');

    if (usuario.rol === 'admin') {
      document.getElementById('sec-admin').classList.remove('hidden');
      document.getElementById('app-nav').classList.remove('hidden');
      cargarAdminHub();
    } else if (usuario.rol === 'encargada') {
      document.getElementById('sec-encargada').classList.remove('hidden');
      cargarAperturaEncargada();
    } else if (usuario.rol === 'cocina') {
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
}

// --- MÓDULO ADMIN HUB ---
function cargarAdminHub() {
  let saldos = { Bancolombia: 0, Nequi: 0, Efectivo: 0 };

  db.movimientos.forEach(m => {
    if (m.ingresos) {
      saldos.Bancolombia += m.ingresos.Bancolombia || 0;
      saldos.Nequi += m.ingresos.Nequi || 0;
      saldos.Efectivo += m.ingresos.Efectivo || 0;
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
}

function verSubModuloAdmin(modulo) {
  const modulos = ['hub', 'almacen', 'finanzas', 'desempeno', 'bebidas', 'cocina', 'checklist', 'usuarios'];
  modulos.forEach(m => {
    const el = document.getElementById(`admin-view-${m}`);
    if (el) el.classList.add('hidden');
  });

  document.getElementById(`admin-view-${modulo}`).classList.remove('hidden');

  if (modulo === 'almacen') renderAlmacenAdmin();
  else if (modulo === 'finanzas') renderFinanzasAdmin();
  else if (modulo === 'desempeno') renderDesempenoAdmin();
  else if (modulo === 'bebidas') renderListaBebidasAdmin();
  else if (modulo === 'cocina') renderListaCocinaAdmin();
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

// --- SUBMÓDULO: ALMACÉN CENTRAL ---
function renderAlmacenAdmin() {
  const select = document.getElementById('almacen-item-select');
  select.innerHTML = db.almacen.map(i => `<option value="${i.id}">${i.nombre} (${i.stock} ${i.unidad})</option>`).join('');

  const cont = document.getElementById('admin-lista-almacen');
  cont.innerHTML = db.almacen.map(i => `
    <div class="inner-card" style="display:flex; justify-content:space-between; align-items:center;">
      <div>
        <strong>${i.nombre}</strong><br>
        <small style="color:#64748b;">Disponible en Bodega: <strong>${i.stock} ${i.unidad}</strong></small>
      </div>
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
    if (tipo === 'entrada') {
      item.stock += cant;
      alert(`✅ Se sumaron ${cant} ${item.unidad} a ${item.nombre}`);
    } else {
      if (cant > item.stock) {
        alert(`⚠️ No hay suficiente stock en bodega (Disponible: ${item.stock})`);
        return;
      }
      item.stock -= cant;
      alert(`📤 Se trasladaron ${cant} ${item.unidad} de ${item.nombre}`);
    }
    guardarBD();
    renderAlmacenAdmin();
    e.target.reset();
  }
}

function agregarNuevoItemAlmacen(e) {
  e.preventDefault();
  const nombre = document.getElementById('nuevo-almacen-nombre').value;
  const unidad = document.getElementById('nuevo-almacen-unidad').value;
  const stock = parseFloat(document.getElementById('nuevo-almacen-stock').value) || 0;

  db.almacen.push({ id: Date.now(), nombre, unidad, stock });
  guardarBD();
  renderAlmacenAdmin();
  e.target.reset();
}

function eliminarItemAlmacen(id) {
  db.almacen = db.almacen.filter(i => i.id !== id);
  guardarBD();
  renderAlmacenAdmin();
}

// --- SUBMÓDULO: FINANZAS ADMIN ---
function renderFinanzasAdmin() {
  const cont = document.getElementById('lista-movimientos-diarios-finanzas');
  if (db.movimientos.length === 0) {
    cont.innerHTML = `<p style="font-size:0.8rem; color:#94a3b8;">Sin movimientos registrados.</p>`;
  } else {
    cont.innerHTML = db.movimientos.map(m => {
      const totIngresos = (m.ingresos.Efectivo || 0) + (m.ingresos.Nequi || 0) + (m.ingresos.Bancolombia || 0);
      const totGastos = (m.gastos || []).reduce((acc, g) => acc + g.valor, 0);
      return `
        <div class="daily-row">
          <div><strong>${m.fecha}</strong></div>
          <div>
            <span class="txt-green">Ing: $${totIngresos.toLocaleString()}</span> | 
            <span class="txt-red">Gas: $${totGastos.toLocaleString()}</span>
          </div>
        </div>
      `;
    }).join('');
  }
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
      ingresos: { Efectivo: 0, Nequi: 0, Bancolombia: 0 },
      gastos: []
    };
    db.movimientos.push(movHoy);
  }

  if (tipo === 'ingreso') {
    movHoy.ingresos[cuenta] = (movHoy.ingresos[cuenta] || 0) + valor;
  } else {
    movHoy.gastos.push({ concepto: `[ADMIN] ${concepto}`, valor, cuenta });
  }

  guardarBD();
  renderFinanzasAdmin();
  cargarAdminHub();
  alert("✅ Movimiento financiero guardado con éxito.");
  e.target.reset();
}

// --- SUBMÓDULO: DESEMPEÑO Y MÉTRICAS MENSUALES ---
function renderDesempenoAdmin() {
  const mesInput = document.getElementById('desempeno-mes-select');
  if (!mesInput.value) {
    mesInput.value = new Date().toISOString().substring(0, 7);
  }
  renderRendimientoMensual();
}

function renderRendimientoMensual() {
  const mesSel = document.getElementById('desempeno-mes-select').value;
  
  // Filtrar movimientos del mes seleccionado
  const movsMes = db.movimientos.filter(m => {
    return m.isoDate === mesSel || (m.fechaRaw && m.fechaRaw.includes(mesSel));
  });

  let totVentas = 0;
  let totGastos = 0;
  
  // Mapeo por día de la semana (3=Miércoles, 4=Jueves, 5=Viernes, 6=Sábado, 0=Domingo, 1=Lunes)
  const nombresDias = { 3: 'Miércoles', 4: 'Jueves', 5: 'Viernes', 6: 'Sábado', 0: 'Domingo', 1: 'Lunes' };
  let acumuladoDias = { 3: 0, 4: 0, 5: 0, 6: 0, 0: 0, 1: 0 };
  let conteoDias = { 3: 0, 4: 0, 5: 0, 6: 0, 0: 0, 1: 0 };

  movsMes.forEach(m => {
    const ing = (m.ingresos.Efectivo || 0) + (m.ingresos.Nequi || 0) + (m.ingresos.Bancolombia || 0);
    const gas = (m.gastos || []).reduce((acc, g) => acc + g.valor, 0);

    totVentas += ing;
    totGastos += gas;

    const idx = m.diaSemanaIndex !== undefined ? m.diaSemanaIndex : 0;
    if (acumuladoDias[idx] !== undefined) {
      acumuladoDias[idx] += ing;
      conteoDias[idx] += 1;
    }
  });

  const utilidad = totVentas - totGastos;

  document.getElementById('resumen-mes-utilidad').innerText = `$${utilidad.toLocaleString()}`;
  document.getElementById('resumen-mes-ventas').innerText = `$${totVentas.toLocaleString()}`;
  document.getElementById('resumen-mes-gastos').innerText = `$${totGastos.toLocaleString()}`;

  // Buscar valor máximo para escalar barras gráficos
  let maxPromedio = 1;
  const promedios = {};
  
  [3, 4, 5, 6, 0, 1].forEach(d => {
    const prom = conteoDias[d] > 0 ? acumuladoDias[d] / conteoDias[d] : 0;
    promedios[d] = prom;
    if (prom > maxPromedio) maxPromedio = prom;
  });

  const contGrafica = document.getElementById('desempeno-grafica-dias');
  contGrafica.innerHTML = [3, 4, 5, 6, 0, 1].map(d => {
    const prom = promedios[d];
    const pct = Math.round((prom / maxPromedio) * 100);
    return `
      <div style="margin-bottom: 12px;">
        <div style="display:flex; justify-content:space-between; font-size:0.8rem;">
          <strong>${nombresDias[d]}</strong>
          <span style="color:#ea580c; font-weight:bold;">$${Math.round(prom).toLocaleString()} / día</span>
        </div>
        <div class="bar-container">
          <div class="bar-fill" style="width: ${pct}%;"></div>
        </div>
      </div>
    `;
  }).join('');
}

// Config Bebidas, Cocina, Checklist y Usuarios
function renderListaBebidasAdmin() {
  const cont = document.getElementById('admin-lista-bebidas');
  cont.innerHTML = db.bebidas.map(b => `
    <div class="inner-card" style="display:flex; justify-content:space-between; align-items:center;">
      <div><strong>${b.nombre}</strong><br><small style="color:#64748b;">Precio: $${b.precio.toLocaleString()} | Stock: ${b.stock} unds</small></div>
      <button class="btn-secondary" onclick="eliminarBebida(${b.id})">🗑️</button>
    </div>
  `).join('');
}

function agregarNuevaBebida(e) {
  e.preventDefault();
  const nombre = document.getElementById('nueva-bebida-nombre').value;
  const precio = parseFloat(document.getElementById('nueva-bebida-precio').value) || 0;
  const stock = parseInt(document.getElementById('nueva-bebida-stock').value) || 0;

  db.bebidas.push({ id: Date.now(), nombre, precio, stock });
  guardarBD();
  renderListaBebidasAdmin();
  e.target.reset();
}

function eliminarBebida(id) {
  db.bebidas = db.bebidas.filter(b => b.id !== id);
  guardarBD();
  renderListaBebidasAdmin();
}

function renderListaCocinaAdmin() {
  const cont = document.getElementById('admin-lista-cocina');
  cont.innerHTML = db.insumosCocina.map(i => `
    <div class="inner-card" style="display:flex; justify-content:space-between; align-items:center;">
      <div><strong>${i.nombre}</strong><br><small style="color:#64748b;">Stock Ideal: ${i.ideal} ${i.unidad}</small></div>
      <button class="btn-secondary" onclick="eliminarInsumo(${i.id})">🗑️</button>
    </div>
  `).join('');
}

function agregarNuevoInsumo(e) {
  e.preventDefault();
  const nombre = document.getElementById('nuevo-insumo-nombre').value;
  const unidad = document.getElementById('nuevo-insumo-unidad').value;
  const ideal = parseFloat(document.getElementById('nuevo-insumo-ideal').value) || 0;

  db.insumosCocina.push({ id: Date.now(), nombre, cantidad: 0, unidad, ideal });
  guardarBD();
  renderListaCocinaAdmin();
  e.target.reset();
}

function eliminarInsumo(id) {
  db.insumosCocina = db.insumosCocina.filter(i => i.id !== id);
  guardarBD();
  renderListaCocinaAdmin();
}

function renderListaChecklistAdmin() {
  const cont = document.getElementById('admin-lista-checklist');
  cont.innerHTML = db.tareasCocina.map(t => `
    <div class="inner-card" style="display:flex; justify-content:space-between; align-items:center;">
      <div><strong>${t.tarea}</strong></div>
      <button class="btn-secondary" onclick="eliminarTarea(${t.id})">🗑️</button>
    </div>
  `).join('');
}

function agregarNuevaTarea(e) {
  e.preventDefault();
  const tarea = document.getElementById('nueva-tarea-nombre').value.trim();

  db.tareasCocina.push({ id: Date.now(), tarea });
  guardarBD();
  renderListaChecklistAdmin();
  e.target.reset();
}

function eliminarTarea(id) {
  db.tareasCocina = db.tareasCocina.filter(t => t.id !== id);
  guardarBD();
  renderListaChecklistAdmin();
}

function renderListaUsuariosAdmin() {
  const cont = document.getElementById('admin-lista-usuarios');
  cont.innerHTML = db.usuarios.map((u, index) => `
    <div class="inner-card" style="display:flex; justify-content:space-between; align-items:center;">
      <div><strong>${u.usuario}</strong> (${u.rol})<br><small style="color:#64748b;">PIN: ${u.pin}</small></div>
      ${u.usuario !== 'admin' ? `<button class="btn-secondary" onclick="eliminarUsuario(${index})">🗑️</button>` : ''}
    </div>
  `).join('');
}

function agregarNuevoUsuario(e) {
  e.preventDefault();
  const usuario = document.getElementById('nuevo-user-nombre').value.trim();
  const pin = document.getElementById('nuevo-user-pin').value.trim();
  const rol = document.getElementById('nuevo-user-rol').value;

  db.usuarios.push({ usuario, pin, rol });
  guardarBD();
  renderListaUsuariosAdmin();
  e.target.reset();
}

function eliminarUsuario(index) {
  db.usuarios.splice(index, 1);
  guardarBD();
  renderListaUsuariosAdmin();
}

// --- MÓDULO ENCARGADA ---
function cargarAperturaEncargada() {
  document.getElementById('encargada-step-apertura').classList.remove('hidden');
  document.getElementById('encargada-step-operacion').classList.add('hidden');
  document.getElementById('encargada-step-cierre').classList.add('hidden');

  const cont = document.getElementById('lista-apertura-bebidas');
  cont.innerHTML = db.bebidas.map(b => `
    <div class="form-group">
      <label>${b.nombre} (Debe haber: ${b.stock}):</label>
      <input type="number" id="apertura-bebida-${b.id}" value="${b.stock}">
    </div>
  `).join('');
}

function validarYGuardarApertura() {
  let descuadres = [];
  db.inventarioInicialTurno = {};

  db.bebidas.forEach(b => {
    const cantInicial = parseInt(document.getElementById(`apertura-bebida-${b.id}`).value) || 0;
    db.inventarioInicialTurno[b.id] = cantInicial;

    if (cantInicial !== b.stock) {
      descuadres.push(`${b.nombre}: Sistema tenía ${b.stock}, pero física es ${cantInicial}`);
    }
  });

  if (descuadres.length > 0) {
    alert("⚠️ Se registraron los siguientes descuadres al iniciar:\n" + descuadres.join('\n'));
  }

  const select = document.getElementById('entrada-bebida-id');
  select.innerHTML = db.bebidas.map(b => `<option value="${b.id}">${b.nombre}</option>`).join('');

  db.gastosTurnoActual = [];
  db.entradasBebidasTurno = {};

  document.getElementById('encargada-step-apertura').classList.add('hidden');
  document.getElementById('encargada-step-operacion').classList.remove('hidden');
}

function registrarGasto(e) {
  e.preventDefault();
  const concepto = document.getElementById('gasto-concepto').value;
  const valor = parseFloat(document.getElementById('gasto-valor').value) || 0;
  const cuenta = document.getElementById('gasto-cuenta').value;

  db.gastosTurnoActual.push({ concepto, valor, cuenta });
  alert(`✅ Gasto registrado ($${valor.toLocaleString()})`);
  e.target.reset();
}

function registrarEntradaBebida(e) {
  e.preventDefault();
  const bId = document.getElementById('entrada-bebida-id').value;
  const cant = parseInt(document.getElementById('entrada-bebida-cant').value) || 0;

  if (!db.entradasBebidasTurno[bId]) db.entradasBebidasTurno[bId] = 0;
  db.entradasBebidasTurno[bId] += cant;

  alert(`✅ Registrada entrada de +${cant} unidades`);
  e.target.reset();
}

function irACierreTurno() {
  document.getElementById('encargada-step-operacion').classList.add('hidden');
  document.getElementById('encargada-step-cierre').classList.remove('hidden');

  const cont = document.getElementById('lista-cierre-bebidas');
  cont.innerHTML = db.bebidas.map(b => {
    const inicial = db.inventarioInicialTurno[b.id] || 0;
    const entradas = db.entradasBebidasTurno[b.id] || 0;
    const totalEsperadoSinVentas = inicial + entradas;

    return `
      <div class="form-group">
        <label>${b.nombre} (Stock Disponible + Entradas = ${totalEsperadoSinVentas}):</label>
        <input type="number" id="cierre-bebida-${b.id}" placeholder="Cantidad final física">
      </div>
    `;
  }).join('');
}

function volverAOperacion() {
  document.getElementById('encargada-step-cierre').classList.add('hidden');
  document.getElementById('encargada-step-operacion').classList.remove('hidden');
}

function generarReporteCierre() {
  const efec = parseFloat(document.getElementById('cierre-efectivo').value) || 0;
  const neq = parseFloat(document.getElementById('cierre-nequi').value) || 0;
  const ban = parseFloat(document.getElementById('cierre-bancolombia').value) || 0;
  const totalReportadoDinero = efec + neq + ban;

  let dineroVentaBebidas = 0;
  let resumenBebidasMsg = "";

  db.bebidas.forEach(b => {
    const inicial = db.inventarioInicialTurno[b.id] || 0;
    const entradas = db.entradasBebidasTurno[b.id] || 0;
    const finalFisico = parseInt(document.getElementById(`cierre-bebida-${b.id}`).value) || 0;

    const vendidas = (inicial + entradas) - finalFisico;
    const totalVentaBebida = vendidas * b.precio;
    dineroVentaBebidas += totalVentaBebida;

    resumenBebidasMsg += `• ${b.nombre}: Quedan ${finalFisico} (Vendidas: ${vendidas} = $${totalVentaBebida.toLocaleString()})\n`;

    b.stock = finalFisico;
  });

  const totalGastos = db.gastosTurnoActual.reduce((acc, g) => acc + g.valor, 0);
  const dineroEsperadoCaja = dineroVentaBebidas - totalGastos;
  const diferenciaDineraria = totalReportadoDinero - dineroEsperadoCaja;

  let estadoCajaMsg = "";
  if (diferenciaDineraria === 0) {
    estadoCajaMsg = "✅ CAJA CUADRADA EXACTA";
  } else if (diferenciaDineraria > 0) {
    estadoCajaMsg = `🟢 SOBRANTE EN CAJA: +$${diferenciaDineraria.toLocaleString()}`;
  } else {
    estadoCajaMsg = `🔴 DESCUADRE / FALTANTE: -$${Math.abs(diferenciaDineraria).toLocaleString()}`;
  }

  const observaciones = document.getElementById('encargada-observaciones').value.trim();

  const fechaActual = new Date();
  const hoyFecha = fechaActual.toLocaleDateString();
  const isoMes = fechaActual.toISOString().substring(0, 7);

  db.movimientos.push({
    fecha: `${fechaActual.toLocaleDateString('es-CO', { weekday: 'long' })} (${hoyFecha})`,
    fechaRaw: hoyFecha,
    isoDate: isoMes,
    diaSemanaIndex: fechaActual.getDay(),
    ingresos: { Efectivo: efec, Nequi: neq, Bancolombia: ban },
    gastos: [...db.gastosTurnoActual]
  });

  guardarBD();

  let msg = `*📊 CIERRE Y AUDITORÍA - LOS CHAMOS*\n📅 ${hoyFecha}\n\n`;
  msg += `*🥤 INVENTARIO Y VENTAS DE BEBIDAS:*\n${resumenBebidasMsg}\n`;
  msg += `*💵 AUDITORÍA FINANCIERA:*\n`;
  msg += `- Total Ventas Bebidas: $${dineroVentaBebidas.toLocaleString()}\n`;
  msg += `- Total Gastos del Turno: -$${totalGastos.toLocaleString()}\n`;
  msg += `- Dinero que DEBE HABER: $${dineroEsperadoCaja.toLocaleString()}\n`;
  msg += `- Dinero REPORTADO: $${totalReportadoDinero.toLocaleString()}\n`;
  msg += `  (Efectivo: $${efec.toLocaleString()} | Nequi: $${neq.toLocaleString()} | Bancolombia: $${ban.toLocaleString()})\n`;
  msg += `👉 *ESTADO DE CAJA:* ${estadoCajaMsg}\n\n`;

  msg += `*💸 DETALLE GASTOS:*\n`;
  if (db.gastosTurnoActual.length === 0) {
    msg += `- Sin gastos registrados.\n`;
  } else {
    db.gastosTurnoActual.forEach(g => {
      msg += `- ${g.concepto}: $${g.valor.toLocaleString()} (${g.cuenta})\n`;
    });
  }

  if (observaciones !== "") {
    msg += `\n*📝 OBSERVACIONES / NOVEDADES:*\n${observaciones}\n`;
  }

  const url = `https://wa.me/${NUMERO_WHATSAPP}?text=${encodeURIComponent(msg)}`;
  window.open(url, '_blank');
  cerrarSesion();
}

// --- MÓDULO COCINA ---
function cargarModuloCocina() {
  const contChecklist = document.getElementById('lista-checklist-cocina');
  if (db.tareasCocina.length === 0) {
    contChecklist.innerHTML = `<p style="font-size:0.8rem; color:#94a3b8;">No hay tareas programadas.</p>`;
  } else {
    contChecklist.innerHTML = db.tareasCocina.map(t => `
      <label class="checkbox-item">
        <input type="checkbox" id="tarea-check-${t.id}">
        <span>${t.tarea}</span>
      </label>
    `).join('');
  }

  const contInsumos = document.getElementById('lista-cocina');
  contInsumos.innerHTML = db.insumosCocina.map(i => `
    <div class="inner-card">
      <label><strong>${i.nombre}</strong> (Ideal: ${i.ideal} ${i.unidad})</label>
      <input type="number" id="cocina-cant-${i.id}" value="${i.cantidad}" placeholder="Hay en cocina">
    </div>
  `).join('');
}

function generarReporteCocina() {
  let msg = `*🥬 INVENTARIO Y PREPARACIÓN COCINA - LOS CHAMOS*\n📅 Fecha: ${new Date().toLocaleDateString()}\n\n`;

  let tareasCompletadas = [];
  let tareasPendientes = [];
  db.tareasCocina.forEach(t => {
    const chk = document.getElementById(`tarea-check-${t.id}`);
    if (chk && chk.checked) {
      tareasCompletadas.push(`✅ ${t.tarea}`);
    } else {
      tareasPendientes.push(`❌ ${t.tarea}`);
    }
  });

  msg += `*📋 TAREAS Y PREPARACIONES:*\n`;
  if (tareasCompletadas.length > 0) msg += tareasCompletadas.join('\n') + '\n';
  if (tareasPendientes.length > 0) msg += tareasPendientes.join('\n') + '\n';
  msg += `\n`;

  let disponibles = [];
  let compras = [];

  db.insumosCocina.forEach(i => {
    const cantActual = parseFloat(document.getElementById(`cocina-cant-${i.id}`).value) || 0;
    i.cantidad = cantActual;
    
    disponibles.push(`• ${i.nombre}: ${cantActual} ${i.unidad}`);

    if (cantActual < i.ideal) {
      const faltante = i.ideal - cantActual;
      compras.push(`• Comprar ${faltante} ${i.unidad} de ${i.nombre}`);
    }
  });

  const observaciones = document.getElementById('cocina-observaciones').value.trim();

  msg += `*📦 STOCK DISPONIBLE HOY:*\n` + disponibles.join('\n') + `\n\n`;
  msg += `*🛒 COMPRAS SUGERIDAS:* \n` + (compras.length > 0 ? compras.join('\n') : '✅ Stock completo.') + `\n\n`;

  if (observaciones !== "") {
    msg += `*📝 OBSERVACIONES / NOVEDADES:*\n${observaciones}\n`;
  }

  guardarBD();

  const url = `https://wa.me/${NUMERO_WHATSAPP}?text=${encodeURIComponent(msg)}`;
  window.open(url, '_blank');
  cerrarSesion();
}
