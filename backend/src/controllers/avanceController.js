import Avance from '../models/Avance.js';
import notificacionService from '../services/notificacionService.js';
import Profesor from '../models/Profesor.js';

// Crear avance 
export const crearAvance = async (req, res) => {
  try {
    console.log(' Creando avance con datos:', JSON.stringify(req.body, null, 2));
    
    // Validar campos requeridos
    const { materia, parcial } = req.body;
    if (!materia || !parcial) {
      return res.status(400).json({
        message: 'Campos requeridos faltantes',
        required: ['materia', 'parcial'],
        received: { materia, parcial }
      });
    }

    // Para profesores, asignar automáticamente su usuario_id y nombre
    if (req.usuario.rol === 'profesor') {
      const perfilProfesor = await Profesor.findOne({ usuario: req.usuario._id });
      if (!perfilProfesor) {
        return res.status(404).json({ message: 'Perfil de profesor no encontrado' });
      }
      req.body.usuario_id = req.usuario._id;
      req.body.profesor = req.usuario.nombre;
    }

    // Calcular porcentaje automáticamente si no se proporciona
    const temasPlaneados = req.body.temasPlaneados || [];
    const temasCubiertos = req.body.temasCubiertos || [];
    let porcentajeCalculado = 0;
    
    if (temasPlaneados.length > 0) {
      porcentajeCalculado = Math.round((temasCubiertos.length / temasPlaneados.length) * 100);
    }

    // Preparar datos con valores por defecto
    const datosAvance = {
      ...req.body,
      porcentajeAvance: req.body.porcentajeAvance || porcentajeCalculado,
      cicloEscolar: req.body.cicloEscolar || `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
      temasPlaneados: temasPlaneados,
      temasCubiertos: temasCubiertos,
      actividadesRealizadas: req.body.actividadesRealizadas || [],
      dificultades: req.body.dificultades || '',
      observaciones: req.body.observaciones || ''
    };

    console.log(' Creando nuevo documento Avance con datos:', datosAvance);
    const nuevo = new Avance(datosAvance);
    console.log(' Avance creado en memoria:', nuevo);
    
    console.log(' Guardando en base de datos...');
    await nuevo.save();
    console.log(' Avance guardado exitosamente');
    
    res.status(201).json({
      message: 'Avance creado correctamente',
      data: nuevo
    });
  } catch (error) {
    console.error(' ERROR en crearAvance:');
    console.error('Mensaje:', error.message);
    console.error('Nombre del error:', error.name);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(e => e.message);
      console.error('Errores de validación:', errors);
      return res.status(400).json({
        message: 'Error de validación',
        errors: errors
      });
    }

    console.error('Stack completo:', error.stack);
    res.status(500).json({ 
      message: 'Error interno al crear avance',
      error: error.message
    });
  }
};

// Obtener todos los avances (con filtros)
export const obtenerAvances = async (req, res) => {
  try {
    const { profesor, materia, parcial, cumplimiento, ciclo } = req.query;
    const filtro = {};
    
    // Si es profesor, solo puede ver sus propios avances
    if (req.usuario.rol === 'profesor') {
      filtro.usuario_id = req.usuario._id;
    }
    
    if (profesor) filtro.profesor = profesor;
    if (materia) filtro.materia = materia;
    if (parcial) filtro.parcial = parseInt(parcial);
    if (cumplimiento) filtro.cumplimiento = cumplimiento;
    if (ciclo) filtro.cicloEscolar = ciclo;

    console.log(' Buscando avances con filtro:', filtro);
    const avances = await Avance.find(filtro).sort({ fechaRegistro: -1 });
    console.log(` Encontrados ${avances.length} avances`);
    
    res.json(avances);
  } catch (error) {
    console.error(' Error obteniendo avances:', error);
    res.status(500).json({ message: error.message });
  }
};

// Obtener avance por ID
export const obtenerAvancePorId = async (req, res) => {
  try {
    console.log('🔍 Buscando avance con ID:', req.params.id);
    const avance = await Avance.findById(req.params.id);
    
    if (!avance) {
      console.log(' Avance no encontrado');
      return res.status(404).json({ message: 'Avance no encontrado' });
    }

    // Verificar permisos: profesores solo pueden ver sus propios avances
    if (req.usuario.rol === 'profesor' && avance.usuario_id.toString() !== req.usuario._id.toString()) {
      return res.status(403).json({ message: 'No tienes permisos para ver este avance' });
    }
    
    console.log(' Avance encontrado');
    res.json(avance);
  } catch (error) {
    console.error(' Error obteniendo avance por ID:', error);
    res.status(500).json({ message: error.message });
  }
};

// Actualizar avance por ID
export const actualizarAvance = async (req, res) => {
  try {
    console.log(' Actualizando avance ID:', req.params.id);
    console.log('Datos de actualización:', req.body);
    
    const avance = await Avance.findById(req.params.id);
    if (!avance) {
      return res.status(404).json({ message: 'Avance no encontrado' });
    }

    // Verificar permisos: profesores solo pueden actualizar sus propios avances
    if (req.usuario.rol === 'profesor' && avance.usuario_id.toString() !== req.usuario._id.toString()) {
      return res.status(403).json({ message: 'No tienes permisos para actualizar este avance' });
    }

    const actualizado = await Avance.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true, runValidators: true }
    );
    
    console.log(' Avance actualizado');
    res.json(actualizado);
  } catch (error) {
    console.error(' Error actualizando avance:', error);
    res.status(500).json({ message: error.message });
  }
};

// Eliminar avance
export const eliminarAvance = async (req, res) => {
  try {
    console.log('🗑️ Eliminando avance ID:', req.params.id);
    
    const avance = await Avance.findById(req.params.id);
    if (!avance) {
      return res.status(404).json({ message: 'Avance no encontrado' });
    }

    // Verificar permisos: profesores solo pueden eliminar sus propios avances
    if (req.usuario.rol === 'profesor' && avance.usuario_id.toString() !== req.usuario._id.toString()) {
      return res.status(403).json({ message: 'No tienes permisos para eliminar este avance' });
    }

    const resultado = await Avance.findByIdAndDelete(req.params.id);
    
    console.log(' Avance eliminado');
    res.json({ message: 'Avance eliminado correctamente' });
  } catch (error) {
    console.error(' Error eliminando avance:', error);
    res.status(500).json({ message: error.message });
  }
};

// NUEVA FUNCIÓN: Enviar recordatorios por email (SOLO coordinadores y admin)
export const enviarRecordatorios = async (req, res) => {
  try {
    // Solo coordinadores y admin pueden enviar recordatorios
    if (!['coordinador', 'admin'].includes(req.usuario.rol)) {
      return res.status(403).json({ message: 'No tienes permisos para enviar recordatorios' });
    }

    const { ciclo } = req.body;
    const cicloFiltro = ciclo || `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;
    
    console.log('📧 Iniciando envío de recordatorios para ciclo:', cicloFiltro);

    // Obtener profesores con avances pendientes
    const avancesPendientes = await Avance.aggregate([
      {
        $match: {
          cicloEscolar: cicloFiltro,
          cumplimiento: { $in: ['parcial', 'no cumplido'] }
        }
      },
      {
        $group: {
          _id: '$profesor',
          pendientes: { $push: {
            materia: '$materia',
            parcial: '$parcial',
            porcentaje: '$porcentajeAvance',
            cumplimiento: '$cumplimiento'
          }}
        }
      }
    ]);

    console.log(`📊 Encontrados ${avancesPendientes.length} profesores con avances pendientes`);

    let resultados = [];
    let emailsEnviados = 0;
    
    // Enviar recordatorios a cada profesor
    for (const profesorData of avancesPendientes) {
      try {
        // En un sistema real, obtendrías el email del profesor de la base de datos
        const profesorEmail = 'josemanuel.mata.h@gmail.com ';
        
        console.log(`📨 Enviando recordatorio a: ${profesorData._id} (${profesorEmail})`);
        
        const resultado = await notificacionService.enviarRecordatorioAvance(
          profesorData._id,
          profesorEmail,
          profesorData.pendientes
        );
        
        if (resultado.success) {
          emailsEnviados++;
        }
        
        resultados.push({
          profesor: profesorData._id,
          email: profesorEmail,
          pendientes: profesorData.pendientes.length,
          envioExitoso: resultado.success,
          error: resultado.error
        });

      } catch (error) {
        console.error(`❌ Error enviando a ${profesorData._id}:`, error);
        resultados.push({
          profesor: profesorData._id,
          error: error.message,
          envioExitoso: false
        });
      }
    }

    console.log(`✅ Envío de recordatorios completado: ${emailsEnviados}/${avancesPendientes.length} exitosos`);

    res.json({
      message: `Recordatorios enviados a ${emailsEnviados} de ${avancesPendientes.length} profesores`,
      totalProfesores: avancesPendientes.length,
      emailsEnviados: emailsEnviados,
      resultados: resultados
    });

  } catch (error) {
    console.error('❌ Error en enviarRecordatorios:', error);
    res.status(500).json({ 
      message: 'Error enviando recordatorios',
      error: error.message 
    });
  }
};

// Estadísticas de cumplimiento por profesor
export const obtenerEstadisticasProfesor = async (req, res) => {
  try {
    const { profesor, ciclo } = req.query;
    
    let filtro = {};
    
    // Si es profesor, solo puede ver sus propias estadísticas
    if (req.usuario.rol === 'profesor') {
      filtro.usuario_id = req.usuario._id;
    } else if (profesor) {
      filtro.profesor = profesor;
    } else {
      return res.status(400).json({ message: 'Se requiere el parámetro profesor para coordinadores/admin' });
    }

    if (ciclo) filtro.cicloEscolar = ciclo;

    console.log(' Obteniendo estadísticas con filtro:', filtro);
    const avances = await Avance.find(filtro);
    
    const estadisticas = {
      total: avances.length,
      cumplido: avances.filter(a => a.cumplimiento === 'cumplido').length,
      parcial: avances.filter(a => a.cumplimiento === 'parcial').length,
      noCumplido: avances.filter(a => a.cumplimiento === 'no cumplido').length,
      promedioPorcentaje: avances.length > 0 ? 
        (avances.reduce((acc, curr) => acc + curr.porcentajeAvance, 0) / avances.length).toFixed(2) : 0,
      porMateria: {},
      porParcial: {
        1: avances.filter(a => a.parcial === 1).length,
        2: avances.filter(a => a.parcial === 2).length,
        3: avances.filter(a => a.parcial === 3).length
      }
    };

    // Agrupar por materia
    avances.forEach(avance => {
      if (!estadisticas.porMateria[avance.materia]) {
        estadisticas.porMateria[avance.materia] = [];
      }
      estadisticas.porMateria[avance.materia].push(avance);
    });

    console.log(' Estadísticas generadas');
    res.json(estadisticas);
  } catch (error) {
    console.error(' Error obteniendo estadísticas:', error);
    res.status(500).json({ message: error.message });
  }
};

// Reporte general de cumplimiento (SOLO coordinadores y admin)
export const obtenerReporteGeneral = async (req, res) => {
  try {
    // Solo coordinadores y admin pueden ver reportes generales
    if (!['coordinador', 'admin'].includes(req.usuario.rol)) {
      return res.status(403).json({ message: 'No tienes permisos para ver reportes generales' });
    }

    const { ciclo } = req.query;
    const filtro = ciclo ? { cicloEscolar: ciclo } : {};

    console.log(' Generando reporte general');
    const avances = await Avance.find(filtro);
    
    const reporte = {
      totalAvances: avances.length,
      cumplimientoGeneral: {
        cumplido: avances.filter(a => a.cumplimiento === 'cumplido').length,
        parcial: avances.filter(a => a.cumplimiento === 'parcial').length,
        noCumplido: avances.filter(a => a.cumplimiento === 'no cumplido').length
      },
      porProfesor: {},
      porMateria: {},
      porParcial: {
        1: avances.filter(a => a.parcial === 1).length,
        2: avances.filter(a => a.parcial === 2).length,
        3: avances.filter(a => a.parcial === 3).length
      },
      promedioGlobal: avances.length > 0 ? 
        (avances.reduce((acc, curr) => acc + curr.porcentajeAvance, 0) / avances.length).toFixed(2) : 0
    };

    // Agrupar por profesor
    avances.forEach(avance => {
      if (!reporte.porProfesor[avance.profesor]) {
        reporte.porProfesor[avance.profesor] = {
          total: 0,
          cumplido: 0,
          parcial: 0,
          noCumplido: 0,
          promedioPorcentaje: 0
        };
      }
      reporte.porProfesor[avance.profesor].total++;
      reporte.porProfesor[avance.profesor][avance.cumplimiento]++;
    });

    // Calcular promedios por profesor
    Object.keys(reporte.porProfesor).forEach(profesor => {
      const profAvances = avances.filter(a => a.profesor === profesor);
      reporte.porProfesor[profesor].promedioPorcentaje = profAvances.length > 0 ?
        (profAvances.reduce((acc, curr) => acc + curr.porcentajeAvance, 0) / profAvances.length).toFixed(2) : 0;
    });

    // Agrupar por materia
    avances.forEach(avance => {
      if (!reporte.porMateria[avance.materia]) {
        reporte.porMateria[avance.materia] = {
          total: 0,
          cumplido: 0,
          parcial: 0,
          noCumplido: 0
        };
      }
      reporte.porMateria[avance.materia].total++;
      reporte.porMateria[avance.materia][avance.cumplimiento]++;
    });

    console.log(' Reporte general generado');
    res.json(reporte);
  } catch (error) {
    console.error(' Error generando reporte general:', error);
    res.status(500).json({ message: error.message });
  }
};

// Datos para gráficas (SOLO coordinadores y admin)
export const obtenerDatosGraficas = async (req, res) => {
  try {
    // Solo coordinadores y admin pueden ver gráficas generales
    if (!['coordinador', 'admin'].includes(req.usuario.rol)) {
      return res.status(403).json({ message: 'No tienes permisos para ver gráficas generales' });
    }

    const { ciclo } = req.query;
    const filtro = ciclo ? { cicloEscolar: ciclo } : {};

    console.log(' Obteniendo datos para gráficas');
    const avances = await Avance.find(filtro);

    const datos = {
      cumplimiento: {
        labels: ['Cumplido', 'Parcial', 'No Cumplido'],
        data: [
          avances.filter(a => a.cumplimiento === 'cumplido').length,
          avances.filter(a => a.cumplimiento === 'parcial').length,
          avances.filter(a => a.cumplimiento === 'no cumplido').length
        ]
      },
      porParcial: {
        labels: ['Parcial 1', 'Parcial 2', 'Parcial 3'],
        data: [
          avances.filter(a => a.parcial === 1).length,
          avances.filter(a => a.parcial === 2).length,
          avances.filter(a => a.parcial === 3).length
        ]
      },
      porcentajePromedio: avances.length > 0 ? 
        Math.round(avances.reduce((acc, curr) => acc + curr.porcentajeAvance, 0) / avances.length) : 0
    };

    console.log(' Datos para gráficas generados');
    res.json(datos);
  } catch (error) {
    console.error(' Error obteniendo datos para gráficas:', error);
    res.status(500).json({ message: error.message });
  }
};