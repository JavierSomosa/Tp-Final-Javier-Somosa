const { response, request } = require("express");
const Producto=require("./producto");
const sequelize=require("./db");

const crearProducto = async (req, res) => {
  try {
    const creado = await Producto.create({
      titulo: req.body.titulo,
      tipo: "libro",
      descripcion: req.body.descripcion,
      precio: req.body.precio,
      fechaSalida: "1930-10-10",
      estado: "true",
      image : " ",
      
    });
    //console.log(req.file);

    // 200 -> OK
    // 201 -> CREATED
   // res.status(201).send(creado);
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Error interno" });
  }
  res.redirect("/");
};

const traerListado=async (req,res) =>{
    const productos= await Producto.findAll();    
    res.render("index", {productos: productos});
};

module.exports ={ crearProducto,traerListado};