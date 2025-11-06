// controllers/reporteController.js
import Planeacion from '../models/Planeacion.js';
import Avance from '../models/Avance.js';
import Evidencia from '../models/Evidencia.js';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';

/**
 * 🔹 Reporte Institucional (JSON) — SEPARADO POR DOCENTES
 */
export const obtenerReporteInstitucionalJSON = async (req, res) => {
  try {
    const { ciclo } = req.query;
    const filtro = ciclo ? { cicloEscolar: ciclo } : {};

    const [planeaciones, avances, evidencias] = await Promise.all([
      Planeacion.find(filtro).lean(),
      Avance.find(filtro).lean(),
      Evidencia.find(filtro).lean(),
    ]);

    // Agrupar por docente
    const profesores = [...new Set([
      ...planeaciones.map(p => p.profesor),
      ...avances.map(a => a.profesor),
      ...evidencias.map(e => e.profesor),
    ])].filter(Boolean);

    const profesoresData = profesores.map(profesor => {
      const planes = planeaciones.filter(p => p.profesor === profesor);
      const avs = avances.filter(a => a.profesor === profesor);
      const evids = evidencias.filter(e => e.profesor === profesor);

      return {
        profesor,
        planeaciones: planes.map(p => ({
          materia: p.materia,
          estado: p.estado,
          ciclo: p.cicloEscolar
        })),
        avances: avs.map(a => ({
          materia: a.materia,
          porcentaje: a.porcentajeAvance,
          cumplimiento: a.cumplimiento,
        })),
        evidencias: evids.map(e => ({
          nombre: e.nombre,
          horas: e.horasAcreditadas || 0,
          estado: e.estado,
        })),
        resumen: {
          totalPlaneaciones: planes.length,
          totalAvances: avs.length,
          totalEvidencias: evids.length,
          promedioAvance: avs.length
            ? (avs.reduce((a, b) => a + b.porcentajeAvance, 0) / avs.length).toFixed(2)
            : 0,
          horasCapacitacion: evids.reduce((acc, e) => acc + (e.horasAcreditadas || 0), 0),
        }
      };
    });

    const aprobadas = planeaciones.filter(p => p.estado === 'aprobado').length;
    const cumplidas = avances.filter(a => a.cumplimiento === 'cumplido').length;
    const horasTotales = evidencias.reduce((a, b) => a + (b.horasAcreditadas || 0), 0);

    const reporte = {
      tipo: 'institucional',
      periodo: ciclo || 'Todos los ciclos',
      fechaGeneracion: new Date().toISOString(),
      resumenGeneral: {
        totalProfesores: profesores.length,
        totalPlaneaciones: planeaciones.length,
        totalAvances: avances.length,
        totalEvidencias: evidencias.length,
        porcentajeAprobacion: planeaciones.length
          ? ((aprobadas / planeaciones.length) * 100).toFixed(2)
          : 0,
        porcentajeCumplimiento: avances.length
          ? ((cumplidas / avances.length) * 100).toFixed(2)
          : 0,
        horasCapacitacionTotales: horasTotales,
      },
      docentes: profesoresData
    };

    res.json(reporte);
  } catch (error) {
    console.error('Error obteniendo reporte institucional:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * 👨‍🏫 Reporte por profesor (individual)
 */
export const obtenerReportePorProfesor = async (req, res) => {
  try {
    const { profesor, ciclo } = req.query;
    if (!profesor) return res.status(400).json({ message: 'Se requiere el parámetro profesor' });

    const filtro = { profesor };
    if (ciclo) filtro.cicloEscolar = ciclo;

    const [planeaciones, avances, evidencias] = await Promise.all([
      Planeacion.find(filtro).lean(),
      Avance.find(filtro).lean(),
      Evidencia.find(filtro).lean(),
    ]);

    const reporte = {
      tipo: 'profesor',
      profesor,
      periodo: ciclo || 'Todos los ciclos',
      fechaGeneracion: new Date().toISOString(),
      planeaciones: planeaciones.length,
      avances: avances.length,
      evidencias: evidencias.length,
      promedioAvance: avances.length
        ? (avances.reduce((acc, a) => acc + a.porcentajeAvance, 0) / avances.length).toFixed(2)
        : 0,
    };

    res.json(reporte);
  } catch (error) {
    console.error('Error obteniendo reporte por profesor:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * 📤 Exportar reportes (Excel / PDF)
 */
export const exportarReporte = async (req, res) => {
  try {
    const { tipo, formato, ciclo, profesor } = req.query;

    if (!tipo || !formato) {
      return res.status(400).json({ message: 'Debe especificar tipo y formato.' });
    }

    if (tipo === 'institucional') {
      const data = await obtenerDatosInstitucional(ciclo);
      return generarArchivo(formato, res, data, 'reporte-institucional', ciclo);
    }

    if (tipo === 'profesor') {
      if (!profesor) return res.status(400).json({ message: 'Debe especificar el nombre del profesor.' });
      const data = await obtenerDatosProfesor(profesor, ciclo);
      return generarArchivo(formato, res, data, `reporte-profesor-${profesor}`, ciclo);
    }

    res.status(400).json({ message: 'Tipo de reporte inválido.' });
  } catch (error) {
    console.error('Error exportando reporte:', error);
    res.status(500).json({ message: error.message });
  }
};

// ===============================
// FUNCIONES AUXILIARES
// ===============================
async function obtenerDatosInstitucional(ciclo) {
  const filtro = ciclo ? { cicloEscolar: ciclo } : {};
  const [planeaciones, avances, evidencias] = await Promise.all([
    Planeacion.find(filtro).lean(),
    Avance.find(filtro).lean(),
    Evidencia.find(filtro).lean(),
  ]);

  const profesores = [...new Set([
    ...planeaciones.map(p => p.profesor),
    ...avances.map(a => a.profesor),
    ...evidencias.map(e => e.profesor),
  ])].filter(Boolean);

  const reporteGeneral = {
    tipo: 'institucional',
    periodo: ciclo || 'Todos',
    fechaGeneracion: new Date().toISOString(),
    resumenGeneral: {
      totalProfesores: profesores.length,
      totalPlaneaciones: planeaciones.length,
      totalAvances: avances.length,
      totalEvidencias: evidencias.length,
    },
    docentes: [],
  };

  for (const profesor of profesores) {
    const planes = planeaciones.filter(p => p.profesor === profesor);
    const avs = avances.filter(a => a.profesor === profesor);
    const evids = evidencias.filter(e => e.profesor === profesor);
    const totalHoras = evids.reduce((acc, e) => acc + (e.horasAcreditadas || 0), 0);

    const detalleProfesor = {
      profesor,
      totalPlaneaciones: planes.length,
      planeacionesPorEstado: planes.reduce((acc, p) => {
        acc[p.estado] = (acc[p.estado] || 0) + 1;
        return acc;
      }, {}),
      totalAvances: avs.length,
      promedioAvance: avs.length
        ? (avs.reduce((a, b) => a + b.porcentajeAvance, 0) / avs.length).toFixed(2)
        : 0,
      cumplimientoAvances: avs.reduce((acc, a) => {
        acc[a.cumplimiento] = (acc[a.cumplimiento] || 0) + 1;
        return acc;
      }, {}),
      totalEvidencias: evids.length,
      horasCapacitacion: totalHoras,
      evidenciasValidadas: evids.filter(e => e.estado === 'validada').length,
    };

    reporteGeneral.docentes.push(detalleProfesor);
  }

  const aprobadas = planeaciones.filter(p => p.estado === 'aprobado').length;
  const cumplidas = avances.filter(a => a.cumplimiento === 'cumplido').length;
  const horasTotales = evidencias.reduce((a, b) => a + (b.horasAcreditadas || 0), 0);

  reporteGeneral.totales = {
    planeacionesAprobadas: aprobadas,
    porcentajeAprobacion: planeaciones.length
      ? ((aprobadas / planeaciones.length) * 100).toFixed(2)
      : 0,
    avancesCumplidos: cumplidas,
    porcentajeCumplimiento: avances.length
      ? ((cumplidas / avances.length) * 100).toFixed(2)
      : 0,
    horasCapacitacionTotales: horasTotales,
  };

  return reporteGeneral;
}

async function obtenerDatosProfesor(profesor, ciclo) {
  const filtro = { profesor };
  if (ciclo) filtro.cicloEscolar = ciclo;

  const [planeaciones, avances, evidencias] = await Promise.all([
    Planeacion.find(filtro).lean(),
    Avance.find(filtro).lean(),
    Evidencia.find(filtro).lean(),
  ]);

  return {
    tipo: 'profesor',
    profesor,
    periodo: ciclo || 'Todos',
    planeaciones: planeaciones.length,
    avances: avances.length,
    evidencias: evidencias.length,
    promedioAvance: avances.length
      ? (avances.reduce((a, b) => a + b.porcentajeAvance, 0) / avances.length).toFixed(2)
      : 0,
  };
}

async function generarArchivo(formato, res, data, nombre, ciclo) {
  if (!data || (Array.isArray(data) && data.length === 0)) {
    return res.status(404).json({ message: 'No hay datos para exportar.' });
  }

  // 🎨 Colores personalizados
  const colorPrimario = '#8E7CC3'; // Lila
  const colorSecundario = '#6AD7A8'; // Verde menta
  const colorTexto = '#333333';

  // ==========================================
  // 🔹 EXPORTAR EN PDF (DISEÑO PROFESIONAL)
  // ==========================================
  if (formato === 'pdf') {
    const doc = new PDFDocument({ margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${nombre}.pdf`);
    doc.pipe(res);

    // 🔸 Encabezado visual
    doc.rect(0, 0, doc.page.width, 80).fill(colorPrimario);
    doc.fillColor('white').fontSize(22).text(
      nombre.replace(/-/g, ' ').toUpperCase(),
      0,
      30,
      { align: 'center' }
    );

    doc.moveDown(3);
    doc.fillColor(colorTexto).fontSize(12);
    doc.text(`📅 Periodo: ${data.periodo || ciclo || 'General'}`);
    doc.text(`🗓️ Fecha de generación: ${new Date().toLocaleDateString()}`);
    doc.moveDown(2);

    // ==========================================
    // 📘 REPORTE INSTITUCIONAL
    // ==========================================
    if (data.tipo === 'institucional') {
      doc.fillColor(colorSecundario).fontSize(16).text('📊 Resumen General', { underline: true });
      doc.moveDown(1);

      Object.entries(data.resumenGeneral || {}).forEach(([k, v]) => {
        doc.fillColor(colorTexto).fontSize(12).text(`• ${k}: ${v}`);
      });

      doc.moveDown(1.5);
      doc.fillColor(colorSecundario).fontSize(16).text('📈 Totales', { underline: true });
      doc.moveDown(1);
      Object.entries(data.totales || {}).forEach(([k, v]) => {
        doc.fillColor(colorTexto).fontSize(12).text(`• ${k}: ${v}`);
      });

      // 🔹 Docentes con secciones separadas
      data.docentes?.forEach((prof) => {
        doc.addPage();
        doc.rect(0, 0, doc.page.width, 70).fill(colorPrimario);
        doc.fillColor('white').fontSize(20).text(`👨‍🏫 ${prof.profesor}`, 50, 25);

        doc.moveDown(3);
        doc.fillColor(colorSecundario).fontSize(14).text('📘 Planeaciones', { underline: true });
        Object.entries(prof.planeacionesPorEstado || {}).forEach(([estado, cantidad]) =>
          doc.fillColor(colorTexto).text(`• ${estado}: ${cantidad}`)
        );

        doc.moveDown(1);
        doc.fillColor(colorSecundario).text('📈 Avances', { underline: true });
        doc.fillColor(colorTexto)
          .text(`Total: ${prof.totalAvances}`)
          .text(`Promedio: ${prof.promedioAvance}%`);
        Object.entries(prof.cumplimientoAvances || {}).forEach(([estado, cantidad]) =>
          doc.text(`• ${estado}: ${cantidad}`)
        );

        doc.moveDown(1);
        doc.fillColor(colorSecundario).text('🎓 Evidencias', { underline: true });
        doc.fillColor(colorTexto)
          .text(`Total: ${prof.totalEvidencias}`)
          .text(`Validadas: ${prof.evidenciasValidadas}`)
          .text(`Horas capacitación: ${prof.horasCapacitacion}`);
      });
    }

    // ==========================================
    // 👨‍🏫 REPORTE INDIVIDUAL POR PROFESOR
    // ==========================================
    else if (data.tipo === 'profesor') {
      doc.rect(0, 130, doc.page.width - 100, 2).fill(colorSecundario);
      doc.moveDown(2);

      doc.fillColor(colorPrimario).fontSize(18).text(`👨‍🏫 Reporte del Profesor`, { align: 'center' });
      doc.fillColor(colorTexto).fontSize(22).text(`${data.profesor}`, { align: 'center' });
      doc.moveDown(2);

      // 🔸 Bloques de datos visuales
      const startY = doc.y;
      const boxWidth = 230;
      const boxHeight = 45;
      const margin = 35;

      const cajas = [
        { titulo: 'Planeaciones', valor: data.planeaciones },
        { titulo: 'Avances', valor: data.avances },
        { titulo: 'Evidencias', valor: data.evidencias },
        { titulo: 'Promedio Avance', valor: `${data.promedioAvance}%` },
      ];

      cajas.forEach((box, i) => {
        const x = 60 + (i % 2) * (boxWidth + margin);
        const y = startY + Math.floor(i / 2) * (boxHeight + 25);

        doc.rect(x, y, boxWidth, boxHeight)
          .fill(i % 2 === 0 ? colorSecundario : colorPrimario);

        doc.fillColor('white').fontSize(14).text(box.titulo, x + 15, y + 12);
        doc.fontSize(18).text(String(box.valor), x + 150, y + 10);
      });

      doc.moveDown(7);
      doc.fillColor(colorTexto).fontSize(12);
      doc.text(`📘 Periodo: ${data.periodo}`);
      doc.text(`🗓️ Fecha de generación: ${new Date().toLocaleDateString()}`);

      // Línea separadora final
      doc.moveDown(2);
      doc.moveTo(50, doc.y).lineTo(doc.page.width - 50, doc.y).strokeColor(colorSecundario).stroke();
      doc.moveDown(1.5);

      doc.fillColor(colorPrimario).fontSize(10)
        .text('Reporte generado automáticamente por el Sistema de Planeación Institucional', { align: 'center' });
    }

    doc.end();
    return;
  }

  // ==========================================
  // 🔹 EXPORTAR EN EXCEL
  // ==========================================
  if (formato === 'excel') {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Reporte');

    sheet.addRow([`Reporte: ${nombre}`]);
    sheet.addRow([`Periodo: ${ciclo || 'General'}`]);
    sheet.addRow([]);

    if (data.tipo === 'institucional') {
      sheet.addRow(['Resumen General']);
      Object.entries(data.resumenGeneral || {}).forEach(([k, v]) => sheet.addRow([k, v]));
      sheet.addRow([]);

      sheet.addRow(['Totales']);
      Object.entries(data.totales || {}).forEach(([k, v]) => sheet.addRow([k, v]));
      sheet.addRow([]);

      sheet.addRow(['Docentes']);
      sheet.addRow(['Profesor', 'Planeaciones', 'Avances', 'Promedio Avance', 'Evidencias', 'Horas']);
      data.docentes?.forEach(p => {
        sheet.addRow([
          p.profesor,
          p.totalPlaneaciones,
          p.totalAvances,
          p.promedioAvance,
          p.totalEvidencias,
          p.horasCapacitacion,
        ]);
      });
    } else if (data.tipo === 'profesor') {
      sheet.addRow(['Profesor', data.profesor]);
      sheet.addRow(['Periodo', data.periodo]);
      sheet.addRow(['Planeaciones', data.planeaciones]);
      sheet.addRow(['Avances', data.avances]);
      sheet.addRow(['Evidencias', data.evidencias]);
      sheet.addRow(['Promedio Avance', `${data.promedioAvance}%`]);
    }

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=${nombre}.xlsx`);
    await workbook.xlsx.write(res);
    res.end();
    return;
  }

  res.status(400).json({ message: 'Formato no soportado. Use "excel" o "pdf".' });
}
