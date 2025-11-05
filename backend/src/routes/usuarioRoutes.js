import express from 'express';
import { obtenerUsuarios } from '../controllers/usuarioController.js';
import { autenticar } from '../controllers/authController.js';

const router = express.Router();

/**
 * 🔹 Ruta para obtener lista de usuarios
 * Ejemplo: GET /api/auth/usuarios?rol=docente
 * Protegida: requiere token válido (autenticar)
 */
router.get('/usuarios', autenticar, esCoordinadorOAdmin, obtenerUsuarios);


export default router;
