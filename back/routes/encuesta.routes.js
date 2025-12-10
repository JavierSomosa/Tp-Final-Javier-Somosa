const express = require("express");
const router = express.Router();
const encController = require("../controllers/encuesta.controller");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// carpeta para imágenes
const uploadDir = path.join(__dirname, "..", "public", "images", "encuestas");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${unique}${ext}`);
  }
});

const upload = multer({ storage });

// rutas API
router.post("/api/encuestas", upload.single("imagen"), encController.crearEncuesta);
router.get("/api/admin/encuestas", encController.listarEncuestas);

// ruta vista admin
router.get("/admin/asistencia", encController.listarEncuestas);

module.exports = router;