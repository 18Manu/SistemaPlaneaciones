import express from 'express';
import {
  registrar,
  login,
  obtenerPerfil,
  actualizarPerfil,
  obtenerUsuarios
} from '../controllers/authController.js';
import { autenticar, esCoordinadorOAdmin } from '../middlewares/auth.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Autenticación
 *   description: Gestión de usuarios y autenticación
 */

/**
 * @swagger
 * /api/auth/registrar:
 *   post:
 *     summary: Registrar nuevo usuario
 *     tags: [Autenticación]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - nombre
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *               nombre:
 *                 type: string
 *               rol:
 *                 type: string
 *                 enum: [profesor, admin, coordinador]
 *                 default: profesor
 *               numeroEmpleado:
 *                 type: string
 *               departamento:
 *                 type: string
 *               telefono:
 *                 type: string
 *               especialidad:
 *                 type: string
 *               materias:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Usuario registrado exitosamente
 *       400:
 *         description: Error en la solicitud
 *       500:
 *         description: Error del servidor
 */
router.post('/registrar', registrar);

/**
 * @swagger
 * /api/auth/registro:
 *   post:
 *     summary: Registrar nuevo usuario (alias)
 *     tags: [Autenticación]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - nombre
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *               nombre:
 *                 type: string
 *               rol:
 *                 type: string
 *                 enum: [profesor, admin, coordinador]
 *                 default: profesor
 *               numeroEmpleado:
 *                 type: string
 *               departamento:
 *                 type: string
 *               telefono:
 *                 type: string
 *               especialidad:
 *                 type: string
 *               materias:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Usuario registrado exitosamente
 *       400:
 *         description: Error en la solicitud
 *       500:
 *         description: Error del servidor
 */
router.post('/registro', registrar);

/**
 * @swagger
 * /api/auth/usuarios:
 *   get:
 *     summary: Obtener todos los usuarios (solo admin o coordinador)
 *     tags: [Autenticación]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de usuarios obtenida exitosamente
 *       401:
 *         description: No autorizado
 *       403:
 *         description: No tiene permisos de administrador o coordinador
 *       500:
 *         description: Error del servidor
 */
router.get('/usuarios', autenticar, esCoordinadorOAdmin, obtenerUsuarios);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Iniciar sesión
 *     tags: [Autenticación]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Login exitoso
 *       400:
 *         description: Campos requeridos faltantes
 *       401:
 *         description: Credenciales inválidas
 *       500:
 *         description: Error del servidor
 */
router.post('/login', login);

/**
 * @swagger
 * /api/auth/perfil:
 *   get:
 *     summary: Obtener perfil del usuario autenticado
 *     tags: [Autenticación]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Perfil obtenido exitosamente
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error del servidor
 */
router.get('/perfil', autenticar, obtenerPerfil);

/**
 * @swagger
 * /api/auth/perfil:
 *   put:
 *     summary: Actualizar perfil del usuario
 *     tags: [Autenticación]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *               telefono:
 *                 type: string
 *               especialidad:
 *                 type: string
 *               materias:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Perfil actualizado exitosamente
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Usuario no encontrado
 *       500:
 *         description: Error del servidor
 */
router.put('/perfil', autenticar, actualizarPerfil);

export default router;
