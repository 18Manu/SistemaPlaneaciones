import React, { useState, useEffect } from 'react'
import { reporteService, usuarioService } from '../services/api'
import { useAuth } from '../context/AuthContext'
import '../styles/ReportesStyles.css'

const ReportesPage = () => {
  const [reporteInstitucional, setReporteInstitucional] = useState(null)
  const [reporteProfesor, setReporteProfesor] = useState(null)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('institucional')
  const [filters, setFilters] = useState({ ciclo: '', profesor: '' })

  const { user, isCoordinador, isAdmin, token } = useAuth()

  // 🔹 Cargar reporte institucional al montar o cambiar pestaña
  useEffect(() => {
    if (activeTab === 'institucional') {
      loadReporteInstitucional()
    }
  }, [activeTab])

  // 🔹 Acceso restringido
  if (!isCoordinador() && !isAdmin()) {
    return (
      <div className="reportes-container">
        <div className="unauthorized-access">
          <div className="unauthorized-icon">🚫</div>
          <h1>Acceso No Autorizado</h1>
          <p>
            No tienes permisos para acceder a los reportes institucionales.
            Esta sección está disponible solo para coordinadores y administradores.
          </p>
          <div className="unauthorized-info">
            <p><strong>Tu rol actual:</strong> {user?.rol || 'Usuario'}</p>
            <p><strong>Roles permitidos:</strong> Coordinador, Administrador</p>
          </div>
          <button className="btn-primary" onClick={() => window.history.back()}>
            Volver Atrás
          </button>
        </div>
      </div>
    )
  }

  // 🔹 Cargar reporte institucional
  const loadReporteInstitucional = async () => {
    setLoading(true)
    try {
      setReporteInstitucional(null)
      const response = await reporteService.getInstitucional(filters.ciclo)
      if (response?.data) {
        setReporteInstitucional(response.data)
      } else {
        console.warn('⚠️ Respuesta vacía del backend')
      }
    } catch (error) {
      console.error('❌ Error cargando reporte institucional:', error)
      alert('Ocurrió un error al cargar el reporte institucional.')
    } finally {
      setLoading(false)
    }
  }

  // 🔹 Cargar reporte por profesor
  const loadReporteProfesor = async () => {
    if (!filters.profesor) {
      alert('Por favor ingresa el nombre del profesor')
      return
    }

    setLoading(true)
    try {
      const response = await reporteService.getPorProfesor(filters.profesor, filters.ciclo)
      setReporteProfesor(response?.data || null)
    } catch (error) {
      console.error('❌ Error cargando reporte por profesor:', error)
      alert('No se pudo cargar el reporte del profesor.')
      setReporteProfesor(null)
    } finally {
      setLoading(false)
    }
  }

  // 🔹 Exportar reportes
  const handleExport = async (formato, tipo) => {
    try {
      if (!formato) return

      const tipoNormalizado = tipo.toLowerCase().trim()
      const mapaTipos = {
        avances: 'avance',
        evidencias: 'evidencia',
        planeaciones: 'planeacion',
        profesor: 'profesor'
      }
      const tipoFinal = mapaTipos[tipoNormalizado] || tipoNormalizado

      if (tipoFinal === 'profesor' && !filters.profesor) {
        alert('Por favor ingresa el nombre del profesor antes de exportar.')
        return
      }

      const params = { tipo: tipoFinal, formato }
      if (filters.ciclo) params.ciclo = filters.ciclo
      if (tipoFinal === 'profesor') params.profesor = filters.profesor

      const response = await reporteService.exportar(params)

      if (response.data instanceof Blob && response.data.type === 'application/json') {
        const text = await response.data.text()
        const json = JSON.parse(text)
        alert(json.message || 'No hay datos disponibles.')
        return
      }

      const nombreArchivo = `reporte-${tipoFinal}-${filters.ciclo || 'general'}.${formato === 'excel' ? 'xlsx' : 'pdf'}`
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', nombreArchivo)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error al exportar reporte:', error)
      alert('Error al exportar reporte.')
    }
  }

  // 🔹 Render principal
  return (
    <div className="reportes-container">
      <header className="reportes-header">
        <h1>📊 Reportes Institucionales</h1>
        <p>
          {isAdmin()
            ? 'Panel completo de análisis y estadísticas del sistema académico'
            : 'Análisis y estadísticas académicas - Vista de coordinador'}
        </p>
        <div className="user-role-badge">
          {isAdmin() ? 'Administrador' : 'Coordinador'}
        </div>
      </header>

      {/* Filtros y controles */}
      <div className="filters-card">
        <div className="filters-content">
          <div className="tab-selector">
            <button
              onClick={() => setActiveTab('institucional')}
              className={`tab-button ${activeTab === 'institucional' ? 'active' : ''}`}
            >
              🏫 Institucional
            </button>
            <button
              onClick={() => setActiveTab('profesor')}
              className={`tab-button ${activeTab === 'profesor' ? 'active' : ''}`}
            >
              👨‍🏫 Por Profesor
            </button>
          </div>

          <div className="filters-grid">
            <input
              type="text"
              placeholder="Ciclo escolar (ej. 2024-2025)"
              value={filters.ciclo}
              onChange={(e) => setFilters(prev => ({ ...prev, ciclo: e.target.value }))}
              className="filter-input"
            />

            {activeTab === 'profesor' && (
              <input
                type="text"
                placeholder="Nombre del profesor"
                value={filters.profesor}
                onChange={(e) => setFilters(prev => ({ ...prev, profesor: e.target.value }))}
                className="filter-input"
              />
            )}

            <div className="actions-group">
              <button
                onClick={() =>
                  activeTab === 'institucional'
                    ? loadReporteInstitucional()
                    : loadReporteProfesor()
                }
                className="btn-primary"
              >
                🔄 Actualizar
              </button>

              <select
                onChange={(e) => handleExport(e.target.value, activeTab)}
                className="export-select"
              >
                <option value="">📥 Exportar...</option>
                <option value="pdf">PDF</option>
                <option value="excel">Excel</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Estado de carga */}
      {loading && (
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Cargando reporte...</p>
        </div>
      )}

      {/* 🔹 Mostrar reporte institucional */}
      {!loading && activeTab === 'institucional' && reporteInstitucional && (
        <div className="reporte-institucional">
          {Object.entries(reporteInstitucional).map(([nombreDocente, datos]) => (
            <div key={nombreDocente} className="docente-section">
              <h2>👨‍🏫 {nombreDocente}</h2>
              <p><strong>Planeaciones:</strong> {datos.totalPlaneaciones || 0}</p>
              <p><strong>Avances:</strong> {datos.totalAvances || 0}</p>
              <p><strong>Evidencias:</strong> {datos.totalEvidencias || 0}</p>
              <hr />
            </div>
          ))}
        </div>
      )}

      {/* 🔹 Mostrar reporte por profesor */}
      {!loading && activeTab === 'profesor' && reporteProfesor && (
        <div className="reporte-profesor">
          <h2>👨‍🏫 {reporteProfesor.nombre}</h2>
          <p><strong>Total Planeaciones:</strong> {reporteProfesor.totalPlaneaciones}</p>
          <p><strong>Total Avances:</strong> {reporteProfesor.totalAvances}</p>
          <p><strong>Total Evidencias:</strong> {reporteProfesor.totalEvidencias}</p>
        </div>
      )}

      {!loading && activeTab === 'profesor' && !reporteProfesor && (
        <div className="empty-state">
          <div className="empty-icon">👨‍🏫</div>
          <h3>Reporte por Profesor</h3>
          <p>Ingresa un nombre y haz clic en "Actualizar" para generar el reporte</p>
          <button onClick={loadReporteProfesor} className="btn-primary">
            Generar Reporte
          </button>
        </div>
      )}
    </div>
  )
}

export default ReportesPage
