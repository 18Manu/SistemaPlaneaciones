# MANUAL DE USUARIO  
### Sistema de Gestión de Planeación Didáctica  
**Versión:** 1.0.0  
**Autores:**  
- Ing. Manuel Mata   
**Fecha:** Octubre 2025  

---

## 1. Introducción
El **Sistema de Gestión de Planeación Didáctica** es una herramienta que permite gestionar de forma eficiente la planeación, seguimiento y evaluación académica.  
Este manual tiene como objetivo guiar al usuario en el uso del sistema, desde el inicio de sesión hasta la generación de reportes.

---

## 2. Requerimientos del Sistema
| Tipo | Requerimiento |
|------|----------------|
| **Hardware** | Procesador Intel i3 o superior, 4GB RAM, 200MB libres |
| **Software** | Navegador Chrome, Edge o Firefox (última versión) |
| **Red** | Conexión estable a Internet |
| **Permisos** | Credenciales válidas asignadas por el administrador |

---

## 3. Acceso al Sistema
1. Abra el navegador e ingrese la dirección del sistema (`http://localhost:5173` o la URL oficial).  
2. Ingrese su **usuario** y **contraseña**.  
3. Haga clic en **Iniciar Sesión**.  
> En caso de olvidar la contraseña, comuníquese con el administrador.

---

## 4. Módulos Principales
| Módulo | Descripción |
|--------|--------------|
| **Inicio / Dashboard** | Vista general del sistema y accesos rápidos |
| **Planeación Didáctica** | Creación y edición de planeaciones académicas |
| **Avances por Parcial** | Registro y seguimiento de avances |
| **Evidencias** | Carga y validación de documentos de respaldo |
| **Reportes** | Generación de informes en PDF o Excel |
| **Usuarios** *(admin)* | Gestión de cuentas y roles de usuario |

---

## 5. Uso del Sistema

### 5.1 Crear Planeación Didáctica
1. Ir a **Planeación Didáctica → Nueva Planeación**.  
2. Llenar los campos requeridos.  
3. Presionar **Guardar**.

### 5.2 Registrar Avances
1. Entrar a **Avances por Parcial**.  
2. Seleccionar el parcial (1°, 2° o 3°).  
3. Registrar información y guardar los cambios.

### 5.3 Subir Evidencias
1. Acceder a **Evidencias → Cargar Evidencia**.  
2. Adjuntar los archivos solicitados.  
3. Confirmar con **Enviar**.

### 5.4 Generar Reportes
1. Ir a **Reportes**.  
2. Elegir tipo de reporte (Planeaciones, Avances o Evidencias).  
3. Seleccionar formato (PDF o Excel).  
4. Hacer clic en **Generar**.

---

## 6. Seguridad
- Autenticación con **JWT**.  
- Cifrado de contraseñas.  
- HTTPS en producción.  
- Control de acceso por roles.

---

## 7. Roles del Sistema
| Rol | Permisos |
|-----|-----------|
| **Administrador** | Gestiona usuarios y parámetros del sistema |
| **Docente** | Registra planeaciones, avances y evidencias |
| **Coordinador** | Revisa y aprueba planeaciones |

---


- **Cerrar sesión:**  
  Menú inferior → *Cerrar sesión*.

---

## 8. Soporte Técnico
- **Correos:** josemanuel.mata.h@gmail.com

- **Responsables:** Manuel Mata 
- **Horario:** Lunes a Viernes, 9:00–18:00 hrs

---

## 9. Créditos
| Rol | Nombre | Contribución |
|------|--------|---------------|
| Desarrollador | Manuel Mata | Backend y frontend, Seguridad, despliegue y documentación |
| Área académica | Gestión de Planeación | Validación funcional |

---

## 11. Control de Versiones
| Versión | Fecha | Descripción |
|----------|--------|-------------|
| 1.0.0 | --/11/2025 | Versión inicial y estable |

---

## 12. Conclusión
El sistema ofrece una plataforma eficiente y segura para la planeación y seguimiento docente, fortaleciendo la trazabilidad académica y la automatización de reportes.
