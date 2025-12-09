// Script para crear/actualizar el usuario administrador
// Ejecutar: node crear-admin.js

const bcrypt = require("bcryptjs");
const Usuario = require("./usuario");
const sequelize = require("./db");

async function crearAdmin() {
  try {
    console.log("Conectando a la base de datos...");
    await sequelize.authenticate();
    console.log("Conexión exitosa!");

    // Buscar o crear usuario admin
    const email = "admin@admin.com";
    const password = "1234";
    
    let usuario = await Usuario.findOne({ where: { email } });
    
    if (usuario) {
      console.log("Usuario admin ya existe. Actualizando contraseña...");
      const hashedPassword = await bcrypt.hash(password, 10);
      usuario.password = hashedPassword;
      usuario.estado = true;
      await usuario.save();
      console.log("✅ Contraseña actualizada correctamente!");
    } else {
      console.log("Creando usuario admin...");
      const hashedPassword = await bcrypt.hash(password, 10);
      usuario = await Usuario.create({
        nombre: "Administrador",
        email: email,
        password: hashedPassword,
        estado: true
      });
      console.log("✅ Usuario admin creado correctamente!");
    }
    
    console.log("\n📋 Credenciales:");
    console.log("   Email: admin@admin.com");
    console.log("   Contraseña: 1234");
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

crearAdmin();

