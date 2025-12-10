const express = require("express");
const router = express.Router();
const registros = require("../controllers/registros.controller");

router.get("/estadisticas", registros.estadisticas);
router.get("/productos-mas-vendidos", registros.productosMasVendidos);
router.get("/ventas-mas-caras", registros.ventasMasCaras);
router.get("/logs-login", registros.logsLogin);

module.exports = router;