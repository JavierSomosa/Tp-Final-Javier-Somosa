const express = require("express");
const router = express.Router();
const registros = require("../controllers/registros.controller");

router.get("/estadisticas", registros.estadisticas);
router.get("/productos-mas-vendidos", registros.productosMasVendidos);
router.get("/ventas-mas-caras", registros.ventasMasCaras);
router.get("/logs-login", registros.logsLogin);
// ➕ NUEVA: listado de encuestas para la tabla
router.get("/encuestas", registros.encuestasListado);
// ➕ NUEVA: estadísticas de encuestas
router.get("/encuestas-estadisticas", registros.encuestasEstadisticas);

module.exports = router;