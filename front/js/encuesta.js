// Detectar si usamos 3000 o Live Server
const currentPort = window.location.port;
const isLiveServer =
  currentPort &&
  currentPort !== "3000" &&
  (currentPort.startsWith("55") ||
    currentPort.startsWith("8080") ||
    currentPort.startsWith("8000"));

const API_BASE = isLiveServer
  ? `${window.location.protocol}//${window.location.hostname}:3000/api`
: "/api";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("encuestaForm");
  const modal = document.getElementById("modal");
  const cerrarModal = document.getElementById("cerrarModal");
  const omitir = document.getElementById("omitir");

  const slider = document.getElementById("slider");
  const sliderValue = document.getElementById("sliderValue");

  slider.addEventListener("input", () => {
    sliderValue.textContent = slider.value;
  });

  // Omitir encuesta
  omitir.addEventListener("click", () => {
    window.location.href = "index.html";
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(form);

    try {
      const res = await fetch(`${API_BASE}/encuestas`, {
        method: "POST",
        body: fd
      });

      const data = await res.json();

      if (!res.ok) {
        alert("Error: " + (data.error || "No se pudo enviar la encuesta"));
        return;
      }

      modal.style.display = "block";

    } catch (error) {
      alert("Error al conectar con el servidor.");
      console.error(error);
    }
  });

  cerrarModal.addEventListener("click", () => {
    modal.style.display = "none";
    window.location.href = "index.html";
  });
});