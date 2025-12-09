// Configuración de la API
// Si estamos en Live Server (cualquier puerto que no sea 3000), usar localhost:3000
// Si no, usar ruta relativa (mismo servidor)
const currentPort = window.location.port;
const isLiveServer = currentPort && currentPort !== "3000" && (currentPort.startsWith("55") || currentPort.startsWith("8080") || currentPort.startsWith("8000"));
const API_BASE = isLiveServer 
  ? `${window.location.protocol}//${window.location.hostname}:3000/api`
  : "/api";

let productoActual = null;
let cantidad = 1;

async function cargarDetalle() {
  mostrarNombreEnTopbar();

  // Obtener ID desde parámetros de la URL
  const urlParams = new URLSearchParams(window.location.search);
  let idSeleccionado = Number(urlParams.get("id"));
  
  // Si no está en la URL, intentar desde localStorage (compatibilidad)
  if (!idSeleccionado) {
    idSeleccionado = Number(localStorage.getItem("productoSeleccionado"));
  }

  if (!idSeleccionado) {
    document.body.innerHTML = "<p>No se seleccionó ningún producto.</p>";
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/productos/${idSeleccionado}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        document.body.innerHTML = "<p>Producto no encontrado.</p>";
        return;
      }
      throw new Error("Error al obtener el producto");
    }

    productoActual = await response.json();

    // Usar el campo 'image' de la BD o una imagen por defecto
    let imagenSrc = productoActual.image || "images/foto-productos/portada-default.jpg";
    // Si la imagen empieza con /public, mantenerla así (servidor Node.js)
    if (imagenSrc.startsWith("/public")) {
      // Ruta absoluta para servidor Node.js
      imagenSrc = imagenSrc;
    } else if (!imagenSrc.startsWith("/") && !imagenSrc.startsWith("http") && !imagenSrc.startsWith("images")) {
      // Si no tiene ruta, agregar /public/images/
      imagenSrc = "/public/images/" + imagenSrc;
    }
    
    document.getElementById("detalle-imagen").src = imagenSrc;
    document.getElementById("detalle-imagen").onerror = function() {
      this.src = "images/foto-productos/portada-default.jpg";
    };
    document.getElementById("detalle-titulo").textContent =
      productoActual.titulo || "Sin título";
    document.getElementById("detalle-descripcion").textContent =
      productoActual.descripcion || "Sin descripción";
    document.getElementById("detalle-precio").textContent =
      productoActual.precio || 0;
  } catch (error) {
    console.error("Error:", error);
    document.body.innerHTML =
      "<p>Error al cargar el producto. Asegurate de que el servidor esté corriendo.</p>";
  }
}

function cambiarCantidad(delta) {
  cantidad += delta;
  if (cantidad < 1) cantidad = 1;
  document.getElementById("detalle-cant").textContent = cantidad;
}

function comprar() {
  if (!productoActual) return;

  const carrito = JSON.parse(localStorage.getItem("carrito")) || [];

  const existente = carrito.find((item) => item.id === productoActual.id);

  if (existente) {
    existente.cantidad += cantidad;
  } else {
    carrito.push({
      id: productoActual.id,
      titulo: productoActual.titulo,
      precio: productoActual.precio,
      cantidad: cantidad,
    });
  }

  localStorage.setItem("carrito", JSON.stringify(carrito));

  mostrarNotif("Producto agregado al carrito")

}

function mostrarNotif(msg) {
    const error = document.getElementById("notif-add");
    error.textContent = msg;
}

document.addEventListener("DOMContentLoaded", cargarDetalle);
