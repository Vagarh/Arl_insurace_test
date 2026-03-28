# Pipeline de Automatización — ARL SURA Quejas

Entregable 4: Flujo automatizado de carga, clasificación y actualización del dashboard.

## Estructura

```
pipeline/
├── airflow_nextjs/          # Escenario A: Airflow + Python → Next.js
│   ├── dags/
│   │   └── dag_quejas_semanal.py   # DAG de Airflow (ejecución semanal)
│   └── scripts/
│       ├── extract.py              # Carga y validación de datos nuevos
│       ├── transform.py            # Limpieza y extracción de features NLP
│       ├── classify.py             # Clasificación con modelo entrenado
│       └── export_json.py          # Exporta JSON al dashboard Next.js
├── powerbi/                 # Escenario B: Python → Power BI
│   └── scripts/
│       ├── pipeline_powerbi.py     # Pipeline completo para Power BI
│       └── export_excel.py         # Exporta Excel/CSV para Power BI Desktop
└── docs/
    └── arquitectura_flujo.md       # Comparativa y decisión arquitectural
```

## Escenarios

| | Escenario A | Escenario B |
|---|---|---|
| **Orquestación** | Apache Airflow | Cron / Task Scheduler |
| **Dashboard** | Next.js (actual) | Power BI Service |
| **Latencia** | Semanal automático | Semanal automático |
| **Infraestructura** | Docker + Airflow | Solo Python + Power BI Pro |
| **Complejidad Ops** | Media-Alta | Baja |
| **Curva aprendizaje** | Alta (DevOps) | Baja (analistas) |

## Prerequisitos

```bash
pip install apache-airflow pandas scikit-learn joblib openpyxl
```

Para escenario B adicional:
```bash
pip install xlsxwriter
```

## Ejecución rápida (sin Airflow)

```bash
# Escenario A — pipeline standalone
python pipeline/airflow_nextjs/scripts/pipeline_standalone.py --input req/BD_Quejas_Analitica.xlsx

# Escenario B — exporta para Power BI
python pipeline/powerbi/scripts/pipeline_powerbi.py --input req/BD_Quejas_Analitica.xlsx
```
