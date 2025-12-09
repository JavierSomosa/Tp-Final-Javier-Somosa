const express = require("express");
const router = express.Router();

const {
  crearProducto,
  traerListado,
} = require("../controllers/prod.controller");

router.get("/",traerListado);
router.post("/", crearProducto);

router.delete("/", (req, res) => {
  res.send("Funciona");
});

router.put("/", (req, res) => {
  res.sendStatus(400);
});


module.exports = router;
