function entrar() {
  const nombre = document.getElementById("nombreUsuario").value.trim();

  if (!nombre) {
    mostrarError("Escribí tu nombre para continuar");
    return;
  }

  // Guardamos el nombre
  localStorage.setItem("nombreUsuario", nombre);

  // Vamos a la pantalla de productos
  window.location.href = "productos.html";
}

// Nombre de usuario en la barra superior derecha (mejorar estilo)
function mostrarNombreEnTopbar() {
  const spanUsuario = document.getElementById("nombre-usuario");
  if (!spanUsuario) return;

  const nombre = localStorage.getItem("nombreUsuario");
  spanUsuario.textContent = nombre ? nombre : "Invitado";
}

const CONTRASEÑA_ADMIN = "1234"; //contraseña del admin

function mostrarError(msg) {
    const error = document.getElementById("login-error");
    error.textContent = msg;
}

function abrirAdmin() {
  const contraseña = prompt("Ingresá la contraseña de administrador:");

  if (contraseña === CONTRASEÑA_ADMIN) {
    localStorage.setItem("admin", "true");
    window.location.href = "admin.html";
  } else {
    mostrarError("Contraseña incorrecta");
    
  }
}


document.addEventListener("DOMContentLoaded", () => {
  const temaGuardado = localStorage.getItem("tema") || "claro";

  if (temaGuardado === "oscuro") {
    document.body.classList.add("dark");
  }

  // activar botón si existe
  const boton = document.getElementById("toggle-theme");
  if (boton) {
    boton.addEventListener("click", () => {
      document.body.classList.toggle("dark");

      // guardo el tema elegido
      localStorage.setItem(
        "tema",
        document.body.classList.contains("dark") ? "oscuro" : "claro"
      );
    });
  }
});