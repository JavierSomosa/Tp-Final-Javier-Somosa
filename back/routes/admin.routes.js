const express = require("express");
const enrutador = express.Router();

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
