const express = require("express");
const app = express();
const path = require("path");
const fs = require("fs");
const port = 3000;
const session = require("express-session");
const bcrypt = require("bcryptjs");
const multer = require("multer");

// Asegurar que la carpeta de imágenes existe
const imagesDir = path.join(__dirname, "public", "images");
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
  console.log("Carpeta de imágenes creada:", imagesDir);
}

const Producto = require("./producto");
const Venta = require("./venta");
const VentaProducto = require("./ventaproducto");
const Usuario = require("./usuario");
const LogLogin = require("./logLogin");
const sequelize = require("./db");
const { Op } = require("sequelize");

// Configuración de vistas
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Configuración de multer para subida de imágenes
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "public", "images"));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
    cb(null, "producto-" + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error("Solo se permiten imágenes (jpeg, jpg, png, gif, webp)"));
    }
  }
});

// Configuración de sesiones
app.use(session({
  secret: "biblioLiebre-secret-key-2025",
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: false, // En producción usar true con HTTPS
    maxAge: 24 * 60 * 60 * 1000, // 24 horas
    sameSite: 'lax', // Permitir cookies desde otros puertos (Live Server)
    httpOnly: true
  }
}));

// Middlewares básicos
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS - Permitir peticiones desde el frontend
app.use((req, res, next) => {
  const origin = req.headers.origin;
  // Permitir desde localhost en cualquier puerto (Live Server, etc.)
  // Especialmente permitir puerto 5500 (Live Server)
  if (origin && (
    origin.includes("localhost") || 
    origin.includes("127.0.0.1") || 
    origin.includes("192.168.") || 
    origin.includes("10.") ||
    origin.includes(":5500")
  )) {
    res.header("Access-Control-Allow-Origin", origin);
    res.header("Access-Control-Allow-Credentials", "true");
  } else if (origin) {
    // Para otros orígenes específicos, permitir con credenciales
    res.header("Access-Control-Allow-Origin", origin);
    res.header("Access-Control-Allow-Credentials", "true");
  } else {
    // Si no hay origin (petición directa), no establecer CORS
    // Esto permite que las peticiones del mismo origen funcionen
  }
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.header("Access-Control-Expose-Headers", "Location");
  
  // Manejar preflight requests
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

// Configurar asociaciones
Producto.belongsToMany(Venta, { through: VentaProducto, foreignKey: "productoId" });
Venta.belongsToMany(Producto, { through: VentaProducto, foreignKey: "ventaId" });
LogLogin.belongsTo(Usuario, { foreignKey: "usuarioId" });
Usuario.hasMany(LogLogin, { foreignKey: "usuarioId" });

// Inicialización de BD básica
(async () => {
  try {
    await sequelize.authenticate();
    console.log("BD Todo ok!");
    await Producto.sync({ alter: true });
    await Venta.sync({ alter: true });
    await VentaProducto.sync({ alter: true });
    await Usuario.sync({ alter: true });
    await LogLogin.sync({ alter: true });
    console.log("Modelos sincronizados");
    
    // Crear usuario admin por defecto si no existe
    const adminExists = await Usuario.findOne({ where: { email: "admin@admin.com" } });
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash("1234", 10);
      await Usuario.create({
        nombre: "Administrador",
        email: "admin@admin.com",
        password: hashedPassword,
        estado: true
      });
      console.log("Usuario administrador creado (admin@admin.com / 1234)");
    }
  } catch (error) {
    console.log("Error al inicializar BD:", error);
  }
})();

// Middleware para verificar autenticación
const requireAuth = (req, res, next) => {
  if (req.session && req.session.userId) {
    return next();
  }
  // Si es una petición AJAX o API, devolver error JSON
  if (req.path.startsWith("/api") || req.headers['content-type']?.includes('application/json')) {
    return res.status(401).json({ message: "No autorizado" });
  }
  return res.redirect("/admin/login");
};

// Middleware de validación para productos
const validateProducto = (req, res, next) => {
  const { titulo, tipo, precio } = req.body;
  
  if (!titulo || titulo.trim().length === 0) {
    return res.status(400).json({ message: "El título es requerido" });
  }
  
  if (!tipo || !["libro", "pelicula"].includes(tipo.toLowerCase())) {
    return res.status(400).json({ message: "El tipo debe ser 'libro' o 'pelicula'" });
  }
  
  if (!precio || isNaN(precio) || parseFloat(precio) <= 0) {
    return res.status(400).json({ message: "El precio debe ser un número mayor a 0" });
  }
  
  next();
};

// -------- RUTAS DE API (DEBEN IR ANTES DE ARCHIVOS ESTÁTICOS) --------

// -------- RUTAS DE AUTENTICACIÓN --------

// GET /admin/login - Mostrar página de login
app.get("/admin/login", (req, res) => {
  if (req.session && req.session.userId) {
    return res.redirect("/admin/dashboard");
  }
  res.render("login", { error: null });
});

// POST /admin/login - Procesar login
app.post("/admin/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log("Intento de login - Email:", email);
    console.log("Origin:", req.headers.origin);
    console.log("Referer:", req.headers.referer);
    
    // Detectar si la petición viene de un origen diferente (Live Server, etc.)
    const origin = req.headers.origin || req.headers.referer || "";
    const host = req.headers.host || "";
    // Es cross-origin si viene de cualquier puerto que no sea 3000 (Live Server usa 5500, 5501, 8080, etc.)
    // o si el origen es diferente al host del servidor
    const isCrossOrigin = (origin && (
                          origin.includes(":5500") || 
                          origin.includes(":5501") || 
                          origin.includes(":8080") || 
                          origin.includes(":8000") ||
                          origin.match(/:\d{4,5}/) // Cualquier puerto de 4-5 dígitos
                        )) || (origin && !origin.includes(host));
    
    if (!email || !password) {
      console.log("Login fallido: Campos vacíos");
      if (isCrossOrigin) {
        return res.status(400).json({ success: false, error: "Completá todos los campos" });
      }
      return res.render("login", { error: "Completá todos los campos" });
    }
    
    const usuario = await Usuario.findOne({ where: { email: email.trim() } });
    
    if (!usuario) {
      console.log("Login fallido: Usuario no encontrado");
      if (isCrossOrigin) {
        return res.status(401).json({ success: false, error: "Usuario o contraseña incorrectos" });
      }
      return res.render("login", { error: "Usuario o contraseña incorrectos" });
    }
    
    if (!usuario.estado) {
      console.log("Login fallido: Usuario inactivo");
      if (isCrossOrigin) {
        return res.status(403).json({ success: false, error: "Usuario inactivo" });
      }
      return res.render("login", { error: "Usuario inactivo" });
    }
    
    const passwordMatch = await bcrypt.compare(password, usuario.password);
    
    if (!passwordMatch) {
      console.log("Login fallido: Contraseña incorrecta");
      if (isCrossOrigin) {
        return res.status(401).json({ success: false, error: "Usuario o contraseña incorrectos" });
      }
      return res.render("login", { error: "Usuario o contraseña incorrectos" });
    }
    
    console.log("Login exitoso para:", usuario.email);
    
    // Guardar sesión
    req.session.userId = usuario.id;
    req.session.userEmail = usuario.email;
    req.session.userName = usuario.nombre;
    
    console.log("Sesión guardada - userId:", req.session.userId);
    
    // Registrar log de login
    try {
      await LogLogin.create({
        usuarioId: usuario.id,
        fecha: new Date(),
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.get("user-agent") || "Unknown"
      });
    } catch (logError) {
      console.log("Error al registrar log de login:", logError);
    }
    
    // Si es cross-origin, devolver JSON en lugar de redirect
    if (isCrossOrigin) {
      return res.json({ 
        success: true, 
        message: "Login exitoso",
        redirectUrl: "/admin/dashboard"
      });
    }
    
    res.redirect("/admin/dashboard");
  } catch (error) {
    console.log("Error en login:", error);
    const origin = req.headers.origin || req.headers.referer || "";
    const isCrossOrigin = origin.includes(":5500") || origin.includes("127.0.0.1:5500") || origin.includes("localhost:5500");
    
    if (isCrossOrigin) {
      return res.status(500).json({ success: false, error: "Error interno del servidor: " + error.message });
    }
    res.render("login", { error: "Error interno del servidor: " + error.message });
  }
});

// POST /admin/logout - Cerrar sesión
app.post("/admin/logout", requireAuth, (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.log("Error al cerrar sesión:", err);
    }
    res.redirect("/login.html");
  });
});

// -------- API JSON PARA USUARIOS --------

// POST /api/usuarios - Crear usuario administrador
app.post("/api/usuarios", async (req, res) => {
  try {
    const { nombre, email, password } = req.body;
    
    if (!nombre || !email || !password) {
      return res.status(400).json({ message: "Faltan datos requeridos" });
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Email inválido" });
    }
    
    if (password.length < 4) {
      return res.status(400).json({ message: "La contraseña debe tener al menos 4 caracteres" });
    }
    
    const usuarioExistente = await Usuario.findOne({ where: { email } });
    if (usuarioExistente) {
      return res.status(400).json({ message: "El email ya está registrado" });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const nuevoUsuario = await Usuario.create({
      nombre: nombre.trim(),
      email: email.trim(),
      password: hashedPassword,
      estado: true
    });
    
    res.status(201).json({
      message: "Usuario creado exitosamente",
      usuario: {
        id: nuevoUsuario.id,
        nombre: nuevoUsuario.nombre,
        email: nuevoUsuario.email
      }
    });
  } catch (error) {
    console.log("Error al crear usuario:", error);
    res.status(500).json({ message: "Error interno: " + error.message });
  }
});

// -------- API JSON PARA PRODUCTOS --------

// GET /api/productos?tipo=libro&activo=true&page=1&limit=10
app.get("/api/productos", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const where = {};

    if (req.query.tipo) {
      where.tipo = req.query.tipo;
    }

    if (req.query.activo === "true") {
      where.estado = true;
    } else if (req.query.activo === "false") {
      where.estado = false;
    }

    const { rows, count } = await Producto.findAndCountAll({
      where,
      limit,
      offset,
      order: [["id", "ASC"]],
    });

    const totalPages = Math.ceil(count / limit) || 1;

    res.json({
      data: rows,
      page,
      totalPages,
      totalItems: count,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error interno" });
  }
});

// GET /api/productos/:id
app.get("/api/productos/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const producto = await Producto.findByPk(id);

    if (!producto) {
      return res.status(404).json({ message: "Producto no encontrado" });
    }

    res.json(producto);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error interno" });
  }
});

// POST /api/productos - Crear producto (con validación)
app.post("/api/productos", upload.single("image"), validateProducto, async (req, res) => {
  try {
    const { titulo, tipo, descripcion, precio, fechaSalida } = req.body;
    
    let imagePath = "";
    if (req.file) {
      imagePath = `/public/images/${req.file.filename}`;
    } else if (req.body.image) {
      imagePath = req.body.image;
    }
    
    const producto = await Producto.create({
      titulo: titulo.trim(),
      tipo: tipo.toLowerCase(),
      descripcion: descripcion ? descripcion.trim() : null,
      precio: parseFloat(precio),
      fechaSalida: fechaSalida || new Date(),
      estado: true,
      image: imagePath
    });
    
    res.status(201).json({
      message: "Producto creado exitosamente",
      producto
    });
  } catch (error) {
    console.log("Error al crear producto:", error);
    res.status(500).json({ message: "Error interno: " + error.message });
  }
});

// PUT /api/productos/:id - Modificar producto
app.put("/api/productos/:id", upload.single("image"), validateProducto, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { titulo, tipo, descripcion, precio, fechaSalida, estado } = req.body;
    
    const producto = await Producto.findByPk(id);
    
    if (!producto) {
      return res.status(404).json({ message: "Producto no encontrado" });
    }
    
    producto.titulo = titulo.trim();
    producto.tipo = tipo.toLowerCase();
    producto.descripcion = descripcion ? descripcion.trim() : null;
    producto.precio = parseFloat(precio);
    if (fechaSalida) producto.fechaSalida = fechaSalida;
    if (req.body.estado !== undefined) producto.estado = req.body.estado === "true" || req.body.estado === true;
    
    if (req.file) {
      producto.image = `/public/images/${req.file.filename}`;
    } else if (req.body.image) {
      producto.image = req.body.image;
    }
    
    await producto.save();
    
    res.json({
      message: "Producto actualizado exitosamente",
      producto
    });
  } catch (error) {
    console.log("Error al actualizar producto:", error);
    res.status(500).json({ message: "Error interno: " + error.message });
  }
});

// DELETE /api/productos/:id - Baja lógica (desactivar)
app.delete("/api/productos/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const producto = await Producto.findByPk(id);
    
    if (!producto) {
      return res.status(404).json({ message: "Producto no encontrado" });
    }
    
    producto.estado = false;
    await producto.save();
    
    res.json({
      message: "Producto desactivado exitosamente",
      producto
    });
  } catch (error) {
    console.log("Error al desactivar producto:", error);
    res.status(500).json({ message: "Error interno: " + error.message });
  }
});

// PUT /api/productos/:id/activar - Reactivar producto
app.put("/api/productos/:id/activar", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const producto = await Producto.findByPk(id);
    
    if (!producto) {
      return res.status(404).json({ message: "Producto no encontrado" });
    }
    
    producto.estado = true;
    await producto.save();
    
    res.json({
      message: "Producto activado exitosamente",
      producto
    });
  } catch (error) {
    console.log("Error al activar producto:", error);
    res.status(500).json({ message: "Error interno: " + error.message });
  }
});

// -------- API JSON PARA VENTAS --------

// POST /api/ventas - Crear una nueva venta
app.post("/api/ventas", async (req, res) => {
  try {
    const { clienteNombre, items } = req.body;

    if (!clienteNombre || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Datos inválidos: se requiere clienteNombre e items" });
    }

    // Calcular el total y validar productos
    let total = 0;
    const productosValidos = [];

    for (const item of items) {
      const producto = await Producto.findByPk(item.productoId);
      
      if (!producto) {
        return res.status(404).json({ message: `Producto con ID ${item.productoId} no encontrado` });
      }

      if (!producto.estado) {
        return res.status(400).json({ message: `El producto "${producto.titulo}" está inactivo` });
      }

      const subtotal = parseFloat(producto.precio) * parseInt(item.cantidad);
      total += subtotal;

      productosValidos.push({
        productoId: producto.id,
        cantidad: parseInt(item.cantidad),
        precioUnitario: parseFloat(producto.precio),
        titulo: producto.titulo,
      });
    }

    // Crear la venta
    const venta = await Venta.create({
      clienteNombre,
      total: total.toFixed(2),
      fecha: new Date(),
    });

    // Crear los registros de VentaProducto
    for (const item of productosValidos) {
      await VentaProducto.create({
        ventaId: venta.id,
        productoId: item.productoId,
        cantidad: item.cantidad,
        precioUnitario: item.precioUnitario,
      });
    }

    res.status(201).json({
      message: "Venta creada exitosamente",
      venta: {
        id: venta.id,
        clienteNombre: venta.clienteNombre,
        fecha: venta.fecha,
        total: parseFloat(venta.total),
        items: productosValidos,
      },
    });
  } catch (error) {
    console.log("Error al crear venta:", error);
    res.status(500).json({ message: "Error interno: " + error.message });
  }
});

// GET /api/ventas - Obtener todas las ventas con productos
app.get("/api/ventas", async (req, res) => {
  try {
    const ventas = await Venta.findAll({
      order: [["fecha", "DESC"]],
    });

    const ventasConProductos = [];
    for (const venta of ventas) {
      const ventaProductos = await VentaProducto.findAll({
        where: { ventaId: venta.id },
      });

      const items = [];
      for (const vp of ventaProductos) {
        const producto = await Producto.findByPk(vp.productoId);
        if (producto) {
          items.push({
            productoId: producto.id,
            titulo: producto.titulo,
            cantidad: vp.cantidad,
            precioUnitario: parseFloat(vp.precioUnitario),
          });
        }
      }

      ventasConProductos.push({
        id: venta.id,
        clienteNombre: venta.clienteNombre,
        fecha: venta.fecha,
        total: parseFloat(venta.total),
        items,
      });
    }

    res.json(ventasConProductos);
  } catch (error) {
    console.log("Error al obtener ventas:", error);
    res.status(500).json({ message: "Error interno: " + error.message });
  }
});

// GET /api/ventas/:id - Obtener una venta por ID
app.get("/api/ventas/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    
    const venta = await Venta.findByPk(id);

    if (!venta) {
      return res.status(404).json({ message: "Venta no encontrada" });
    }

    // Obtener los productos de la venta desde VentaProducto
    const ventaProductos = await VentaProducto.findAll({
      where: { ventaId: id },
    });

    // Obtener los detalles de cada producto
    const items = [];
    for (const vp of ventaProductos) {
      const producto = await Producto.findByPk(vp.productoId);
      if (producto) {
        items.push({
          productoId: producto.id,
          titulo: producto.titulo,
          cantidad: vp.cantidad,
          precioUnitario: parseFloat(vp.precioUnitario),
        });
      }
    }

    res.json({
      id: venta.id,
      clienteNombre: venta.clienteNombre,
      fecha: venta.fecha,
      total: parseFloat(venta.total),
      items,
    });
  } catch (error) {
    console.log("Error al obtener venta:", error);
    res.status(500).json({ message: "Error interno: " + error.message });
  }
});

// GET /api/registros/productos-mas-vendidos - Top 10 productos más vendidos
app.get("/api/registros/productos-mas-vendidos", async (req, res) => {
  try {
    const productosVendidos = await VentaProducto.findAll({
      attributes: [
        "productoId",
        [sequelize.fn("SUM", sequelize.col("cantidad")), "totalVendido"]
      ],
      group: ["productoId"],
      order: [[sequelize.fn("SUM", sequelize.col("cantidad")), "DESC"]],
      limit: 10,
      raw: true
    });

    const productosConDetalles = [];
    for (const item of productosVendidos) {
      const producto = await Producto.findByPk(item.productoId);
      if (producto) {
        productosConDetalles.push({
          id: producto.id,
          titulo: producto.titulo,
          tipo: producto.tipo,
          totalVendido: parseInt(item.totalVendido)
        });
      }
    }

    res.json(productosConDetalles);
  } catch (error) {
    console.log("Error al obtener productos más vendidos:", error);
    res.status(500).json({ message: "Error interno: " + error.message });
  }
});

// GET /api/registros/ventas-mas-caras - Top 10 ventas más caras
app.get("/api/registros/ventas-mas-caras", async (req, res) => {
  try {
    const ventas = await Venta.findAll({
      order: [["total", "DESC"]],
      limit: 10
    });

    const ventasConProductos = [];
    for (const venta of ventas) {
      const ventaProductos = await VentaProducto.findAll({
        where: { ventaId: venta.id },
      });

      const items = [];
      for (const vp of ventaProductos) {
        const producto = await Producto.findByPk(vp.productoId);
        if (producto) {
          items.push({
            titulo: producto.titulo,
            cantidad: vp.cantidad,
            precioUnitario: parseFloat(vp.precioUnitario),
          });
        }
      }

      ventasConProductos.push({
        id: venta.id,
        clienteNombre: venta.clienteNombre,
        fecha: venta.fecha,
        total: parseFloat(venta.total),
        items,
      });
    }

    res.json(ventasConProductos);
  } catch (error) {
    console.log("Error al obtener ventas más caras:", error);
    res.status(500).json({ message: "Error interno: " + error.message });
  }
});

// GET /api/registros/logs-login - Logs de inicio de sesión
app.get("/api/registros/logs-login", async (req, res) => {
  try {
    let where = {};
    
    if (req.query.desde || req.query.hasta) {
      where.fecha = {};
      if (req.query.desde) {
        where.fecha[Op.gte] = new Date(req.query.desde);
      }
      if (req.query.hasta) {
        const hasta = new Date(req.query.hasta);
        hasta.setHours(23, 59, 59, 999);
        where.fecha[Op.lte] = hasta;
      }
    }
    
    const logs = await LogLogin.findAll({
      where,
      include: [{
        model: Usuario,
        attributes: ["nombre", "email"]
      }],
      order: [["fecha", "DESC"]],
      limit: 100
    });

    res.json(logs);
  } catch (error) {
    console.log("Error al obtener logs de login:", error);
    res.status(500).json({ message: "Error interno: " + error.message });
  }
});

// GET /api/registros/estadisticas - Estadísticas adicionales
app.get("/api/registros/estadisticas", async (req, res) => {
  try {
    // Estadística 1: Total de ventas y monto total
    const totalVentas = await Venta.count();
    const ventas = await Venta.findAll();
    const montoTotal = ventas.reduce((sum, v) => sum + parseFloat(v.total), 0);

    // Estadística 2: Productos activos vs inactivos
    const productosActivos = await Producto.count({ where: { estado: true } });
    const productosInactivos = await Producto.count({ where: { estado: false } });

    res.json({
      ventas: {
        total: totalVentas,
        montoTotal: montoTotal.toFixed(2)
      },
      productos: {
        activos: productosActivos,
        inactivos: productosInactivos,
        total: productosActivos + productosInactivos
      }
    });
  } catch (error) {
    console.log("Error al obtener estadísticas:", error);
    res.status(500).json({ message: "Error interno: " + error.message });
  }
});

// -------- VISTAS EJS (después de las rutas de API) --------

// GET /admin/dashboard - Panel de administración
app.get("/admin/dashboard", requireAuth, async (req, res) => {
  try {
    const productos = await Producto.findAll({
      order: [["id", "ASC"]]
    });
    
    const productosPorTipo = {
      libro: productos.filter(p => p.tipo === "libro"),
      pelicula: productos.filter(p => p.tipo === "pelicula")
    };
    
    res.render("dashboard", { 
      productos,
      productosPorTipo,
      usuario: {
        nombre: req.session.userName,
        email: req.session.userEmail
      }
    });
  } catch (error) {
    console.log(error);
    res.status(500).send("Error interno");
  }
});

// GET /admin/productos/crear - Formulario de alta
app.get("/admin/productos/crear", requireAuth, (req, res) => {
  res.render("crear", { producto: null, editar: false, error: null });
});

// GET /admin/productos/editar/:id - Formulario de edición
app.get("/admin/productos/editar/:id", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    
    if (isNaN(id)) {
      return res.status(400).send("ID de producto inválido");
    }
    
    const producto = await Producto.findByPk(id);
    
    if (!producto) {
      return res.status(404).send("Producto no encontrado");
    }
    
    res.render("crear", { producto, editar: true, error: null });
  } catch (error) {
    console.log("Error al cargar formulario de edición:", error);
    res.status(500).send("Error interno: " + error.message);
  }
});

// POST /admin/productos/crear - Crear producto desde admin
app.post("/admin/productos/crear", requireAuth, (req, res, next) => {
  upload.single("image")(req, res, (err) => {
    if (err) {
      console.log("Error en multer:", err);
      return res.render("crear", { 
        producto: null, 
        editar: false,
        error: err.message || "Error al subir la imagen. Verificá que sea una imagen válida (jpg, png, gif, webp) y que no exceda 5MB." 
      });
    }
    next();
  });
}, async (req, res) => {
  try {
    const { titulo, tipo, descripcion, precio, fechaSalida } = req.body;
    
    if (!titulo || !tipo || !precio) {
      return res.render("crear", { 
        producto: null, 
        editar: false,
        error: "Completá todos los campos requeridos" 
      });
    }
    
    let imagePath = "";
    if (req.file) {
      imagePath = `/public/images/${req.file.filename}`;
    } else if (req.body.image) {
      imagePath = req.body.image;
    }
    
    await Producto.create({
      titulo: titulo.trim(),
      tipo: tipo.toLowerCase(),
      descripcion: descripcion ? descripcion.trim() : null,
      precio: parseFloat(precio),
      fechaSalida: fechaSalida || new Date(),
      estado: true,
      image: imagePath
    });
    
    res.redirect("/admin/dashboard");
  } catch (error) {
    console.log("Error al crear producto:", error);
    res.render("crear", { 
      producto: null, 
      editar: false,
      error: "Error al crear producto: " + (error.message || "Error desconocido")
    });
  }
});

// POST /admin/productos/editar/:id - Editar producto desde admin
app.post("/admin/productos/editar/:id", requireAuth, (req, res, next) => {
  upload.single("image")(req, res, (err) => {
    if (err) {
      console.log("Error en multer:", err);
      return res.status(400).send("Error al subir la imagen: " + (err.message || "Verificá que sea una imagen válida (jpg, png, gif, webp) y que no exceda 5MB."));
    }
    next();
  });
}, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { titulo, tipo, descripcion, precio, fechaSalida, estado } = req.body;
    
    const producto = await Producto.findByPk(id);
    
    if (!producto) {
      return res.status(404).send("Producto no encontrado");
    }
    
    producto.titulo = titulo.trim();
    producto.tipo = tipo.toLowerCase();
    producto.descripcion = descripcion ? descripcion.trim() : null;
    producto.precio = parseFloat(precio);
    if (fechaSalida) producto.fechaSalida = fechaSalida;
    if (estado !== undefined) producto.estado = estado === "true" || estado === true;
    
    if (req.file) {
      producto.image = `/public/images/${req.file.filename}`;
    } else if (req.body.image) {
      producto.image = req.body.image;
    }
    
    await producto.save();
    
    res.redirect("/admin/dashboard");
  } catch (error) {
    console.log("Error al editar producto:", error);
    res.status(500).send("Error interno: " + (error.message || "Error desconocido"));
  }
});

// GET /admin/registros - Pantalla de registros
app.get("/admin/registros", requireAuth, async (req, res) => {
  try {
    res.render("registros", {
      usuario: {
        nombre: req.session.userName,
        email: req.session.userEmail
      }
    });
  } catch (error) {
    console.log(error);
    res.status(500).send("Error interno");
  }
});

// -------- ARCHIVOS ESTÁTICOS (al final, después de todas las rutas) --------
// IMPORTANTE: Los archivos estáticos deben ir DESPUÉS de todas las rutas
// para que no intercepten rutas como /admin/dashboard

// Servir imágenes subidas desde /public/images
app.use("/public", express.static(path.join(__dirname, "public")));

// Servir archivos del frontend SOLO si NO es una ruta de admin o API
app.use((req, res, next) => {
  // Si es una ruta de admin o API, NO servir archivos estáticos
  if (req.path.startsWith("/admin") || req.path.startsWith("/api")) {
    return next(); // Pasar al siguiente middleware (que no existe, así que dará 404 si no hay ruta)
  }
  // Si no, servir archivos estáticos del frontend
  express.static(path.join(__dirname, "..", "front"))(req, res, next);
});

// Middleware de manejo de errores (debe ir al final, después de todas las rutas)
app.use((err, req, res, next) => {
  console.error("Error no manejado:", err);
  
  // Si la ruta empieza con /api, devolver JSON
  if (req.path.startsWith("/api")) {
    return res.status(500).json({ 
      message: "Error interno del servidor", 
      error: err.message 
    });
  }
  
  // Para otras rutas, devolver HTML de error
  res.status(500).send("Error interno del servidor");
});

app.listen(port, "0.0.0.0", () => {
  console.log(`Servidor escuchando en puerto ${port}`);
  console.log(`Accesible desde:`);
  console.log(`  - http://localhost:${port}`);
  console.log(`  - http://127.0.0.1:${port}`);
  console.log(`  - http://[TU_IP_LOCAL]:${port} (desde otros dispositivos en la misma red)`);
});

