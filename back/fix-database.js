// Script temporal para arreglar la base de datos
// Ejecutar: node fix-database.js

const sequelize = require("./db");

async function fixDatabase() {
  try {
    console.log("Conectando a la base de datos...");
    await sequelize.authenticate();
    console.log("Conexión exitosa!");

    console.log("Eliminando tabla usuarios si existe...");
    await sequelize.query("DROP TABLE IF EXISTS usuarios");
    console.log("Tabla usuarios eliminada.");

    console.log("Eliminando tabla logs_login si existe...");
    await sequelize.query("DROP TABLE IF EXISTS logs_login");
    console.log("Tabla logs_login eliminada.");

    console.log("\n✅ Base de datos arreglada!");
    console.log("Ahora reiniciá el servidor con: node index.js");
    
    process.exit(0);
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
}

fixDatabase();

