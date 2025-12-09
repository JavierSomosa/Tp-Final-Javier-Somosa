// Configuración de la API
// Si estamos en Live Server (cualquier puerto que no sea 3000), usar localhost:3000
// Si no, usar ruta relativa (mismo servidor)
const currentPort = window.location.port;
const isLiveServer = currentPort && currentPort !== "3000" && (currentPort.startsWith("55") || currentPort.startsWith("8080") || currentPort.startsWith("8000"));
const API_BASE = isLiveServer 
  ? `${window.location.protocol}//${window.location.hostname}:3000/api`
  : "/api";

async function cargarTicket() {
  mostrarNombreEnTopbar();

  // Obtener el ID de la venta desde la URL o localStorage
  const urlParams = new URLSearchParams(window.location.search);
  const ventaId = urlParams.get("id") || localStorage.getItem("ventaId");

  if (!ventaId) {
    document.body.innerHTML = "<p>Error: No se encontró información de la venta.</p>";
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/ventas/${ventaId}`);
    
    if (!response.ok) {
      throw new Error("Error al obtener la venta");
    }

    const venta = await response.json();

    document.getElementById("ticket-usuario").textContent = venta.clienteNombre;

    const fecha = new Date(venta.fecha);
    document.getElementById("ticket-fecha").textContent =
      fecha.toLocaleString("es-AR");

    const ul = document.getElementById("ticket-lista");
    ul.innerHTML = "";

    venta.items.forEach((item) => {
      const li = document.createElement("li");
      li.textContent = `${item.cantidad} x ${item.titulo} ($${item.precioUnitario})`;
      ul.appendChild(li);
    });

    document.getElementById("ticket-total").textContent = venta.total.toFixed(2);
  } catch (error) {
    console.error("Error:", error);
    document.body.innerHTML = "<p>Error al cargar el ticket. Asegurate de que el servidor esté corriendo.</p>";
  }
}

function nuevaCompra() {
  localStorage.removeItem("carrito");
  localStorage.removeItem("totalCompra");
  localStorage.removeItem("ventaId");
  window.location.href = "index.html";
}

document.addEventListener("DOMContentLoaded", cargarTicket);

async function descargarPDF() {
  try {
    // Verificar que jsPDF esté cargado
    if (!window.jspdf) {
      alert("Error: La librería jsPDF no está cargada. Verificá tu conexión a internet.");
      return;
    }

    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({
      unit: "pt",
      format: "a4"
    });

    pdf.setFont("helvetica");
    let y = 40;

    // Obtener datos del ticket
    const usuario = document.getElementById("ticket-usuario").textContent || "Cliente";
    const fecha = document.getElementById("ticket-fecha").textContent || new Date().toLocaleString("es-AR");
    const total = document.getElementById("ticket-total").textContent || "0";

    const items = Array.from(document.querySelectorAll("#ticket-lista li"))
      .map(li => li.textContent);

    // Intentar cargar logo (pero no bloquear si falla)
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = "images/favicon/rabbit.png";

    // Función para generar el PDF (con o sin imagen)
    const generarPDF = () => {
      // Título
      pdf.setFontSize(28);
      pdf.text("BiblioLiebre", 40, y + 20);
      y += 50;

      // Datos del cliente
      pdf.setFontSize(14);
      pdf.text(`Cliente: ${usuario}`, 40, y); 
      y += 20;

      pdf.text(`Fecha: ${fecha}`, 40, y);
      y += 30;

      // Productos
      pdf.setFontSize(16);
      pdf.text("Productos:", 40, y);
      y += 20;

      pdf.setFontSize(12);
      if (items.length === 0) {
        pdf.text("No hay productos", 50, y);
        y += 18;
      } else {
        items.forEach(item => {
          // Si el texto es muy largo, dividirlo en líneas
          const maxWidth = 500;
          const lines = pdf.splitTextToSize(`• ${item}`, maxWidth);
          lines.forEach(line => {
            pdf.text(line, 50, y);
            y += 18;
          });
        });
      }

      y += 20;

      // Total
      pdf.setFontSize(16);
      pdf.setFont("helvetica", "bold");
      pdf.text(`Total: $${total}`, 40, y);

      // Guardar PDF
      const nombreArchivo = `Ticket-${usuario.replace(/\s+/g, "-")}-${Date.now()}.pdf`;
      pdf.save(nombreArchivo);
    };

    // Intentar agregar imagen, pero generar PDF de todas formas
    img.onload = () => {
      try {
        pdf.addImage(img, "PNG", 40, y, 60, 60);
        pdf.setFontSize(28);
        pdf.text("BiblioLiebre", 120, y + 40);
        y += 100;
      } catch (e) {
        console.log("No se pudo agregar la imagen al PDF:", e);
      }
      generarPDF();
    };

    img.onerror = () => {
      console.log("No se pudo cargar la imagen del logo, generando PDF sin imagen");
      generarPDF();
    };

    // Timeout por si la imagen tarda mucho
    setTimeout(() => {
      if (y === 40) {
        // Si todavía no se generó el PDF, generarlo sin imagen
        generarPDF();
      }
    }, 2000);

  } catch (error) {
    console.error("Error al generar PDF:", error);
    alert("Error al generar el PDF: " + error.message);
  }
}
