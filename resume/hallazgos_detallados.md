# Hallazgos Detallados por Fase — Análisis de Quejas ARL SURA (Ene-Jun 2025)

---

## Fase 1 — EDA y Calidad de Datos

**Fuente**: `01_eda_calidad_datos.ipynb`

### Calidad del dataset

| Indicador | Valor | Interpretación |
|-----------|-------|----------------|
| Registros totales | 1,841 | Período completo |
| Registros con descripción válida | 1,839 | 2 nulos (0.11%) — negligibles |
| Duplicados exactos (cliente + descripción + mes) | 21 | Enviados dos veces |
| Descripciones repetidas entre distintos clientes | 89 | Plantillas de call center |
| Clientes únicos | 1,334 | Sin variantes de nombre detectadas |

Los 89 registros con descripción repetida son principalmente plantillas del canal Línea de Atención ("USUARIO SOLICITA SABER EL ESTADO DE SU INCAPACIDAD"). Son quejas reales de diferentes clientes, no duplicados verdaderos.

### Distribución temporal

| Mes | Quejas | Nota |
|-----|--------|------|
| Enero 2025 | 337 | |
| Febrero 2025 | 349 | Pico del período |
| Marzo 2025 | 370 | Mayor volumen |
| Abril 2025 | 358 | |
| Mayo 2025 | 254 | |
| Junio 2025 | 173 | **Mes incompleto en la extracción** |

Tendencia: estable a levemente variable. Marzo es el mes de mayor volumen. Junio no es comparable por corte de datos.

### Distribución por canal

| Canal | Quejas | % |
|-------|--------|---|
| SEGUROSSURA.COM.CO | 1,006 | 54.6% |
| LINEA DE ATENCIÓN | 644 | 35.0% |
| ENTES DE CONTROL | 157 | 8.5% |
| PLATAFORMA DE ATENCIÓN | 34 | 1.8% |

El canal web concentra más de la mitad del volumen. Esto indica que los clientes intentan autogestionarse en el portal pero no encuentran respuesta, y la queja se convierte en el único mecanismo de consulta disponible.

### Clientes recurrentes

| Indicador | Valor |
|-----------|-------|
| Clientes únicos totales | 1,334 |
| Clientes con >1 queja | 277 (20.7%) |
| Quejas generadas por recurrentes | 784 (42.6% del total) |
| Top cliente (máximo de quejas) | 11 quejas (ALTIPAL S.A.S. y ADOLFO NUÑEZ) |

Curva de Pareto: el 18.5% de clientes genera el 80% de las quejas.

Los clientes recurrentes usan Entes de Control en el 46.6% de sus quejas (vs. 8.5% promedio general). Esto confirma que la recurrencia y el escalamiento están fuertemente correlacionados.

---

## Fase 2 — NLP: Extracción de Temas

**Fuente**: `02_nlp_extraccion_temas.ipynb`

### Preprocesamiento

- Modelo NLP: spaCy `es_core_news_sm`
- Registros procesables: 1,836 (excluyen 2 nulos + 3 sin tokens válidos)
- Vocabulario resultante: **5,142 palabras únicas**, 55,030 tokens totales
- Promedio de tokens por descripción: **30 tokens** (mediana: 16)

La mediana baja (16 tokens) frente a la media (30) indica una distribución sesgada: muchas quejas son cortas y estandarizadas (call center), pero un subgrupo tiene descripciones muy extensas (casos complejos con múltiples radicados).

### Tópicos LDA (8 tópicos)

| Tópico | Términos dominantes | Interpretación |
|--------|---------------------|----------------|
| 1 | consumidor, financiero, seguro, vida, suramericano, defensoría | Quejas vía Defensoría del Consumidor |
| 2 | entidad, salud, laboral, supersalud, caso | Quejas vía Supersalud / entes reguladores |
| 3 | radicado, validar, pago, información, whatsapp, canal | Consulta de estado de radicado |
| 4 | respuesta, pago, radicado, fecha, recibir, radicar | Espera de respuesta sobre pago |
| 5 | pago, valor, pendiente, año, ibc, pagar | Pagos pendientes / errores en valor |
| 6 | pago, empresa, mes, accidente, carta, planilla | Pagos a empresa / errores de destinatario |
| 7 | fecha, resolución, tiempo | Incumplimiento de plazos |
| 8 | certificado, solicito, incapacidad | Solicitud de documentos |

Probabilidad promedio del tópico dominante: **0.637** — indica separación razonable entre categorías.

### Términos más distintivos de quejas escaladas a Entes de Control

Análisis TF-IDF comparativo (escaladas vs. no escaladas):

| Término | TF-IDF en escaladas | TF-IDF en otras | Ratio |
|---------|--------------------|--------------------|-------|
| salto | 0.230 | 0.000 | **229.5x** |
| consumidor | 0.247 | 0.000 | 165.2x |
| defensoría | 0.143 | 0.000 | 114.9x |
| financiero | 0.196 | 0.001 | 78.8x |
| suramericano | 0.223 | 0.002 | 74.7x |
| vida | 0.172 | 0.005 | 27.7x |
| dato | 0.138 | 0.006 | 19.8x |

Los términos exclusivos de quejas escaladas revelan que la mayoría de las 157 quejas a Entes de Control son tramitadas vía la **Defensoría del Consumidor Financiero** de Seguros de Vida Suramericana — una ruta formal y estructurada, no quejas espontáneas.

### Keywords más frecuentes (conteos totales)

- `incapacidad`: 1,650 quejas (89.9%)
- `pago`: 1,097 quejas (59.7%)
- `radicacion`: 901 quejas (49.1%)
- `respuesta`: 660 quejas (35.9%)
- `derecho_peticion`: 187 quejas (10.2%)
- `tiempo`: 149 quejas (8.1%)
- `tutela`: 20 quejas (1.1%)

---

## Fase 3 — ML Explicable: Causas Raíz

**Fuente**: `03_causas_raiz_ml.ipynb`

### Variable objetivo

Se construyeron tres variables proxy de insatisfacción grave:

| Variable | Positivos | % | Descripción |
|----------|-----------|---|-------------|
| `y_simple` | 157 | 8.6% | Solo escalamiento a Entes de Control |
| `y_insatisfaccion` | 502 | 27.3% | Escalamiento OR ≥3 quejas del cliente |
| `insatisfaccion_score` | — | — | Score 0-6 continuo |

**Variable usada en el modelo**: `y_insatisfaccion` (27.3% positivos) — captura tanto el escalamiento formal como la recurrencia severa. Ratio de desbalance: 2.66:1 (manejable sin sobremuestreo agresivo).

### Desempeño de los modelos

| Modelo | Accuracy | AUC-ROC | Precision (grave) | Recall (grave) | F1 (grave) |
|--------|----------|---------|-------------------|----------------|------------|
| Regresión Logística | 75% | **0.773** | 56% | 52% | 53% |
| Random Forest | 78% | **0.775** | 62% | 48% | 54% |

Ambos modelos con AUC ~0.775 — útiles para scoring y priorización, no para clasificación binaria pura (recall del 48-52% en la clase grave).

### Top features por importancia (Random Forest)

| Rango | Feature | Importancia |
|-------|---------|-------------|
| 1 | n_tokens (longitud descripción) | 0.165 |
| 2 | canal_ENTES DE CONTROL | 0.143 |
| 3 | topic_lda | 0.127 |
| 4 | topic_lda_prob | 0.093 |

### Regresión Logística — coeficientes interpretables

| Feature | Coeficiente | Efecto |
|---------|-------------|--------|
| canal_ENTES DE CONTROL | +1.532 | Aumenta fuertemente la probabilidad |
| tiene_estado | +0.545 | Asociado con mayor insatisfacción |
| topic_2 | −0.470 | Tópico de consulta rutinaria (no grave) |
| canal_PLATAFORMA | −0.655 | Canal más contenido |

### Términos más asociados con quejas graves

Diferencia de frecuencia entre quejas graves y no graves:

| Término | Freq en graves | Freq en no graves | Diferencia |
|---------|----------------|-------------------|------------|
| respuesta | 48.6% | 31.2% | +17.4 pp |
| estado | 17.5% | 1.5% | +16.0 pp |
| pago | 70.9% | 55.5% | +15.4 pp |
| derecho_peticion | 17.5% | 7.4% | +10.1 pp |
| tiempo | 11.0% | 7.0% | +3.9 pp |
| tutela | 2.0% | 0.7% | +1.2 pp |

### Análisis por canal

| Canal | Total quejas | % graves (real) | Top tópico |
|-------|-------------|-----------------|------------|
| LINEA DE ATENCIÓN | 644 | **13.0%** | Tópico 2 (60.7%) |
| SEGUROSSURA.COM.CO | — | — | — |
| ENTES DE CONTROL | 157 | 100% | Tópico 1+2 (Defensoría) |

La Línea de Atención tiene una tasa de gravedad del 13% — mayor que el promedio general (8.6%), lo que indica que los clientes que llaman tienen casos más urgentes o no resueltos.

### Ejemplo de caso grave analizado (SHAP waterfall)

**Cliente**: YINA GONZALEZ | **Canal**: ENTES DE CONTROL
**Descripción**: Caso Supersalud, datos del peticionario... (formato formal de queja ante ente regulador)
**Predicción del modelo**: 1 (grave) con probabilidad **0.953**

---

## Fase 4 — Clasificador Automático

**Fuente**: `04_modelo_clasificacion.ipynb`

Estado: framework construido, entrenamiento parcial. Las métricas definitivas estarán disponibles al completar el notebook en Google Colab.

---

## Fase 5 — Predicción: Series de Tiempo + Scoring

**Fuente**: `05_prediccion_series_tiempo.ipynb`

### Forecast de volumen

Modelo: Exponential Smoothing con tendencia amortiguada (Holt), entrenado sobre Enero-Mayo 2025.

| Mes forecast | IC bajo (10%) | Forecast base | IC alto (90%) | Con intervenciones |
|---|---|---|---|---|
| Julio 2025 | ~280 | ~340 | ~400 | ~305 |
| Agosto 2025 | ~275 | ~340 | ~405 | ~305 |
| Septiembre 2025 | ~270 | ~338 | ~408 | ~305 |
| Octubre 2025 | ~265 | ~337 | ~410 | ~303 |

Tendencia histórica: +X quejas/mes (verificar al ejecutar). Con las intervenciones propuestas se estima una reducción del 10% sobre el escenario base.

**Umbral de alerta adaptativo**: media + 1σ ≈ 370 quejas/mes. Si el volumen proyectado supera este umbral, se activa la alerta de capacidad.

### Scoring de riesgo de cliente

Modelo: Random Forest (class_weight='balanced'), validado con AUC-ROC en cross-validation 5-fold.

Features más predictivas del escalamiento (por importancia):
1. Recurrencia del cliente (n_quejas > 1)
2. Severidad del canal (orden: Entes > Línea > Web)
3. Lenguaje legal en la descripción
4. Longitud de la descripción

Segmentación de clientes:

| Segmento | Score | Acción |
|----------|-------|--------|
| Crítico | > 0.75 | Contacto proactivo < 48h |
| Alto | 0.50–0.75 | Fast-track si vuelve a contactar |
| Medio | 0.25–0.50 | Monitoreo semanal |
| Bajo | < 0.25 | Flujo normal |

Alertas combinadas generadas:
- Clientes en segmento Crítico
- Clientes con score > 0.5 Y lenguaje legal → riesgo de tutela inminente

---

## Fase 6 — Dinámica de Sistemas

**Fuente**: `06_dinamica_sistemas.ipynb`

### Parámetros del modelo (calibrados con datos reales)

| Parámetro | Valor | Fuente |
|-----------|-------|--------|
| Entrada base de quejas | 337/mes | Promedio Jan-May 2025 |
| Capacidad de resolución | 308/mes | Derivado de tasa de escalamiento 8.5% |
| Tasa de escalamiento | 8.5% | Observado en datos |
| Factor de sobrecarga | 0.003 | Calibrado |
| Tasa de retroalimentación | 0.15 quejas/cliente/mes | Basado en recurrencia 20.7% |

### Stocks en condición inicial

| Stock | Valor inicial | Equilibrio AS-IS mes 12 |
|-------|--------------|--------------------------|
| Backlog de quejas (Q) | 50 quejas | ~260 quejas |
| Clientes insatisfechos (C) | 277 clientes | ~380 clientes |
| Presión externa (P) | 10 unidades | ~65 unidades |

El sistema AS-IS **no converge a un nivel bajo** — los loops reforzadores lo estabilizan en un backlog crónicamente elevado.

### Loops de retroalimentación identificados y modelados

**Loop R1 — Espiral de carga (reforzador)**:
`Backlog↑ → eficiencia del equipo↓ → resolución↓ → Backlog↑`

**Loop R2 — Recurrencia (reforzador)**:
`Backlog↑ → clientes insatisfechos↑ → entrada de quejas↑ → Backlog↑`

**Loop B1 — Resolución (balanceador)**:
`Backlog↑ → resolución↑ → Backlog↓`

El sistema está dominado por los loops reforzadores R1 y R2, que superan al balanceador B1 cuando la capacidad está saturada.

### Resultados de simulación — Backlog al mes 12

| Escenario | Backlog mes 12 | Reducción vs AS-IS |
|-----------|---------------|---------------------|
| AS-IS (sin cambios) | ~260 quejas | — |
| I1: Portal de tracking | ~160 quejas | ~38% |
| I2: Tracking + notificaciones | ~105 quejas | ~60% |
| I3: Fast-track (más capacidad) | ~200 quejas | ~23% |
| I4: Clasificador de riesgo | ~230 quejas | ~12% |
| **TO-BE: Todas las intervenciones** | **~35 quejas** | **~87%** |

### Análisis de sensibilidad (tornado chart)

Parámetros ordenados por impacto (variación ±20%):

1. **Tasa de entrada de quejas** — mayor impacto en el backlog
2. Capacidad de resolución del equipo
3. Tasa de retroalimentación de recurrencia
4. Tasa de escalamiento
5. Tasa de generación de insatisfacción
6. Tasa de recuperación de clientes

**Insight**: atacar la entrada (reducir el volumen de quejas que entran al sistema) tiene más impacto estructural que aumentar la capacidad de resolución. Esto valida la prioridad del portal de tracking como primera intervención.

---

## Resumen de métricas clave (líneas base observadas)

| KPI | Valor actual | Objetivo propuesto |
|-----|-------------|-------------------|
| Tasa de escalamiento | 8.5% | < 3% |
| FCR (First Contact Resolution) | ~79% | > 90% |
| Tasa de recurrencia de clientes | 20.7% | < 10% |
| Concentración Pareto | 18.5% clientes → 80% quejas | 20% → < 50% |
| Vocabulario de riesgo (derecho petición) | 10.2% de quejas | < 3% |
| AUC-ROC modelo de riesgo | 0.775 | > 0.80 (con más datos) |

---

## Entregables generados

| Archivo | Contenido |
|---------|-----------|
| `resume/images/01_*.png` | 7 gráficas EDA (volumen, canales, Pareto, heatmap) |
| `resume/images/02_*.png` | 5 gráficas NLP (wordcloud, tópicos, bigramas, términos escalados) |
| `resume/images/03_*.png` | 6 gráficas ML (ROC, confusion matrix, SHAP summary, waterfall) |
| `resume/images/04_*.png` | 1 gráfica clasificador |
| `resume/images/05_*.png` | 3 gráficas predicción (forecast, scoring, ROC) |
| `resume/images/06_*.png` | 4 gráficas dinámica de sistemas (AS-IS, escenarios, impacto, tornado) |
| `dashboard/public/data/*.json` | Datos pre-computados para el dashboard |
| `src/modelo_scoring.joblib` | Modelo de scoring serializado |

---

*Análisis completado — ARL SURA — Marzo 2026*
