import sgMail from '@sendgrid/mail';

class NotificacionService {
  constructor() {
    this.enabled = process.env.NOTIFICATIONS_ENABLED === 'true';
    this.fromEmail = process.env.SENDGRID_FROM_EMAIL;
    this.fromName = process.env.SENDGRID_FROM_NAME;
    
    if (this.enabled && process.env.SENDGRID_API_KEY) {
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);
      console.log('📧 Servicio de notificaciones por email CONFIGURADO');
      console.log('📧 From Email:', this.fromEmail);
      console.log('📧 From Name:', this.fromName);
    } else {
      console.log('⚠️  Servicio de notificaciones DESACTIVADO - Verifica SENDGRID_API_KEY');
    }
  }

  async enviarEmail(destinatario, asunto, contenidoHTML, contenidoTexto = '') {
    if (!this.enabled) {
      console.log('📧 [SIMULADO] Email no enviado (notificaciones desactivadas)');
      console.log(`   Para: ${destinatario}`);
      console.log(`   Asunto: ${asunto}`);
      return { success: true, simulated: true };
    }

    try {
      const msg = {
        to: destinatario,
        from: {
          email: this.fromEmail,
          name: this.fromName
        },
        subject: asunto,
        text: contenidoTexto || this.convertirHTMLaTexto(contenidoHTML),
        html: contenidoHTML
      };

      console.log(' Intentando enviar email con configuración:', {
        from: `${this.fromName} <${this.fromEmail}>`,
        to: destinatario,
        subject: asunto,
        enabled: this.enabled
      });

      const response = await sgMail.send(msg);
      console.log(` Email enviado exitosamente a: ${destinatario}`);
      return { success: true, response };
      
    } catch (error) {
      console.error(' Error detallado enviando email:');
      console.error('Código:', error.code);
      console.error('Mensaje:', error.message);
      
      // MOSTRAR EL ERROR REAL DE SENDGRID
      if (error.response && error.response.body) {
        console.error('SendGrid Error Details:', JSON.stringify(error.response.body, null, 2));
        
        // Mostrar errores específicos de SendGrid
        if (error.response.body.errors) {
          error.response.body.errors.forEach((err, index) => {
            console.error(`SendGrid Error ${index + 1}:`, err);
          });
        }
      }
      
      return { 
        success: false, 
        error: error.message,
        details: error.response?.body 
      };
    }
  }

  // Función auxiliar para convertir HTML a texto plano
  convertirHTMLaTexto(html) {
    return html
      .replace(/<[^>]*>/g, '') // Eliminar tags HTML
      .replace(/\s+/g, ' ') // Reducir espacios múltiples
      .trim();
  }

  // Notificación cuando planeación es aprobada/rechazada
  async notificarRevisionPlaneacion(planeacion, estado, observaciones = '') {
    const destinatario = 'josemanuel.mata.h@gmail.com'; // Temporal para testing
    const estadoTexto = estado === 'aprobado' ? 'APROBADA' : 'RECHAZADA';
    
    const asunto = ` Planeación ${estadoTexto} - ${planeacion.materia}`;
    
    const contenidoHTML = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: ${estado === 'aprobado' ? '#27ae60' : '#e74c3c'};">
          ${estado === 'aprobado' ? '✅ Planeación Aprobada' : '❌ Planeación Requiere Modificaciones'}
        </h2>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Detalles de la Planeación</h3>
          <p><strong>Materia:</strong> ${planeacion.materia}</p>
          <p><strong>Parcial:</strong> ${planeacion.parcial}</p>
          <p><strong>Ciclo Escolar:</strong> ${planeacion.cicloEscolar}</p>
          <p><strong>Fecha de Revisión:</strong> ${new Date().toLocaleDateString()}</p>
        </div>

        ${observaciones ? `
        <div style="background: #fff3cd; padding: 15px; border-radius: 6px; border-left: 4px solid #ffc107;">
          <h4 style="margin-top: 0;">Observaciones del Coordinador:</h4>
          <p style="margin: 0;">${observaciones}</p>
        </div>
        ` : ''}

        <div style="margin-top: 20px; padding: 15px; background: #e8f4fd; border-radius: 6px;">
          <p style="margin: 0;">
            <strong>Próximos pasos:</strong><br>
            ${estado === 'aprobado' 
              ? 'Tu planeación ha sido aprobada y está lista para implementarse.' 
              : 'Por favor, revisa las observaciones y realiza las modificaciones necesarias.'}
          </p>
        </div>

        <footer style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666;">
          <p>Sistema de Gestión Académica<br>
          <small>Este es un mensaje automático, por favor no respondas a este correo.</small></p>
        </footer>
      </div>
    `;

    console.log(`📧 Notificando revisión de planeación a: ${destinatario}`);
    return await this.enviarEmail(destinatario, asunto, contenidoHTML);
  }

  // Recordatorio de avances pendientes
  async enviarRecordatorioAvance(profesor, email, avancesPendientes) {
    // Temporal: usar siempre tu email para testing
    const emailDestino = 'josemanuel.mata.h@gmail.com ';
    
    const asunto = `⏰ Recordatorio - Avances Pendientes`;
    
    const contenidoHTML = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #e67e22;">Recordatorio de Avances Pendientes</h2>
        
        <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">¡Hola ${profesor}!</h3>
          <p>Tienes <strong>${avancesPendientes.length}</strong> avance(s) pendiente(s) de registrar:</p>
          
          <ul style="list-style: none; padding: 0;">
            ${avancesPendientes.map(avance => `
              <li style="padding: 10px; background: white; margin: 5px 0; border-radius: 4px; border-left: 4px solid #3498db;">
                <strong>${avance.materia}</strong> - Parcial ${avance.parcial} (${avance.porcentaje}% completado)
              </li>
            `).join('')}
          </ul>
        </div>

        <div style="background: #d4edda; padding: 15px; border-radius: 6px;">
          <p style="margin: 0;">
            <strong>💡 No te olvides:</strong><br>
            Registrar tus avances a tiempo ayuda a mantener un mejor control académico.
          </p>
        </div>

        <footer style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666;">
          <p>Sistema de Gestión Académica<br>
          <small>Este es un recordatorio automático.</small></p>
        </footer>
      </div>
    `;

    console.log(`📧 Enviando recordatorio para profesor: ${profesor}`);
    return await this.enviarEmail(emailDestino, asunto, contenidoHTML);
  }

  // Notificación de evidencia validada
  async notificarValidacionEvidencia(evidencia, estado, observaciones = '') {
    const destinatario = 'josemanuel.mata.h@gmail.com '; // Temporal para testing
    const estadoTexto = estado === 'validada' ? 'VALIDADA' : 'RECHAZADA';
    
    const asunto = `📋 Evidencia ${estadoTexto} - ${evidencia.nombreCurso}`;
    
    const contenidoHTML = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: ${estado === 'validada' ? '#27ae60' : '#e74c3c'};">
          ${estado === 'validada' ? '✅ Evidencia Validada' : '❌ Evidencia Requiere Ajustes'}
        </h2>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Detalles de la Evidencia</h3>
          <p><strong>Curso/Capacitación:</strong> ${evidencia.nombreCurso}</p>
          <p><strong>Institución:</strong> ${evidencia.institucion}</p>
          <p><strong>Horas Acreditadas:</strong> ${evidencia.horasAcreditadas}</p>
          <p><strong>Tipo:</strong> ${evidencia.tipoCapacitacion}</p>
          <p><strong>Fecha de Validación:</strong> ${new Date().toLocaleDateString()}</p>
        </div>

        ${observaciones ? `
        <div style="background: #fff3cd; padding: 15px; border-radius: 6px; border-left: 4px solid #ffc107;">
          <h4 style="margin-top: 0;">Observaciones del Validador:</h4>
          <p style="margin: 0;">${observaciones}</p>
        </div>
        ` : ''}

        ${estado === 'validada' ? `
        <div style="background: #d4edda; padding: 15px; border-radius: 6px; margin-top: 20px;">
          <p style="margin: 0;">
            <strong>¡Felicidades!</strong><br>
            Tu evidencia ha sido validada y acreditada exitosamente.
          </p>
        </div>
        ` : ''}

        <footer style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666;">
          <p>Sistema de Gestión Académica<br>
          <small>Este es un mensaje automático, por favor no respondas a este correo.</small></p>
        </footer>
      </div>
    `;

    console.log(`📧 Notificando validación de evidencia a: ${destinatario}`);
    return await this.enviarEmail(destinatario, asunto, contenidoHTML);
  }

  // Alertas del sistema para coordinadores
  async enviarAlertaCoordinadores(asunto, mensaje, datosAdicionales = {}) {
    // Temporal: usar tu email para testing
    const coordinadores = ['josemanuel.mata.h@gmail.com '];
    
    const contenidoHTML = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #e74c3c;">🚨 Alerta del Sistema</h2>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">${asunto}</h3>
          <p>${mensaje}</p>
          
          ${Object.keys(datosAdicionales).length > 0 ? `
          <div style="margin-top: 15px;">
            <h4>Información Adicional:</h4>
            <pre style="background: white; padding: 10px; border-radius: 4px; font-size: 12px;">
${JSON.stringify(datosAdicionales, null, 2)}
            </pre>
          </div>
          ` : ''}
        </div>

        <div style="background: #f8d7da; padding: 15px; border-radius: 6px;">
          <p style="margin: 0;">
            <strong>⚠️ Esta alerta requiere tu atención.</strong>
          </p>
        </div>

        <footer style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666;">
          <p>Sistema de Gestión Académica - Alertas Automáticas</p>
        </footer>
      </div>
    `;

    // Enviar a todos los coordinadores
    const resultados = [];
    for (const coordinador of coordinadores) {
      console.log(`📧 Enviando alerta a coordinador: ${coordinador}`);
      const resultado = await this.enviarEmail(coordinador, `🚨 ${asunto}`, contenidoHTML);
      resultados.push({ coordinador, resultado });
    }

    return resultados;
  }

  // Método para probar la configuración de SendGrid
  async probarConfiguracion() {
    console.log('🧪 Probando configuración de SendGrid...');
    console.log('📧 API Key presente:', !!process.env.SENDGRID_API_KEY);
    console.log('📧 From Email:', this.fromEmail);
    console.log('📧 From Name:', this.fromName);
    console.log('📧 Notificaciones habilitadas:', this.enabled);

    if (!this.enabled) {
      console.log('⚠️  Notificaciones desactivadas en .env');
      return { success: false, reason: 'NOTIFICATIONS_ENABLED=false' };
    }

    try {
      const testMsg = {
        to: 'josemanuel.mata.h@gmail.com ',
        from: {
          email: this.fromEmail,
          name: this.fromName
        },
        subject: '🧪 Prueba de Configuración - SendGrid',
        text: 'Este es un email de prueba del Sistema de Gestión Académica.',
        html: '<h2>🧪 Prueba de Configuración</h2><p>Este es un email de prueba del Sistema de Gestión Académica.</p>'
      };

      console.log('📧 Enviando email de prueba...');
      const response = await sgMail.send(testMsg);
      console.log('✅ Prueba exitosa - Email enviado correctamente');
      return { success: true, response };
      
    } catch (error) {
      console.error('❌ Error en prueba de configuración:');
      console.error('Código:', error.code);
      console.error('Mensaje:', error.message);
      
      if (error.response && error.response.body) {
        console.error('SendGrid Error Details:', JSON.stringify(error.response.body, null, 2));
      }
      
      return { 
        success: false, 
        error: error.message,
        details: error.response?.body 
      };
    }
  }
}

// Crear instancia única del servicio
const notificacionService = new NotificacionService();
export default notificacionService;

// Función de inicialización para server.js
export function initEmailService() {
  return notificacionService;
}