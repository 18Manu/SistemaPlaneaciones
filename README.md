# Gestión de Planeación Académica

## Objetivo
El alumnado optimizará el proceso, desarrollo y liberación de componentes de software mediante la integración de metodologías, modelos, herramientas y servicios para la implementación de aplicaciones 

## Descripción
Aplicación web para instituciones educativas de nivel media superior, que permite:  
- Dar seguimiento al cumplimiento de la planeación didáctica de los docentes.  
- Controlar avances en cada parcial.  
- Registrar evidencias de capacitación docente durante el periodo académico.

## Funcionalidades Principales

| Funcionalidad | Descripción |
|---------------|------------|
| **Gestión de Planeación Didáctica** | Registro de planeaciones por materia y parcial, revisión y aprobación por coordinadores, historial de ciclos anteriores. |
| **Control de Avances por Parcial** | Registro de avances por parcial, indicador de cumplimiento, reportes visuales por profesor, materia y parcial. |
| **Evidencias de Curso y Capacitación** | Adjuntar PDF, imágenes o constancias de cursos, validación por coordinación académica, campos de información detallada. |
| **Reportes y Seguimiento Institucional** | Reportes globales de cumplimiento de planeaciones, avances por parcial, cursos acreditados; exportación en PDF o Excel. |


## Tecnologías
| Tipo | Herramientas |
|------|-------------|
| Frontend | React |
| Backend | Node.js, Express |
| Base de datos | MongoDB |
| Seguridad | JWT, OAuth2, HTTPS |
| Contenedores | Docker |
| Versionamiento | Git, GitHub |
| APIs de terceros | Correo Electronico (recordatorios) |

## Instalación

### Backend
```bash
git clone <URL_DEL_REPOSITORIO>
cd backend
npm install
nom run dev
Configurar .env
### FrontEnd
cd frontend
npm install
npm run dev

##Equipo
| Nombre           | Rol                |
| ---------------- | ------------------ |
| Manuel           | Frontend & Backend |
