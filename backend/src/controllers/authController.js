import jwt from 'jsonwebtoken';
import Usuario from '../models/Usuario.js';
import Profesor from '../models/Profesor.js';

// Generar JWT
const generarToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'secreto_backup', {
    expiresIn: '30d'
  });
};

// Registrar nuevo usuario
export const registrar = async (req, res) => {
  try {
    const { email, password, nombre, rol, numeroEmpleado, departamento } = req.body;

    // Verificar si el usuario ya existe
    const usuarioExistente = await Usuario.findOne({ email });
    if (usuarioExistente) {
      return res.status(400).json({
        message: 'El usuario ya existe con este email.'
      });
    }

    // Crear usuario
    const usuario = new Usuario({
      email,
      password,
      nombre,
      rol: rol || 'profesor'
    });

    await usuario.save();

    // Si es profesor, crear perfil extendido
    if (usuario.rol === 'profesor') {
      const profesor = new Profesor({
        usuario: usuario._id,
        numeroEmpleado,
        departamento,
        telefono: req.body.telefono,
        especialidad: req.body.especialidad,
        materias: req.body.materias || []
      });
      await profesor.save();
    }

    // Generar token
    const token = generarToken(usuario._id);

    res.status(201).json({
      message: 'Usuario registrado exitosamente.',
      token,
      usuario: {
        id: usuario._id,
        email: usuario.email,
        nombre: usuario.nombre,
        rol: usuario.rol
      }
    });
  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({
      message: 'Error al registrar usuario.',
      error: error.message
    });
  }
};

// Obtener todos los usuarios (solo admin)
export const obtenerUsuarios = async (req, res) => {
  try {
    const { rol } = req.query; // 🔹 Permitir filtrar por rol (ej. docente, coordinador, admin)
    
    const filtro = rol ? { rol } : {};
    const usuarios = await Usuario.find(filtro).select('-password'); // Ocultamos el hash del password
    
    res.json(usuarios);
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({ message: 'Error al obtener usuarios' });
  }
};
// Login de usuario
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validar campos
    if (!email || !password) {
      return res.status(400).json({
        message: 'Email y password son requeridos.'
      });
    }

    // Buscar usuario
    const usuario = await Usuario.findOne({ email, activo: true });
    if (!usuario) {
      return res.status(401).json({
        message: 'Credenciales inválidas.'
      });
    }

    // Verificar password
    const passwordValido = await usuario.compararPassword(password);
    if (!passwordValido) {
      return res.status(401).json({
        message: 'Credenciales inválidas.'
      });
    }

    // Generar token
    const token = generarToken(usuario._id);

    // Obtener datos adicionales si es profesor
    let datosExtra = {};
    if (usuario.rol === 'profesor') {
      const perfilProfesor = await Profesor.findOne({ usuario: usuario._id });
      datosExtra = {
        numeroEmpleado: perfilProfesor?.numeroEmpleado,
        departamento: perfilProfesor?.departamento
      };
    }

    res.json({
      message: 'Login exitoso.',
      token,
      usuario: {
        id: usuario._id,
        email: usuario.email,
        nombre: usuario.nombre,
        rol: usuario.rol,
        ...datosExtra
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({
      message: 'Error en el servidor.',
      error: error.message
    });
  }
};

// Obtener perfil del usuario autenticado
export const obtenerPerfil = async (req, res) => {
  try {
    let datosExtra = {};

    if (req.usuario.rol === 'profesor') {
      const perfilProfesor = await Profesor.findOne({ usuario: req.usuario._id });
      datosExtra = {
        perfilProfesor: perfilProfesor || null
      };
    }

    res.json({
      usuario: {
        id: req.usuario._id,
        email: req.usuario.email,
        nombre: req.usuario.nombre,
        rol: req.usuario.rol,
        ...datosExtra
      }
    });
  } catch (error) {
    console.error('Error obteniendo perfil:', error);
    res.status(500).json({
      message: 'Error al obtener perfil.',
      error: error.message
    });
  }
};

// Actualizar perfil
export const actualizarPerfil = async (req, res) => {
  try {
    const { nombre, telefono, especialidad, materias } = req.body;

    const usuario = await Usuario.findById(req.usuario._id);
    if (!usuario) {
      return res.status(404).json({
        message: 'Usuario no encontrado.'
      });
    }

    // Actualizar datos básicos
    if (nombre) usuario.nombre = nombre;
    await usuario.save();

    // Actualizar perfil de profesor si aplica
    if (usuario.rol === 'profesor') {
      await Profesor.findOneAndUpdate(
        { usuario: usuario._id },
        {
          telefono,
          especialidad,
          materias
        },
        { new: true, runValidators: true }
      );
    }

    res.json({
      message: 'Perfil actualizado exitosamente.',
      usuario: {
        id: usuario._id,
        email: usuario.email,
        nombre: usuario.nombre,
        rol: usuario.rol
      }
    });
  } catch (error) {
    console.error('Error actualizando perfil:', error);
    res.status(500).json({
      message: 'Error al actualizar perfil.',
      error: error.message
    });
  }
};