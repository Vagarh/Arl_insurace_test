# Prueba Técnica - Análisis de Quejas ARL SURA

## Contexto
Empresa de servicios de pagos a prestadores de salud por accidentes laborales (ARL).
+500K clientes activos. Caída en satisfacción últimos 12 meses. Quejas en aumento.

## Datos
- Archivo: `req/BD_Quejas_Analitica.xlsx` - Hoja: "Incapacidad Temporal"
- 1,841 registros de quejas (Ene-Jun 2025)
- Columnas: Mes apertura (YYYYMM), Descripción (texto libre), Tipo (todos "QUEJA"), Nombre del cliente, Canal de comunicación
- 4 canales: SEGUROSSURA.COM.CO (55%), LINEA DE ATENCIÓN (35%), ENTES DE CONTROL (8.5%), PLATAFORMA DE ATENCIÓN (1.8%)
- 1,334 clientes únicos, 277 con >1 queja
- Descripciones: texto libre en español, promedio 490 chars, 2 nulos

## Entregables de la prueba
1. Identificar patrones y causas raíz de insatisfacción
2. Generar métricas clave alineadas con hallazgos
3. Dashboard para toma de decisiones
4. Flujo automatizado (carga semanal, actualización, clasificación automática)
5. Metodología para implementar herramienta tecnológica de optimización de pagos

## Enfoque analítico
- **NLP primero**: el texto libre es la fuente de features (la columna Tipo es constante)
- **ML explicable**: NLP extrae temas → se construyen features → modelo con SHAP/coeficientes
  para cuantificar en % cómo cada factor contribuye a la insatisfacción
- **Variable Y proxy**: escalamiento a ente de control, recurrencia del cliente, severidad textual
- **Punto 5 = Dinámica de sistemas + BPM**: modelar el proceso de pagos como sistema con
  stocks, flujos, loops de retroalimentación y cuellos de botella

## Stack técnico
- Python 3.9+ (pandas, numpy, matplotlib, seaborn, scikit-learn)
- NLP: spacy (es_core_news_sm/md), transformers (para sentiment si se necesita)
- Notebooks Jupyter para análisis exploratorio
- Dashboard: Streamlit o Power BI (según preferencia)
- Automatización: script Python + cron / Airflow conceptual

## Estructura del proyecto
```
sura/
├── CLAUDE.md
├── requirements.txt
├── req/                          # Archivos originales (no modificar)
│   ├── BD_Quejas_Analitica.xlsx
│   └── Prueba tecnica procesos y data.docx
├── notebooks/
│   ├── 01_eda_calidad_datos.ipynb
│   ├── 02_nlp_extraccion_temas.ipynb
│   ├── 03_causas_raiz_ml.ipynb        # ML explicable + SHAP
│   └── 04_modelo_clasificacion.ipynb
├── src/
│   ├── data_loader.py
│   ├── text_processing.py
│   ├── topic_extraction.py
│   └── clasificador.py
├── dashboard/
│   └── app.py
└── docs/
    ├── plan_trabajo.md
    └── metodologia_punto5.md
```

## Convenciones
- Código y comentarios en español donde aplique
- Nombres de variables/funciones en snake_case (español o inglés)
- Notebooks bien documentados con markdown explicativo
- Visualizaciones con títulos y etiquetas en español
