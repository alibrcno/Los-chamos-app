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
  movimientos: JSON.parse(localStorage.getItem('chamos_movimientos')) || [
    { fecha: 'Lunes', ingresos: { Efectivo: 50000, Nequi: 0, Bancolombia: 0 }, gastos: [{ concepto: 'Hielo', valor: 10000, cuenta: 'Efectivo' }] }
  ],
  gastosTurnoActual: [],
  usuarioActual: null
};

// WhatsApp configurado al número directo
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

// --- PANEL ADMIN & SALDOS DE CUENTAS ---
function cargarAdminHub() {
  // Cálculo exacto de Saldos acumulados por cuenta
  let saldos = { Bancolombia: 0, Nequi: 0, Efectivo: 0 };

  db.movimientos.forEach(m => {
    // Sumar Ingresos
    if (m.ingresos) {
      saldos.Bancolombia += m.ingresos.Bancolombia || 0;
      saldos.Nequi += m.ingresos.Nequi || 0;
      saldos.Efectivo += m.ingresos.Efectivo || 0;
    }
    // Restar Gastos según la cuenta usada
    if (m.gastos) {
      m.gastos.forEach(g => {
        if (saldos[g.cuenta] !== undefined) {
          saldos[g.cuenta] -= g.valor;
        }
      });
    }
  });

  document.getElementById('saldo-bancolombia').innerText = `$${saldos.Bancolombia.toLocaleString()}`;
  document.getElementById('saldo-nequi').innerText = `$${saldos.Nequi.toLocaleString()}`;
  document.getElementById('saldo-efectivo').innerText = `$${saldos.Efectivo.toLocaleString()}`;

  // Vista Simple Diaria (Ej: Lunes - Ingresos: $X | Gastos: $Y)
  const contDiario = document.getElementById('lista-movimientos-diarios');
  if (db.movimientos.length === 0) {
    contDiario.innerHTML = `<p style="font-size:0.8rem; color:#94a3b8;">Sin movimientos registrados esta semana.</p>`;
  } else {
    contDiario.innerHTML = db.movimientos.map(m => {
      const totIngresos = (m.ingresos.Efectivo || 0) + (m.ingresos.Nequi || 0) + (m.ingresos.Bancolombia || 0);
      const totGastos = (m.gastos || []).reduce((acc, g) => acc + g.valor, 0);
      return `
        <div class="daily-row">
          <div><strong>${m.fecha}</strong></div>
          <div>
            <span class="txt-green">Ingresos: $${totIngresos.toLocaleString()}</span> | 
            <span class="txt-red">Gastos: $${totGastos.toLocaleString()}</span>
          </div>
        </div>
      `;
    }).join('');
  }
}

// Sub-navegación dentro de Admin
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
  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
  if (vista === 'hub') {
    volverAdminHub();
  } else if (vista === 'bebidas') {
    verSubModuloAdmin('bebidas');
  } else if (vista === 'cocina') {
    verSubModuloAdmin('cocina');
  }
}

// RENDER Y GESTIÓN BEBIDAS / COCINA / USUARIOS
function renderListaBebidasAdmin() {
  const cont = document.getElementById('admin-lista-bebidas');
  cont.innerHTML = db.bebidas.map(b => `
    <div class="inner-card" style="display:flex; justify-content:space-between; align-items:center;">
      <div>
        <strong>${b.nombre}</strong><br>
        <small style="color:#64748b;">Precio: $${b.precio.toLocaleString()} | Stock: ${b.stock} unds</small>
      </div>
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
      <div>
        <strong>${i.nombre}</strong><br>
        <small style="color:#64748b;">Stock Ideal: ${i.ideal} ${i.unidad}</small>
      </div>
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
      <div>
        <strong>${u.usuario}</strong> (${u.rol})<br>
        <small style="color:#64748b;">PIN: ${u.pin}</small>
      </div>
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

// --- MÓDULO ENCARGADA Y GASTOS CON DESCUENTO DE CUENTA ---
function registrarGasto(e) {
  e.preventDefault();
  const concepto = document.getElementById('gasto-concepto').value;
  const valor = parseFloat(document.getElementById('gasto-valor').value) || 0;
  const cuenta = document.getElementById('gasto-cuenta').value;

  db.gastosTurnoActual.push({ concepto, valor, cuenta });
  alert(`✅ Gasto registrado y descontado de ${cuenta}`);
  e.target.reset();
}

function generarReporteCierre() {
  const efec = parseFloat(document.getElementById('cierre-efectivo').value) || 0;
  const neq = parseFloat(document.getElementById('cierre-nequi').value) || 0;
  const ban = parseFloat(document.getElementById('cierre-bancolombia').value) || 0;

  const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const hoyNombre = dias[new Date().getDay()];

  db.movimientos.push({
    fecha: `${hoyNombre} (${new Date().toLocaleDateString()})`,
    ingresos: { Efectivo: efec, Nequi: neq, Bancolombia: ban },
    gastos: [...db.gastosTurnoActual]
  });

  guardarBD();

  let msg = `*📊 CIERRE Y RECAUDO - LOS CHAMOS*\n📅 ${hoyNombre} ${new Date().toLocaleDateString()}\n\n`;
  msg += `*💰 INGRESOS:*\n- Efectivo: $${efec.toLocaleString()}\n- Nequi: $${neq.toLocaleString()}\n- Bancolombia: $${ban.toLocaleString()}\n\n`;
  msg += `*💸 GASTOS:*\n`;
  db.gastosTurnoActual.forEach(g => {
    msg += `- ${g.concepto}: $${g.valor.toLocaleString()} (${g.cuenta})\n`;
  });

  db.gastosTurnoActual = [];

  const url = `https://wa.me/${NUMERO_WHATSAPP}?text=${encodeURIComponent(msg)}`;
  window.open(url, '_blank');
  cerrarSesion();
}

// --- MÓDULO COCINA Y COMPRAS SEGÚN STOCK SUGERIDO ---
function cargarInsumosCocina() {
  const cont = document.getElementById('lista-cocina');
  cont.innerHTML = db.insumosCocina.map(i => `
    <div class="inner-card">
      <label><strong>${i.nombre}</strong> (Sugerido Ideal: ${i.ideal} ${i.unidad})</label>
      <input type="number" id="cocina-cant-${i.id}" value="${i.cantidad}" placeholder="Hay en cocina">
    </div>
  `).join('');
}

function generarListaCompras() {
  let msg = `*🛒 LISTA DE COMPRAS COCINA - LOS CHAMOS*\n📅 Fecha: ${new Date().toLocaleDateString()}\n\n`;
  let lista = [];

  db.insumosCocina.forEach(i => {
    const cantActual = parseFloat(document.getElementById(`cocina-cant-${i.id}`).value) || 0;
    i.cantidad = cantActual;
    if (cantActual < i.ideal) {
      const faltante = i.ideal - cantActual;
      lista.push(`• ${faltante} ${i.unidad} de ${i.nombre}`);
    }
  });

  if (lista.length > 0) {
    msg += `*FALTANTES Y PEDIDO:* \n` + lista.join('\n');
  } else {
    msg += `✅ Stock completo en cocina.`;
  }

  guardarBD();

  const url = `https://wa.me/${NUMERO_WHATSAPP}?text=${encodeURIComponent(msg)}`;
  window.open(url, '_blank');
  cerrarSesion();
}
