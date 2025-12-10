const express = require("express");
const enrutador = express.Router();
const registrosRoutes = require("./registros.routes");
router.use("/registros", registrosRoutes);

enrutador.get("/", (req, res) => {
  res.send("Funciona")
});
enrutador.post("/", (req, res) => {
  res.send("Funciona");
});
enrutador.delete("/", (req, res) => {
  res.send("Funciona");
});

enrutador.put("/", (req, res) => {
  res.sendStatus(400);
});


module.exports = enrutador;
