const path = require("path");
const Encuesta = require("../encuesta");
const { Op } = require("sequelize");

exports.crearEncuesta = async (req, res) => {
  try {
    const { email, comentario, recomendar, puntuacion } = req.body;
    const imagen = req.file ? `/images/encuestas/${req.file.filename}` : null;

    if (!puntuacion) {
      return res.status(400).json({ error: "La puntuación es obligatoria." });
    }

    const encuesta = await Encuesta.create({
      email: email || null,
      comentario: comentario || null,
      recomendar: recomendar === "on" || recomendar === "true",
      puntuacion: parseInt(puntuacion, 10),
      imagen
    });

    return res.status(201).json({ ok: true, encuesta });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Error interno" });
  }
};

exports.listarEncuestas = async (req, res) => {
  try {
    const { desde, hasta } = req.query;
    const filtro = {};

    if (desde || hasta) {
      filtro.createdAt = {};
      if (desde) filtro.createdAt[Op.gte] = new Date(desde);
      if (hasta) filtro.createdAt[Op.lte] = new Date(hasta);
    }

    const encuestas = await Encuesta.findAll({
      where: filtro,
      order: [["createdAt", "DESC"]]
    });

    // Si es API → JSON
    if (req.path.includes("/api")) {
      return res.json({ encuestas });
    }

    // Si es vista admin → ahora enviamos las fechas también
    return res.render("asistencia", { 
      encuestas,
      desde: desde || "",
      hasta: hasta || ""
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener encuestas" });
  }
};