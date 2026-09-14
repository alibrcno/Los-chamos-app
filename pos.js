// --- COMPLEMENTO POS & GESTIÓN DE VENTAS Y DOMICILIOS ---
function agregarAlCarrito(productoId) {
  const prod = db.catalogoPOS.find(p => p.id === productoId);
  if (!prod) return;

  const enCarrito = db.carritoPOS.find(i => i.id === productoId);
  if (enCarrito) enCarrito.cantidad++;
  else db.carritoPOS.push({ ...prod, cantidad: 1 });

  renderCarritoPOS();
}

function renderCarritoPOS() {
  const cont = document.getElementById('pos-lista-carrito');
  const totEl = document.getElementById('pos-total-monto');
  if (!cont || !totEl) return;

  let total = 0;
  cont.innerHTML = db.carritoPOS.map((item, index) => {
    const subtotal = item.precio * item.cantidad;
    total += subtotal;
    return `
      <div class="daily-row">
        <div>
          <strong>${item.nombre}</strong><br>
          <small>${item.cantidad} x $${item.precio.toLocaleString()}</small>
        </div>
        <div>
          <span>$${subtotal.toLocaleString()}</span>
          <button class="btn-secondary" onclick="eliminarDelCarrito(${index})" style="padding:2px 6px; margin-left:5px;">❌</button>
        </div>
      </div>
    `;
  }).join('');

  totEl.innerText = `$${total.toLocaleString()}`;
}

function eliminarDelCarrito(index) {
  db.carritoPOS.splice(index, 1);
  renderCarritoPOS();
}

function registrarVentaPOS(metodoPago) {
  if (db.carritoPOS.length === 0) {
    alert("⚠️ El carrito está vacío");
    return;
  }

  const totalVenta = db.carritoPOS.reduce((acc, i) => acc + (i.precio * i.cantidad), 0);
  const hoyFecha = new Date().toLocaleDateString();
  
  let movHoy = db.movimientos.find(m => m.fechaRaw === hoyFecha);
  if (!movHoy) {
    const fechaActual = new Date();
    movHoy = {
      fecha: `${fechaActual.toLocaleDateString('es-CO', { weekday: 'long' })} (${hoyFecha})`,
      fechaRaw: hoyFecha,
      isoDate: fechaActual.toISOString().substring(0, 7),
      diaSemanaIndex: fechaActual.getDay(),
      ingresos: { Efectivo: 0, Nequi: 0, Bancolombia: 0, Datáfono: 0 },
      gastos: []
    };
    db.movimientos.push(movHoy);
  }

  movHoy.ingresos[metodoPago] = (movHoy.ingresos[metodoPago] || 0) + totalVenta;
  
  guardarBD();
  db.carritoPOS = [];
  renderCarritoPOS();
  alert(`✅ Venta cobrada por $${totalVenta.toLocaleString()} en ${metodoPago}`);
}
