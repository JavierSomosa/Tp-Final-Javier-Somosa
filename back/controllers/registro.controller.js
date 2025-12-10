const Venta = require("../venta");
const Producto = require("../producto");
const LogLogin = require("../logLogin");
const Encuesta = require("../encuesta");

module.exports = {

  // ──────────────────────────────────────────────
  // 📊 ESTADÍSTICAS GENERALES
  // ──────────────────────────────────────────────
  async estadisticas(req, res) {
    try {
      // Ventas
      const totalVentas = await Venta.count();
      const montoTotal = await Venta.sum("total");

      // Productos
      const activos = await Producto.count({ where: { estado: "true" } });
      const inactivos = await Producto.count({ where: { estado: "false" } });
      const totalProductos = await Producto.count();

      // Encuestas
      const totalEncuestas = await Encuesta.count();
      const promedioPuntuacion = await Encuesta.avg("puntuacion");

      res.json({
        ventas: {
          total: totalVentas,
          montoTotal: montoTotal || 0
        },
        productos: {
          activos,
          inactivos,
          total: totalProductos
        },
        encuestas: {
          total: totalEncuestas,
          promedio: promedioPuntuacion || 0
        }
      });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Error al obtener estadísticas" });
    }
  },

  // ──────────────────────────────────────────────
  // 📝 TOP 10 PRODUCTOS MÁS VENDIDOS
  // ──────────────────────────────────────────────
  async productosMasVendidos(req, res) {
    try {
      const ventas = await Venta.findAll({
        include: ["items"]
      });

      // cantidad total vendida por producto
      const conteo = {};

      ventas.forEach(v => {
        v.items.forEach(item => {
          if (!conteo[item.productoId]) {
            conteo[item.productoId] = {
              id: item.productoId,
              titulo: item.titulo,
              tipo: item.tipo,
              totalVendido: 0
            };
          }
          conteo[item.productoId].totalVendido += item.cantidad;
        });
      });

      const lista = Object.values(conteo)
        .sort((a, b) => b.totalVendido - a.totalVendido)
        .slice(0, 10);

      res.json(lista);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Error al obtener productos más vendidos" });
    }
  },

  // ──────────────────────────────────────────────
  // 💰 TOP 10 VENTAS MÁS CARAS
  // ──────────────────────────────────────────────
  async ventasMasCaras(req, res) {
    try {
      const ventas = await Venta.findAll({
        include: ["items"],
        order: [["total", "DESC"]],
        limit: 10
      });

      res.json(ventas);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Error al obtener ventas" });
    }
  },

  // ──────────────────────────────────────────────
  // 🔐 LOGS DE LOGIN (CON FILTRO DE FECHA)
  // ──────────────────────────────────────────────
  async logsLogin(req, res) {
    try {
      const { desde, hasta } = req.query;

      const where = {};

      if (desde) where.fecha = { ...where.fecha, $gte: new Date(desde) };
      if (hasta) where.fecha = { ...where.fecha, $lte: new Date(hasta) };

      const logs = await LogLogin.findAll({
        where,
        include: ["Usuario"],
        order: [["fecha", "DESC"]]
      });

      res.json(logs);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Error al obtener logs de login" });
    }
  }

};