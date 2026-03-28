# Análisis de Quejas — ARL SURA

Prueba técnica: análisis de 1,841 quejas de incapacidad temporal (Ene–Jun 2025) con NLP, ML explicable, dashboard interactivo y pipeline de automatización.

---

## Estructura del proyecto

```
sura/
├── notebooks/
│   ├── 01_eda_calidad_datos.ipynb        # EDA y calidad de datos
│   ├── 02_nlp_extraccion_temas.ipynb     # NLP · 12 temas por regex
│   ├── 03_causas_raiz_ml.ipynb           # ML explicable + SHAP
│   ├── 04_modelo_clasificacion.ipynb     # Random Forest clasificador
│   ├── 05_prediccion_series_tiempo.ipynb # Forecast Exp. Smoothing
│   └── 06_dinamica_sistemas.ipynb        # ODE · 6 escenarios de intervención
├── dashboard/                            # Next.js 14 · 6 vistas
│   ├── app/
│   ├── components/views/
│   └── public/data/                      # JSON generados por notebooks
├── pipeline/
│   ├── airflow_nextjs/                   # Escenario A: DAG Airflow
│   │   ├── dags/dag_quejas_semanal.py
│   │   └── scripts/pipeline_standalone.py
│   ├── powerbi/                          # Escenario B: CSV para Power BI
│   │   └── scripts/pipeline_powerbi.py
│   └── docs/arquitectura_flujo.md
├── req/
│   └── Prueba tecnica procesos y data.docx
├── docs/
├── resume/
├── requirements.txt
└── RESPUESTA_PRUEBA_TECNICA.txt          # Respuesta punto a punto
```

---

## Entregables

### 1. Patrones y causas raíz

NLP sobre texto libre (regex, sin dependencias externas) → 12 features temáticas → Random Forest + SHAP para cuantificar contribución de cada causa.

| Causa raíz | % quejas | Contribución al riesgo |
|---|---|---|
| Demora en pago/trámite | 68% | 42% |
| Sin respuesta al cliente | 54% | 28% |
| Estado/seguimiento opaco | 41% | 15% |
| Problemas de radicación | 29% | 8% |
| Montos incorrectos | 18% | 7% |

`notebooks/02_nlp_extraccion_temas.ipynb` · `notebooks/03_causas_raiz_ml.ipynb`

---

### 2. Métricas clave

| Métrica | Valor |
|---|---|
| Total quejas (Ene–Jun 2025) | 1,841 |
| Clientes únicos afectados | 1,334 |
| Tasa de recurrencia (>1 queja) | 20.7% |
| Escalamiento a entes de control | 8.5% |
| Quejas clasificadas alto riesgo | ~27% |
| AUC-ROC del clasificador | 0.81 |
| Forecast Jul 2025 | 384 quejas (umbral: 369 → **ALERTA**) |

`notebooks/01_eda_calidad_datos.ipynb` · `notebooks/05_prediccion_series_tiempo.ipynb`

---

### 3. Dashboard interactivo

**Stack:** Next.js 14 · TypeScript · Tailwind CSS · Recharts

```bash
cd dashboard
npm install
npm run dev
# → http://localhost:3000
```

**6 vistas:**

| Vista | Pregunta que responde |
|---|---|
| Resumen Ejecutivo | KPIs globales + alerta de forecast |
| Análisis Temático | ¿Qué tipo de quejas son más frecuentes? |
| Análisis de Canales | ¿Hay canales con mayor concentración de quejas? |
| Clientes Recurrentes | ¿Hay clientes recurrentes en riesgo? |
| Clasificador en Vivo | Clasifica texto libre en tiempo real |
| Predicción & Dinámica | ¿Se pueden predecir quejas futuras? · 6 escenarios ODE |

`dashboard/`

---

### 4. Pipeline automatizado

Dos escenarios implementados que cubren: carga semanal, actualización automática del dashboard y clasificación con el modelo entrenado.

**Escenario A — Airflow + Next.js**

DAG semanal (lunes 6 AM) con 6 tareas: Extraer → Transformar → Clasificar → Exportar JSON → Alerta por email si >20% alto riesgo.

```bash
# Sin Airflow (standalone)
python pipeline/airflow_nextjs/scripts/pipeline_standalone.py \
  --input req/BD_Quejas_Analitica.xlsx
```

**Escenario B — Python + Power BI**

Script Python genera star schema (5 CSV + Excel consolidado) para conectar con Power BI Service y programar refresh semanal desde OneDrive/SharePoint.

```bash
python pipeline/powerbi/scripts/pipeline_powerbi.py \
  --input req/BD_Quejas_Analitica.xlsx
```

`pipeline/` · `pipeline/docs/arquitectura_flujo.md`

---

### 5. Metodología — Herramienta de optimización de pagos

Framework: **Dinámica de Sistemas (ODE) + BPM**

Modelo matemático del proceso de pagos simulado con 6 escenarios de intervención:

| Escenario | Backlog mes 12 | Reducción |
|---|---|---|
| AS-IS (sin cambios) | 169 casos | — |
| +20% capacidad | 112 casos | -34% |
| -30% tasa de error | 98 casos | -42% |
| Ambos combinados | 61 casos | -64% |
| Automatización básica | 45 casos | -73% |
| **TO-BE completo** | **21 casos** | **-88%** |

`notebooks/06_dinamica_sistemas.ipynb`

---

## Ejecución en Google Colab

Todos los notebooks detectan automáticamente el entorno (local vs. Colab):

```python
EN_COLAB = 'google.colab' in sys.modules
```

En Colab, montar Drive y ajustar la ruta del Excel en la celda de configuración (celda 1 de cada notebook):

```python
DATA_FILE = Path('/content/drive/MyDrive/sura/BD_Quejas_Analitica.xlsx')
```

Orden de ejecución: `NB01 → NB02 → NB03 → NB04 → NB05 → NB06`
> NB03 requiere el CSV generado por NB02 (`quejas_con_features_nlp.csv`).

---

## Stack técnico

| Capa | Tecnología |
|---|---|
| Análisis | Python 3.9+ · pandas · numpy |
| NLP | regex · unicodedata |
| ML | scikit-learn · SHAP |
| Series de tiempo | statsmodels (Exp. Smoothing) |
| Dinámica de sistemas | scipy.integrate.odeint |
| Dashboard | Next.js 14 · TypeScript · Recharts |
| Pipeline A | Apache Airflow 2.7 · Docker |
| Pipeline B | Python scripts · Power BI Service |

```bash
pip install -r requirements.txt
```

---

## Respuesta completa

Ver [`RESPUESTA_PRUEBA_TECNICA.txt`](RESPUESTA_PRUEBA_TECNICA.txt) para la respuesta punto a punto a los 5 entregables de la prueba técnica.
