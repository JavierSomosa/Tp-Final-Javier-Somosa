// Configuración de la API
// Si estamos en Live Server (cualquier puerto que no sea 3000), usar localhost:3000
// Si no, usar ruta relativa (mismo servidor)
const currentPort = window.location.port;
const isLiveServer = currentPort && currentPort !== "3000" && (currentPort.startsWith("55") || currentPort.startsWith("8080") || currentPort.startsWith("8000"));
const API_BASE = isLiveServer 
  ? `${window.location.protocol}//${window.location.hostname}:3000/api`
  : "/api";

let productosActuales = [];
let filtros = {
  tipo: null,
  activo: "true", // Por defecto solo productos activos
};
let paginaActual = 1;
const productosPorPagina = 10;

// Función para obtener productos desde la API
async function obtenerProductos() {
  try {
    const params = new URLSearchParams({
      activo: filtros.activo ? "true" : "false",
      page: paginaActual,
      limit: productosPorPagina,
    });

    if (filtros.tipo) {
      params.append("tipo", filtros.tipo);
    }

    const response = await fetch(`${API_BASE}/productos?${params}`);
    if (!response.ok) {
      throw new Error("Error al obtener productos");
    }

    const resultado = await response.json();
    productosActuales = resultado.data;
    return resultado;
  } catch (error) {
    console.error("Error:", error);
    document.getElementById("lista-productos").innerHTML =
      "<p>Error al cargar productos. Asegurate de que el servidor esté corriendo.</p>";
    return null;
  }
}

function renderProductos(lista) {
  const cont = document.getElementById("lista-productos");
  cont.innerHTML = "";

  if (lista.length === 0) {
    cont.innerHTML = "<p>No hay productos disponibles.</p>";
    return;
  }

  lista.forEach((p) => {
    // Usar el campo 'image' de la BD o una imagen por defecto
    // Las imágenes subidas se guardan como /public/images/... y el servidor las sirve desde /public
    let imagenSrc = p.image || "images/foto-productos/portada-default.jpg";
    // Si la imagen empieza con /public, mantenerla así (servidor Node.js)
    // Si no, usar ruta relativa (Live Server)
    if (imagenSrc.startsWith("/public")) {
      // Ruta absoluta para servidor Node.js
      imagenSrc = imagenSrc;
    } else if (!imagenSrc.startsWith("/") && !imagenSrc.startsWith("http") && !imagenSrc.startsWith("images")) {
      // Si no tiene ruta, agregar /public/images/
      imagenSrc = "/public/images/" + imagenSrc;
    }
    
    cont.innerHTML += `
      <article class="card-producto">
        <img src="${imagenSrc}" alt="${p.titulo}" onclick="verDetalle(${p.id})" style="cursor: pointer;" onerror="this.src='images/foto-productos/portada-default.jpg'">
        <h3 onclick="verDetalle(${p.id})" style="cursor: pointer;">${p.titulo}</h3>
        <p>${p.descripcion || "Sin descripción"}</p>
        <p><strong>Precio: $${p.precio || 0}</strong></p>
        <div style="display: flex; gap: 10px; margin-top: 10px;">
          <button onclick="verDetalle(${p.id})" style="flex: 1; padding: 8px; background-color: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer;">Ver Detalle</button>
          <button onclick="agregarAlCarrito(${p.id}, '${p.titulo}', ${p.precio})" style="flex: 1; padding: 8px; background-color: #28a745; color: white; border: none; border-radius: 5px; cursor: pointer;">Agregar</button>
        </div>
      </article>
    `;
  });
}

function renderPaginacion(totalPages) {
  const cont = document.getElementById("paginacion");
  if (!cont) return;

  cont.innerHTML = "";

  if (totalPages <= 1) return;

  if (paginaActual > 1) {
    cont.innerHTML += `<button onclick="cambiarPagina(${paginaActual - 1})">Anterior</button>`;
  }

  for (let i = 1; i <= totalPages; i++) {
    if (i === paginaActual) {
      cont.innerHTML += `<span style="margin: 0 10px; font-weight: bold;">${i}</span>`;
    } else {
      cont.innerHTML += `<button onclick="cambiarPagina(${i})" style="margin: 0 5px;">${i}</button>`;
    }
  }

  if (paginaActual < totalPages) {
    cont.innerHTML += `<button onclick="cambiarPagina(${paginaActual + 1})">Siguiente</button>`;
  }
}

async function cambiarPagina(nuevaPagina) {
  paginaActual = nuevaPagina;
  await cargarProductos();
}

async function filtrar(tipo) {
  filtros.tipo = tipo;
  paginaActual = 1; // Resetear a primera página al filtrar
  await cargarProductos();
}

async function cargarProductos() {
  const resultado = await obtenerProductos();
  if (resultado) {
    renderProductos(productosActuales);
    renderPaginacion(resultado.totalPages);
  }
}

function verDetalle(id) {
  // Usar parámetros de URL en lugar de localStorage
  window.location.href = `detalle.html?id=${id}`;
}

function agregarAlCarrito(id, titulo, precio) {
  const carrito = JSON.parse(localStorage.getItem("carrito")) || [];
  
  const existente = carrito.find(item => item.id === id);
  
  if (existente) {
    existente.cantidad += 1;
  } else {
    carrito.push({
      id: id,
      titulo: titulo,
      precio: precio,
      cantidad: 1
    });
  }
  
  localStorage.setItem("carrito", JSON.stringify(carrito));
  
  // Mostrar notificación
  const notif = document.createElement("div");
  notif.textContent = "Producto agregado al carrito";
  notif.style.cssText = "position: fixed; top: 20px; right: 20px; background: #28a745; color: white; padding: 15px 20px; border-radius: 5px; z-index: 1000; box-shadow: 0 2px 10px rgba(0,0,0,0.2);";
  document.body.appendChild(notif);
  
  setTimeout(() => {
    notif.remove();
  }, 2000);
}

// Inicialización cuando carga la página
document.addEventListener("DOMContentLoaded", async () => {
  mostrarNombreEnTopbar();
  await cargarProductos();
});
