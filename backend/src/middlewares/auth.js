import jwt from 'jsonwebtoken';
import Usuario from '../models/Usuario.js';

/**
 * 🧩 Middleware de Autenticación
 * Verifica si el token JWT es válido y carga al usuario en req.usuario
 */
export const autenticar = async (req, res, next) => {
  try {
    let token;

    // Verificar si el token está en el encabezado
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        message: 'No autorizado, token no proporcionado'
      });
    }

    try {
      // Verificar el token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secreto_backup');

      // Buscar al usuario asociado al token
      const usuario = await Usuario.findById(decoded.id).select('-password');

      if (!usuario || !usuario.activo) {
        return res.status(401).json({
          message: 'Token inválido, usuario no existe o está inactivo'
        });
      }

      // Guardar usuario en la request para uso posterior
      req.usuario = usuario;
      next();
    } catch (error) {
      console.error('❌ Error verificando token:', error);
      return res.status(401).json({
        message: 'Token inválido o expirado'
      });
    }
  } catch (error) {
    console.error('⚠️ Error en middleware de autenticación:', error);
    res.status(500).json({
      message: 'Error del servidor en autenticación'
    });
  }
};

/**
 * 🔒 Middleware: Solo administradores
 */
export const esAdmin = (req, res, next) => {
  try {
    if (req.usuario.rol !== 'admin') {
      return res.status(403).json({
        message: 'Acceso denegado. Se requieren permisos de administrador.'
      });
    }
    next();
  } catch (error) {
    console.error('Error en middleware esAdmin:', error);
    res.status(500).json({
      message: 'Error del servidor en verificación de rol de administrador.'
    });
  }
};

/**
 * 🔒 Middleware: Solo coordinadores o administradores
 */
export const esCoordinadorOAdmin = (req, res, next) => {
  try {
    if (!['coordinador', 'admin'].includes(req.usuario.rol)) {
      return res.status(403).json({
        message: 'Acceso denegado. Se requieren permisos de coordinador o administrador.'
      });
    }
    next();
  } catch (error) {
    console.error('Error en middleware esCoordinadorOAdmin:', error);
    res.status(500).json({
      message: 'Error del servidor en verificación de permisos.'
    });
  }
};

/**
 * 🔒 Middleware: Solo administradores o coordinadores (versión alternativa)
 */
export const esAdminOCoordinador = (req, res, next) => {
  try {
    if (req.usuario.rol !== 'admin' && req.usuario.rol !== 'coordinador') {
      return res.status(403).json({
        message: 'Acceso denegado. Solo administradores o coordinadores pueden realizar esta acción.'
      });
    }
    next();
  } catch (error) {
    console.error('Error en middleware esAdminOCoordinador:', error);
    res.status(500).json({
      message: 'Error del servidor en verificación de permisos.'
    });
  }
};
