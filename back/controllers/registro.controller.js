const Venta = require("../venta");
const Producto = require("../producto");
const LogLogin = require("../logLogin");
const Encuesta = require("../encuesta");
const { Op } = require("sequelize");
const { fn, col } = require("sequelize");

module.exports = {

  // ──────────────────────────────────────────────
  // 📊 ESTADÍSTICAS GENERALES
  // ──────────────────────────────────────────────
  async estadisticas(req, res) {
  try {
    let totalVentas = 0;
    let montoTotal = 0;
    try {
      totalVentas = await Venta.count();
      const montoTotalRaw = await Venta.sum("total");
      montoTotal = montoTotalRaw ? parseFloat(montoTotalRaw) : 0;
    } catch (e) {
      console.error("Error calculando ventas:", e);
    }

    let activos = 0, inactivos = 0, totalProductos = 0;
    try {
      activos = await Producto.count({ where: { estado: true } });
      inactivos = await Producto.count({ where: { estado: false } });
      totalProductos = await Producto.count();
    } catch (e) {
      console.error("Error contando productos:", e);
    }

    let totalEncuestas = 0, promedioPuntuacion = 0, encuestasRecomiendan = 0;
    try {
      totalEncuestas = await Encuesta.count();

      const promedioObj = await Encuesta.findOne({
        attributes: [[fn("AVG", col("puntuacion")), "promedio"]]
      });

      promedioPuntuacion = promedioObj?.dataValues?.promedio
        ? Number(promedioObj.dataValues.promedio).toFixed(2)
        : 0;

      encuestasRecomiendan = await Encuesta.count({ where: { recomendar: true } });
    } catch (e) {
      console.error("Error calculando encuestas:", e);
    }

    res.json({
      ventas: { total: totalVentas, montoTotal },
      productos: { activos, inactivos, total: totalProductos },
      encuestas: { total: totalEncuestas, promedio: promedioPuntuacion, recomiendan: encuestasRecomiendan }
    });

  } catch (e) {
    console.error("Error general:", e);
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
  },

  // ──────────────────────────────────────────────
// 📋 LISTADO DE ENCUESTAS
// ──────────────────────────────────────────────
async encuestasListado(req, res) {
  try {
    const { desde, hasta } = req.query;

    const where = {};

    if (desde || hasta) {
      where.createdAt = {};
      if (desde) where.createdAt[Op.gte] = new Date(desde);
      if (hasta) {
        const h = new Date(hasta);
        h.setHours(23, 59, 59);
        where.createdAt[Op.lte] = h;
      }
    }

    const datos = await Encuesta.findAll({
      where,
      order: [["createdAt", "DESC"]]
    });

    res.json(datos);
  } catch (error) {
    console.log("Error listado encuestas:", error);
    res.status(500).json({ error: "Error al obtener encuestas" });
  }
},

// ──────────────────────────────────────────────
// 📊 ESTADÍSTICAS DE ENCUESTAS
// ──────────────────────────────────────────────
async encuestasEstadisticas(req, res) {
  const { fn, col } = require("sequelize");
  try {
    const total = await Encuesta.count();

    const promedioObj = await Encuesta.findOne({
      attributes: [[fn("AVG", col("puntuacion")), "promedio"]]
    });

const promedioPuntuacion = promedioObj?.dataValues?.promedio || 0;

    const recomiendaSi = await Encuesta.count({ where: { recomendar: true } });
    const recomiendaNo = await Encuesta.count({ where: { recomendar: false } });

    res.json({
      total,
      promedio: promedio || 0,
      recomiendaSi,
      recomiendaNo
    });
  } catch (error) {
    console.log("Error estadísticas encuestas:", error);
    res.status(500).json({ error: "Error al obtener estadísticas de encuestas" });
  }
}

};

