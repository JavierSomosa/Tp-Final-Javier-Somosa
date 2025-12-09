function loginRapido() {
    document.getElementById("login-email").value = "admin@admin.com";
    document.getElementById("login-pass").value = "1234";
}

async function login() {
    const email = document.getElementById("login-email").value.trim();
    const pass = document.getElementById("login-pass").value.trim();

    if (!email || !pass) {
      mostrarError("Completá ambos campos");
      return;
    }

    try {
        const formData = new URLSearchParams();
        formData.append('email', email);
        formData.append('password', pass);
        
        // Determinar la URL del backend
        // Si estamos en Live Server (cualquier puerto que no sea 3000), usar localhost:3000
        // Si no, usar ruta relativa (mismo servidor)
        const currentPort = window.location.port;
        const isLiveServer = currentPort && currentPort !== "3000" && (currentPort.startsWith("55") || currentPort.startsWith("8080") || currentPort.startsWith("8000"));
        const backendUrl = isLiveServer 
          ? `${window.location.protocol}//${window.location.hostname}:3000`
          : "";
        
        const response = await fetch(`${backendUrl}/admin/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: formData,
            credentials: 'include' // Incluir cookies de sesión
        });
        
        console.log("Response status:", response.status);
        const contentType = response.headers.get("content-type") || "";
        console.log("Content-Type:", contentType);
        
        // Si la respuesta es JSON (cross-origin request)
        if (contentType.includes("application/json")) {
            const data = await response.json();
            console.log("Response JSON:", data);
            
            if (data.success) {
                // Login exitoso
                console.log("Login exitoso, redirigiendo...");
                window.location.href = `${backendUrl}${data.redirectUrl || '/admin/dashboard'}`;
            } else {
                // Error en login
                mostrarError(data.error || "Error al iniciar sesión");
            }
        } 
        // Si la respuesta es HTML (mismo origen, redirect)
        else if (response.status === 302 || response.status === 301) {
            console.log("Redirección detectada, login exitoso");
            window.location.href = `${backendUrl}/admin/dashboard`;
        }
        // Si la respuesta es HTML con error
        else if (contentType.includes("text/html")) {
            const html = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const errorElement = doc.querySelector('.error');
            
            if (errorElement && errorElement.textContent.trim()) {
                const errorMsg = errorElement.textContent.trim();
                console.log("Error en HTML:", errorMsg);
                mostrarError(errorMsg);
            } else {
                // Si no hay error, asumir éxito y redirigir
                console.log("No se encontró error, redirigiendo al dashboard...");
                window.location.href = `${backendUrl}/admin/dashboard`;
            }
        } 
        // Cualquier otra respuesta 2xx es éxito
        else if (response.status >= 200 && response.status < 300) {
            console.log("Response OK, redirigiendo...");
            window.location.href = `${backendUrl}/admin/dashboard`;
        } 
        // Error
        else {
            console.log("Error - Status:", response.status);
            const text = await response.text().catch(() => "Sin detalles");
            console.log("Response text:", text.substring(0, 200));
            mostrarError("Error al iniciar sesión. Status: " + response.status);
        }
    } catch (error) {
        console.error("Error en login:", error);
        mostrarError("Error al conectar con el servidor. Asegurate de que el servidor esté corriendo en el puerto 3000. Error: " + error.message);
    }
}

function mostrarError(msg) {
    const error = document.getElementById("login-error");
    error.textContent = msg;
}

