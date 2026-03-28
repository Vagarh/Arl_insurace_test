# Flujo Automatizado de Procesamiento de Quejas — ARL SURA
## Entregable 4: Arquitectura Técnica

---

## 1. Resumen Ejecutivo

Se diseñaron dos escenarios de automatización que cumplen los tres requisitos del entregable:

> (a) Carga semanal de nuevos datos de quejas
> (b) Actualización de métricas y dashboard sin intervención manual
> (c) Clasificación automática de nuevas quejas usando el modelo propuesto

| Criterio | Escenario A — Airflow + Next.js | Escenario B — Python + Power BI |
|---|---|---|
| Carga semanal | DAG programado (lunes 6AM) | Cron/Task Scheduler |
| Actualización dashboard | JSON → Next.js auto-refresca | CSV → Power BI Scheduled Refresh |
| Clasificación automática | Random Forest (.joblib) | Random Forest (.joblib) |
| **Recomendación** | Para equipo técnico / DevOps | **Para equipo analítico / negocio** |

---

## 2. Escenario A — Apache Airflow + Next.js

### 2.1 Arquitectura

```
┌─────────────────────────────────────────────────────────────────┐
│                      CAPA DE DATOS                              │
│  BD_Quejas_Analitica.xlsx  ──→  Actualización semanal (fuente) │
└─────────────────────────────────────────────────────────────────┘
                              │
                    Lunes 6:00 AM (cron)
                              │
┌─────────────────────────────▼───────────────────────────────────┐
│                   APACHE AIRFLOW (DAG)                          │
│                                                                 │
│  [Extraer] ──→ [Transformar] ──→ [Clasificar] ──→ [Exportar]  │
│     │               │               │               │          │
│  Cargar Excel    Limpieza NLP    RF Modelo        JSON files   │
│  Validar datos   Features         .joblib         dashboard/   │
│  XCom push       Recurrencia     Prob. riesgo     public/data/ │
│                  Canal features  Score categoría               │
│                              │                                  │
│                         [Branch]                               │
│                        /        \                              │
│              [Alerta Email]  [Sin alerta]                      │
│                        \        /                              │
│                          [Fin]                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                    JSON actualizados
                              │
┌─────────────────────────────▼───────────────────────────────────┐
│                  NEXT.JS DASHBOARD                              │
│                                                                 │
│  useEffect → fetch('/data/alertas.json')                       │
│  useEffect → fetch('/data/scoring_clientes.json')              │
│  useEffect → fetch('/data/clasificacion_resumen.json')         │
│                                                                 │
│  → Datos siempre frescos sin redeploy                          │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Tareas del DAG

| Tarea | Descripción | Tiempo estimado | Dependencia |
|---|---|---|---|
| `extraer` | Carga Excel, valida integridad, guarda parquet en /tmp | ~30s | — |
| `transformar` | Limpieza regex, 12 features NLP, features canal/recurrencia | ~2min | extraer |
| `clasificar` | Aplica RF modelo, calcula prob_riesgo y score_categoria | ~20s | transformar |
| `exportar_json` | Genera 3 JSON para dashboard (alertas, scoring, clasificacion) | ~10s | clasificar |
| `decidir_alerta` | Branch: si >20% alto riesgo → envía email | ~1s | exportar_json |
| `fin` | Marca ejecución exitosa | — | branch |

**Tiempo total estimado: ~3-4 minutos**

### 2.3 Infraestructura requerida

```yaml
# docker-compose.yml (mínimo)
services:
  postgres:        # Metastore de Airflow
    image: postgres:14
  airflow-webserver:
    image: apache/airflow:2.7.0
    ports: ["8080:8080"]
  airflow-scheduler:
    image: apache/airflow:2.7.0
  airflow-worker:
    image: apache/airflow:2.7.0
```

**Variables de entorno Airflow:**
```
SURA_DATA_PATH       = /opt/airflow/data/BD_Quejas_Analitica.xlsx
SURA_DASHBOARD_PATH  = /opt/airflow/dashboard/public/data
SURA_MODEL_PATH      = /opt/airflow/src/modelo_scoring.joblib
```

### 2.4 Configuración de alertas

El DAG tiene un operador `BranchPython` que evalúa:
- Si `n_alto_riesgo / n_total > 20%` → Envía `EmailOperator` a `analitica@sura.com.co`
- Umbral configurable como Variable de Airflow sin redeployar

### 2.5 Pros y Contras

**Pros:**
- Reintentos automáticos (2 retries con delay de 5min)
- Monitoreo visual en Airflow UI (localhost:8080)
- Logs centralizados por tarea
- Backfill histórico si se cambia la lógica
- Escalable a múltiples fuentes (API, S3, SFTP)

**Contras:**
- Requiere Docker + infraestructura permanente activa
- Curva de aprendizaje de Airflow para el equipo
- Costo operativo de servidor 24/7
- Complejidad de gestión de secrets/variables

---

## 3. Escenario B — Python Script + Power BI

### 3.1 Arquitectura

```
┌─────────────────────────────────────────────────────────────────┐
│                      CAPA DE DATOS                              │
│  BD_Quejas_Analitica.xlsx  ──→  Fuente principal de datos      │
└─────────────────────────────────────────────────────────────────┘
                              │
               Lunes 6:00 AM (Task Scheduler / cron)
                              │
┌─────────────────────────────▼───────────────────────────────────┐
│               PYTHON SCRIPT (pipeline_powerbi.py)               │
│                                                                 │
│  Extraer → Transformar → Clasificar → Exportar CSV/Excel       │
│                                                                 │
│  Salidas:                                                       │
│  ├── fact_quejas.csv          (tabla de hechos principal)      │
│  ├── dim_clientes.csv         (dimensión cliente)              │
│  ├── dim_tiempo_mensual.csv   (dimensión temporal)             │
│  ├── dim_canal.csv            (dimensión canal)                │
│  ├── dim_temas.csv            (features NLP agregadas)         │
│  └── sura_quejas_dashboard.xlsx (Excel consolidado)            │
└─────────────────────────────────────────────────────────────────┘
                              │
              Guardado en OneDrive/SharePoint
                              │
┌─────────────────────────────▼───────────────────────────────────┐
│                   POWER BI SERVICE                              │
│                                                                 │
│  Dataset:  Conecta a carpeta OneDrive                          │
│  Refresh:  Scheduled (semanal, lunes 7:00 AM)                 │
│  Report:   Dashboards publicados en workspace SURA            │
│  RLS:      Row-Level Security por área/gerencia               │
│                                                                 │
│  Vistas:   Resumen Ejecutivo / Canal / Temas / Clientes        │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Modelo de datos Power BI (Star Schema)

```
                    ┌─────────────────┐
                    │  dim_clientes   │
                    │  cliente (PK)   │
                    │  total_quejas   │
                    │  segmento       │
                    └────────┬────────┘
                             │
┌──────────────┐    ┌────────▼────────┐    ┌──────────────┐
│ dim_tiempo   │    │  fact_quejas    │    │  dim_canal   │
│ mes (PK)     ├───▶│  (FK: cliente) │◀───┤  canal (PK)  │
│ mes_nombre   │    │  (FK: mes)     │    │  total_quejas│
│ total_quejas │    │  (FK: canal)   │    │  pct_total   │
└──────────────┘    │  prob_riesgo   │    └──────────────┘
                    │  clasificacion │
                    │  tema_pago     │
                    │  tema_tiempo   │
                    │  ... (12 feat) │
                    └────────────────┘
                             │
                    ┌────────▼────────┐
                    │   dim_temas     │
                    │  tema (PK)      │
                    │  n_quejas       │
                    │  pct_alto_riesgo│
                    └─────────────────┘
```

### 3.3 Configuración Task Scheduler (Windows)

```
Programa:    python.exe
Argumentos:  C:\sura\pipeline\powerbi\scripts\pipeline_powerbi.py
             --input "C:\sura\req\BD_Quejas_Analitica.xlsx"
             --output "C:\Users\...\OneDrive\sura\pipeline\powerbi\outputs"
Disparador:  Semanal, lunes, 06:00
```

### 3.4 Configuración cron (Linux/Mac)

```bash
# Agregar a crontab -e
0 6 * * 1 /usr/bin/python3 /ruta/sura/pipeline/powerbi/scripts/pipeline_powerbi.py \
  --input /ruta/sura/req/BD_Quejas_Analitica.xlsx \
  --output /ruta/sura/pipeline/powerbi/outputs \
  >> /var/log/sura_pipeline.log 2>&1
```

### 3.5 Medidas DAX recomendadas (Power BI)

```dax
-- Tasa de Alto Riesgo
Tasa Alto Riesgo =
DIVIDE(
    COUNTROWS(FILTER(fact_quejas, fact_quejas[clasificacion] = "Alto Riesgo")),
    COUNTROWS(fact_quejas)
) * 100

-- Score Promedio Mensual
Score Promedio = AVERAGE(fact_quejas[score_riesgo_pct])

-- % Cambio vs Mes Anterior
Δ Quejas vs Mes Anterior =
VAR MesActual = MAX(dim_tiempo[mes])
VAR ActualCount = CALCULATE(COUNTROWS(fact_quejas), dim_tiempo[mes] = MesActual)
VAR AnteriorCount = CALCULATE(COUNTROWS(fact_quejas), dim_tiempo[mes] = MesActual - 1)
RETURN DIVIDE(ActualCount - AnteriorCount, AnteriorCount) * 100

-- Clientes en Zona Crítica
Clientes Críticos =
CALCULATE(COUNTROWS(dim_clientes), dim_clientes[segmento] = "Crítico")
```

### 3.6 Pros y Contras

**Pros:**
- Sin infraestructura adicional — solo Python + Power BI Pro
- Conocido por analistas y equipos de negocio
- Power BI Service maneja refresh, distribución y RLS
- Excel consolidado como respaldo para usuarios sin Power BI
- Fácil validación manual de los CSV

**Contras:**
- Requiere licencia Power BI Pro (~$10 USD/usuario/mes)
- Refresh desde SharePoint requiere Power BI Gateway en red corporativa
- Menos robusto que Airflow para manejo de errores
- No envía alertas automáticas nativamente

---

## 4. Comparativa y Recomendación

| Criterio | Escenario A (Airflow) | Escenario B (Power BI) |
|---|---|---|
| **Complejidad técnica** | Alta | Baja |
| **Costo infraestructura** | Servidor + Docker | Licencia Power BI Pro |
| **Tiempo de implementación** | 2–3 semanas | 3–5 días |
| **Mantenimiento** | DevOps requerido | Analistas pueden mantener |
| **Escalabilidad** | Alta (multi-fuente, multi-DAG) | Media |
| **Monitoreo** | Airflow UI + logs | Power BI Service |
| **Alertas automáticas** | Sí (email nativo) | No nativo (Power Automate) |
| **Audiencia dashboard** | Técnicos + web | Ejecutivos + analistas |
| **Integración con sistema actual** | Next.js (ya construido) | Nuevo sistema |

### Recomendación

**Corto plazo (inmediato):** Escenario B — el script Python + Power BI es más rápido de implementar,
no requiere infraestructura nueva, y el equipo analítico puede operarlo sin DevOps.

**Mediano plazo (3–6 meses):** Migrar a Escenario A cuando el volumen de datos crezca,
se integren más fuentes, o se requiera SLA de disponibilidad del pipeline.

**Transición gradual:** Ambos scripts comparten el mismo código de transformación y clasificación.
El modelo `.joblib` es agnóstico — funciona en ambos escenarios sin modificación.

---

## 5. Flujo de Datos Detallado (común a ambos escenarios)

```
Excel Entrada
    │
    ▼
┌─────────────────────────────────────────────┐
│  EXTRACCIÓN                                 │
│  • pd.read_excel("Incapacidad Temporal")    │
│  • Normalización de nombres de columnas     │
│  • Validación: len > 0, columnas requeridas │
└─────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────┐
│  TRANSFORMACIÓN NLP                         │
│  • Normalización Unicode (elimina tildes)   │
│  • Minúsculas + regex [^a-z0-9\s]          │
│  • Filtro stopwords (22 palabras)           │
│  • 12 features regex por tema (TERMINOS)    │
└─────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────┐
│  FEATURE ENGINEERING                        │
│  • longitud_texto → texto_corto/largo (Q25/Q75)│
│  • Canal → 4 features one-hot               │
│  • Recurrencia por cliente → n_quejas,      │
│    cliente_recurrente (≥2), cliente_critico (≥3)│
│  • Mes numérico desde Mes apertura YYYYMM  │
└─────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────┐
│  CLASIFICACIÓN                              │
│  • RF.predict_proba(X)[:, 1] → prob_riesgo │
│  • Umbral 0.5 → "Alto Riesgo" / "Normal"   │
│  • score_categoria: Bajo/Medio/Alto/Crítico │
│  • Fallback heurístico si no hay .joblib    │
└─────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────┐
│  EXPORTACIÓN                                │
│  Escenario A → 3 JSON (Next.js)            │
│  Escenario B → 5 CSV + 1 Excel (Power BI)  │
└─────────────────────────────────────────────┘
```

---

*Documento generado: 2026-03-27 | ARL SURA — Equipo de Analítica*
