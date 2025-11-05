import Usuario from '../models/Usuario.js';

/**
 * 🔹 Obtener lista de usuarios
 * Si se pasa ?rol=docente, filtra solo docentes.
 */
export const obtenerUsuarios = async (req, res) => {
  try {
    const filtro = {};

    // Si se envía un rol como parámetro, lo usamos como filtro
    if (req.query.rol) {
      filtro.rol = req.query.rol;
    }

    // Buscar usuarios, excluyendo el campo password
    const usuarios = await Usuario.find(filtro).select('-password');

    if (!usuarios || usuarios.length === 0) {
      return res.status(404).json({ message: 'No se encontraron usuarios' });
    }

    res.status(200).json(usuarios);
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({ message: 'Error del servidor al obtener usuarios' });
  }
};
