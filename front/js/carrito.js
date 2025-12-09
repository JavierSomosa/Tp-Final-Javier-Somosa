// Configuración de la API
// Si estamos en Live Server (cualquier puerto que no sea 3000), usar localhost:3000
// Si no, usar ruta relativa (mismo servidor)
const currentPort = window.location.port;
const isLiveServer = currentPort && currentPort !== "3000" && (currentPort.startsWith("55") || currentPort.startsWith("8080") || currentPort.startsWith("8000"));
const API_BASE = isLiveServer 
  ? `${window.location.protocol}//${window.location.hostname}:3000/api`
  : "/api";

let carrito = [];

function cargarCarrito() {
  mostrarNombreEnTopbar();
  carrito = JSON.parse(localStorage.getItem("carrito")) || [];

  const tbody = document.getElementById("carrito-body");
  const spanTotal = document.getElementById("carrito-total");

  tbody.innerHTML = "";
  let total = 0;

  if (carrito.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 20px;">El carrito está vacío</td></tr>`;
    spanTotal.textContent = "0";
    return;
  }

  carrito.forEach((item, index) => {
    const subtotal = item.precio * item.cantidad;
    total += subtotal;

    tbody.innerHTML += `
      <tr>
        <td style="padding:8px; border-bottom:1px solid #eee;">${item.titulo}</td>
        <td style="padding:8px; border-bottom:1px solid #eee;">$${item.precio}</td>
        <td style="padding:8px; border-bottom:1px solid #eee;">
          <button onclick="cambiarCantidad(${index}, -1)" style="padding: 2px 8px;">-</button>
          ${item.cantidad}
          <button onclick="cambiarCantidad(${index}, 1)" style="padding: 2px 8px;">+</button>
        </td>
        <td style="padding:8px; border-bottom:1px solid #eee;">$${subtotal}</td>
        <td style="padding:8px; border-bottom:1px solid #eee;">
          <button onclick="eliminar(${index})">Eliminar</button>
        </td>
      </tr>
    `;
  });

  spanTotal.textContent = total.toFixed(2);
}

function cambiarCantidad(index, delta) {
  carrito[index].cantidad += delta;
  if (carrito[index].cantidad < 1) {
    carrito[index].cantidad = 1;
  }
  localStorage.setItem("carrito", JSON.stringify(carrito));
  cargarCarrito();
}

function eliminar(index) {
  carrito.splice(index, 1);
  localStorage.setItem("carrito", JSON.stringify(carrito));
  cargarCarrito();
}

function mostrarModalConfirmacion() {
  if (carrito.length === 0) {
    alert("El carrito está vacío");
    return;
  }
  document.getElementById("modal-confirmacion").style.display = "flex";
}

function cerrarModal() {
  document.getElementById("modal-confirmacion").style.display = "none";
}

async function confirmarCompra() {
  const clienteNombre = localStorage.getItem("nombreUsuario");
  
  if (!clienteNombre) {
    alert("Error: No se encontró el nombre del cliente");
    cerrarModal();
    return;
  }

  if (carrito.length === 0) {
    alert("El carrito está vacío");
    cerrarModal();
    return;
  }

  // Preparar los items para la API
  const items = carrito.map(item => ({
    productoId: item.id,
    cantidad: item.cantidad
  }));

  try {
    const response = await fetch(`${API_BASE}/ventas`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        clienteNombre,
        items,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Error al crear la venta");
    }

    const resultado = await response.json();
    
    // Guardar el ID de la venta para el ticket
    localStorage.setItem("ventaId", resultado.venta.id);
    
    // Limpiar el carrito
    localStorage.removeItem("carrito");
    
    // Redirigir al ticket
    window.location.href = `ticket.html?id=${resultado.venta.id}`;
  } catch (error) {
    console.error("Error:", error);
    alert("Error al finalizar la compra: " + error.message);
    cerrarModal();
  }
}

document.addEventListener("DOMContentLoaded", cargarCarrito);
