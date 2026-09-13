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
      cargarInsumosCocina();
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

// --- MÓDULO ADMIN ---
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

  const contDiario = document.getElementById('lista-movimientos-diarios');
  if (db.movimientos.length === 0) {
    contDiario.innerHTML = `<p style="font-size:0.8rem; color:#94a3b8;">Sin movimientos registrados.</p>`;
  } else {
    contDiario.innerHTML = db.movimientos.map(m => {
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

function verSubModuloAdmin(modulo) {
  document.getElementById('admin-view-hub').classList.add('hidden');
  document.getElementById('admin-view-bebidas').classList.add('hidden');
  document.getElementById('admin-view-cocina').classList.add('hidden');
  document.getElementById('admin-view-usuarios').classList.add('hidden');

  if (modulo === 'bebidas') {
    document.getElementById('admin-view-bebidas').classList.remove('hidden');
    renderListaBebidasAdmin();
  } else if (modulo === 'cocina') {
    document.getElementById('admin-view-cocina').classList.remove('hidden');
    renderListaCocinaAdmin();
  } else if (modulo === 'usuarios') {
    document.getElementById('admin-view-usuarios').classList.remove('hidden');
    renderListaUsuariosAdmin();
  }
}

function volverAdminHub() {
  document.getElementById('admin-view-bebidas').classList.add('hidden');
  document.getElementById('admin-view-cocina').classList.add('hidden');
  document.getElementById('admin-view-usuarios').classList.add('hidden');
  document.getElementById('admin-view-hub').classList.remove('hidden');
  cargarAdminHub();
}

function navegarBarra(vista) {
  if (vista === 'hub') volverAdminHub();
  else if (vista === 'bebidas') verSubModuloAdmin('bebidas');
  else if (vista === 'cocina') verSubModuloAdmin('cocina');
}

// Config Bebidas, Cocina y Usuarios
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

// --- MÓDULO ENCARGADA (APERTURA, OPERACIONES Y CIERRE) ---
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

  // Cargar selector de compras
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

  let dineroDebeHaberBebidas = 0;
  let resumenBebidasMsg = "";

  db.bebidas.forEach(b => {
    const inicial = db.inventarioInicialTurno[b.id] || 0;
    const entradas = db.entradasBebidasTurno[b.id] || 0;
    const finalFisico = parseInt(document.getElementById(`cierre-bebida-${b.id}`).value) || 0;

    const vendidas = (inicial + entradas) - finalFisico;
    const totalVentaBebida = vendidas * b.precio;
    dineroDebeHaberBebidas += totalVentaBebida;

    resumenBebidasMsg += `• ${b.nombre}: Quedan ${finalFisico} (Vendidas: ${vendidas} = $${totalVentaBebida.toLocaleString()})\n`;

    // Actualizar stock oficial para el próximo día
    b.stock = finalFisico;
  });

  const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const hoyNombre = dias[new Date().getDay()];

  db.movimientos.push({
    fecha: `${hoyNombre} (${new Date().toLocaleDateString()})`,
    ingresos: { Efectivo: efec, Nequi: neq, Bancolombia: ban },
    gastos: [...db.gastosTurnoActual]
  });

  guardarBD();

  let msg = `*📊 CIERRE Y AUDITORÍA - LOS CHAMOS*\n📅 ${hoyNombre} ${new Date().toLocaleDateString()}\n\n`;
  msg += `*🥤 INVENTARIO Y VENTAS DE BEBIDAS:*\n${resumenBebidasMsg}\n`;
  msg += `*💵 AUDITORÍA FINANCIERA:*\n`;
  msg += `- Dinero que DEBE HABER por Bebidas: $${dineroDebeHaberBebidas.toLocaleString()}\n`;
  msg += `- Dinero TOTAL REPORTADO: $${totalReportadoDinero.toLocaleString()}\n`;
  msg += `  (Efectivo: $${efec.toLocaleString()} | Nequi: $${neq.toLocaleString()} | Bancolombia: $${ban.toLocaleString()})\n\n`;

  msg += `*💸 GASTOS DEL TURNO:*\n`;
  if (db.gastosTurnoActual.length === 0) {
    msg += `- Sin gastos registrados.\n`;
  } else {
    db.gastosTurnoActual.forEach(g => {
      msg += `- ${g.concepto}: $${g.valor.toLocaleString()} (${g.cuenta})\n`;
    });
  }

  const url = `https://wa.me/${NUMERO_WHATSAPP}?text=${encodeURIComponent(msg)}`;
  window.open(url, '_blank');
  cerrarSesion();
}

// --- MÓDULO COCINA ---
function cargarInsumosCocina() {
  const cont = document.getElementById('lista-cocina');
  cont.innerHTML = db.insumosCocina.map(i => `
    <div class="inner-card">
      <label><strong>${i.nombre}</strong> (Ideal: ${i.ideal} ${i.unidad})</label>
      <input type="number" id="cocina-cant-${i.id}" value="${i.cantidad}" placeholder="Hay en cocina">
    </div>
  `).join('');
}

function generarReporteCocina() {
  let msg = `*🥬 INVENTARIO Y PEDIDO COCINA - LOS CHAMOS*\n📅 Fecha: ${new Date().toLocaleDateString()}\n\n`;
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
