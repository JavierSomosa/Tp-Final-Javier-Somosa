// Configuración de la API
// Si estamos en Live Server (cualquier puerto que no sea 3000), usar localhost:3000
// Si no, usar ruta relativa (mismo servidor)
const currentPort = window.location.port;
const isLiveServer = currentPort && currentPort !== "3000" && (currentPort.startsWith("55") || currentPort.startsWith("8080") || currentPort.startsWith("8000"));
const API_BASE = isLiveServer 
  ? `${window.location.protocol}//${window.location.hostname}:3000/api`
  : "/api";

let productos = [];
let productoSeleccionado = null;

async function cargarProductos() {
    try {
        const response = await fetch(`${API_BASE}/productos`);
        const resultado = await response.json();
        productos = resultado.data || [];
        refrescarTabla();
    } catch (error) {
        console.error("Error al cargar productos:", error);
        alert("Error al cargar productos. Asegurate de que el servidor esté corriendo.");
    }
}

function refrescarTabla() {
    const tbody = document.getElementById("admin-tbody");
    if (!tbody) return;
    
    tbody.innerHTML = "";

    if (productos.length === 0) {
        tbody.innerHTML = "<tr><td colspan='6' style='text-align: center; padding: 20px;'>No hay productos</td></tr>";
        return;
    }

    productos.forEach((p) => {
        const fila = document.createElement("tr");
        
        const fecha = new Date(p.fechaSalida).toLocaleDateString('es-AR');
        const estadoTexto = p.estado ? "Activo" : "Inactivo";
        const estadoClass = p.estado ? "estado-activo" : "estado-inactivo";

        fila.innerHTML = `
            <td>${p.id}</td>
            <td>${p.titulo}</td>
            <td>${p.tipo}</td>
            <td>$${p.precio}</td>
            <td>${fecha}</td>
            <td class="${estadoClass}">${estadoTexto}</td>
            <td>
                <button onclick="editarProducto(${p.id})" class="btn-edit">Editar</button>
                ${p.estado 
                    ? `<button onclick="confirmarBaja(${p.id})" class="btn-delete">Desactivar</button>`
                    : `<button onclick="confirmarActivar(${p.id})" class="btn-activate">Activar</button>`
                }
            </td>
        `;

        tbody.appendChild(fila);
    });
}

function alta() {
    window.location.href = "/admin/productos/crear";
}

async function confirmarBaja(id) {
    if (!confirm("¿Estás seguro de que deseas desactivar este producto?")) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/productos/${id}`, {
            method: "DELETE"
        });
        
        if (response.ok) {
            alert("Producto desactivado exitosamente");
            await cargarProductos();
        } else {
            const error = await response.json();
            alert("Error: " + (error.message || "Error al desactivar producto"));
        }
    } catch (error) {
        console.error("Error:", error);
        alert("Error al desactivar producto");
    }
}

async function confirmarActivar(id) {
    if (!confirm("¿Estás seguro de que deseas activar este producto?")) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/productos/${id}/activar`, {
            method: "PUT"
        });
        
        if (response.ok) {
            alert("Producto activado exitosamente");
            await cargarProductos();
        } else {
            const error = await response.json();
            alert("Error: " + (error.message || "Error al activar producto"));
        }
    } catch (error) {
        console.error("Error:", error);
        alert("Error al activar producto");
    }
}

function editarProducto(id) {
    window.location.href = `/admin/productos/editar/${id}`;
}

// Inicialización
document.addEventListener("DOMContentLoaded", async () => {
    // Verificar si estamos en la página admin.html (no en el dashboard EJS)
    if (document.getElementById("admin-tbody")) {
        await cargarProductos();
    }
});
