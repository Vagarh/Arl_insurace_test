# Plan de Trabajo - Prueba Técnica Datos y Procesos

## Resumen de los datos
- **1,841 quejas** sobre incapacidades temporales (Ene-Jun 2025)
- **Todas son tipo QUEJA** (no hay variación en la columna Tipo)
- **1,334 clientes únicos**, 277 recurrentes (20.7%)
- **Texto libre** como fuente principal de información → requiere NLP
- **4 canales**: web (55%), línea telefónica (35%), entes de control (8.5%), plataforma (1.8%)

---

## FASE 1: EDA y Calidad de Datos
**Notebook:** `01_eda_calidad_datos.ipynb`

### 1.1 Calidad de datos
- Valores nulos/vacíos (hay 2 descripciones vacías)
- Duplicados (mismo cliente + misma descripción en mismo mes)
- Consistencia de nombres de clientes (posibles variaciones: mayúsculas, tildes, abreviaturas)
- Distribución de longitud de descripciones (rango 0-24,744 chars)

### 1.2 Análisis univariado
- Distribución temporal de quejas por mes (¿tendencia creciente?)
- Distribución por canal de comunicación
- Frecuencia de quejas por cliente (distribución de la recurrencia)
- Estadísticas descriptivas de longitud de texto

### 1.3 Análisis bivariado/multivariado
- Canal × Mes: ¿hay canales que crecen más?
- Clientes recurrentes × Canal: ¿los recurrentes usan el mismo canal?
- Volumen por mes × canal (heatmap)

### 1.4 Clientes recurrentes
- Top clientes con más quejas (personas naturales vs empresas)
- Patrón temporal de recurrencia
- ¿Los recurrentes escalan a Entes de Control?

---

## FASE 2: NLP - Extracción de Temas y Significado
**Notebook:** `02_nlp_extraccion_temas.ipynb`

> **Nota clave:** La columna "Tipo" es constante (QUEJA), así que la clasificación real
> viene del texto. El valor diferencial está en extraer categorías temáticas del texto libre.

### 2.1 Preprocesamiento de texto
- Limpieza: eliminar números de radicado, cédulas, NITs, correos, teléfonos
- Normalización: lowercase, tildes, stopwords en español
- Tokenización y lematización con spaCy (es_core_news_md)

### 2.2 Extracción de temas (Topic Modeling)
- **TF-IDF + Clustering (KMeans/DBSCAN)** para descubrir grupos temáticos
- **LDA (Latent Dirichlet Allocation)** como alternativa
- Identificar categorías principales. Hipótesis iniciales por el muestreo:
  1. **Estado de incapacidad** - consulta de estado/radicado
  2. **Demora en pago** - no han pagado, llevan meses esperando
  3. **Error en pago** - pagaron mal, al trabajador en vez de empresa, monto incorrecto
  4. **Problemas de radicación** - radicado no aparece, problemas con la plataforma
  5. **Solicitud de documentos** - certificados, soportes de pago
  6. **Inconformidad con monto** - valor pagado no corresponde al esperado
  7. **Escalamiento a ente de control** - quejas formales por falta de respuesta

### 2.3 Extracción de entidades y atributos
- Extraer: montos, fechas, números de radicado mencionados
- Identificar si la queja es del trabajador directo o de la empresa empleadora
- Detectar tono de urgencia/escalamiento

### 2.4 Análisis de sentimiento contextual
- No solo positivo/negativo, sino **nivel de frustración/urgencia**
- Detectar quejas con amenaza de acción legal o escalamiento
- Palabras clave de insatisfacción extrema

---

## FASE 3: ML Explicable - Causas Raíz Cuantificadas
**Notebook:** `03_causas_raiz_ml.ipynb`

> **Enfoque:** No solo describir patrones, sino **cuantificar el peso de cada factor**
> en la insatisfacción usando modelos de ML con explicabilidad (SHAP values, coeficientes).

### 3.1 Construcción de la variable objetivo (Y)
La data no tiene una Y explícita de satisfacción. Se construyen proxies medibles:
- **Escalamiento**: ¿la queja llegó por Entes de Control? (binaria)
- **Recurrencia**: ¿el cliente tiene >1 queja? (binaria / conteo)
- **Severidad textual**: score de urgencia/frustración extraído del NLP (Fase 2)

### 3.2 Feature engineering
Desde las fases anteriores se construyen las variables explicativas:
- **Tema de la queja** (categórica, de Fase 2): demora pago, error monto, etc.
- **Canal** de comunicación
- **Tipo de cliente**: persona natural vs empresa (extraído del nombre)
- **Longitud del texto** (proxy de complejidad del caso)
- **Mes** (temporalidad)
- **Cantidad de radicados mencionados** en el texto
- **Menciona fechas antiguas** (proxy de demora acumulada)

### 3.3 Modelos explicables
- **Logistic Regression**: coeficientes directos → "el tema X multiplica por 3.2x la probabilidad de escalar"
- **Random Forest / XGBoost + SHAP values**: importancia de cada feature con dirección e interacciones
- **SHAP summary plot**: visualización global de qué factores más influyen y en qué dirección
- **SHAP dependence plots**: interacciones (ej: tema × canal)

### 3.4 Resultados esperados
- Ranking cuantificado de causas raíz con % de contribución
- Perfiles de riesgo: combinaciones de factores que generan mayor insatisfacción
- Recomendaciones accionables basadas en los factores con mayor peso

### 3.5 Métricas clave propuestas
- **Volumen de quejas** por mes, canal, tema
- **Tasa de recurrencia** (clientes que vuelven a quejarse)
- **Tiempo implícito de resolución** (extraído del texto cuando mencionan fechas)
- **Índice de escalamiento** (% que llega a entes de control)
- **Distribución temática** (% por categoría de queja)
- **Concentración de quejas** (Pareto: ¿el 20% de clientes genera el 80% de quejas?)
- **SHAP importance score** por factor (contribución cuantificada a insatisfacción)

---

## FASE 4: Modelo de Clasificación Automática
**Notebook:** `04_modelo_clasificacion.ipynb`

### 4.1 Etiquetado
- Usar las categorías descubiertas en Fase 2 como etiquetas
- Validación manual de una muestra (~100 registros)

### 4.2 Modelo
- TF-IDF + clasificador (Logistic Regression, Random Forest, SVM)
- Evaluar con cross-validation
- Matriz de confusión por categoría

### 4.3 Predicción de insatisfacción
- Feature engineering: recurrencia del cliente, canal, tema, longitud del texto
- Modelo predictivo: ¿qué clientes tienen alta probabilidad de escalar?

---

## FASE 5: Dashboard
**Archivo:** `dashboard/app.py` (Streamlit)

### Vistas propuestas
1. **Resumen ejecutivo**: KPIs principales, tendencia mensual
2. **Análisis por canal**: distribución y evolución temporal
3. **Análisis temático**: categorías de quejas, wordclouds, drill-down
4. **Clientes recurrentes**: top clientes, patrones de recurrencia
5. **Predicción**: clasificación automática de nuevas quejas

### Preguntas que responde
- ¿Qué tipo de quejas son más frecuentes?
- ¿Hay clientes o canales recurrentes?
- ¿Se pueden predecir clientes con alta probabilidad de insatisfacción?

---

## FASE 6: Flujo Automatizado
### Diseño conceptual
1. **Ingesta semanal**: script que lee nuevos archivos Excel de una carpeta
2. **Preprocesamiento**: limpieza de texto, normalización
3. **Clasificación automática**: modelo entrenado clasifica nuevas quejas
4. **Actualización de métricas**: recalcula indicadores
5. **Refresh del dashboard**: Streamlit se actualiza automáticamente

### Herramientas sugeridas
- **Orquestación**: Apache Airflow / cron job + Python scripts
- **Almacenamiento**: SQLite (prototipo) → PostgreSQL (producción)
- **Dashboard**: Streamlit con auto-refresh
- **Modelo**: serializado con joblib, reentrenamiento mensual

---

## FASE 7: Dinámica de Sistemas + BPM (Punto 5)
**Archivo:** `docs/metodologia_punto5.md`

> **Enfoque:** El proceso de pagos de incapacidades es un **sistema con flujos, colas,
> retroalimentación y cuellos de botella**. Se modela como tal.

### 7.1 Mapeo del proceso AS-IS (BPMN)
- Diagrama del flujo actual: Radicación → Validación → Liquidación → Pago → Comunicación
- Identificar actores, decisiones, tiempos estimados por etapa
- Mapear puntos de falla que generan las quejas identificadas en Fases 2-3

### 7.2 Modelo de Dinámica de Sistemas
- **Stocks**: quejas pendientes, incapacidades en cola de pago, casos escalados
- **Flujos**: tasa de radicación, tasa de procesamiento, tasa de pago
- **Loops de retroalimentación**:
  - Loop negativo: demora → queja → carga al equipo de atención → más demora
  - Loop de escalamiento: sin respuesta → ente de control → presión → priorización reactiva
- **Cuellos de botella**: validar dónde el flujo se atasca (los datos de quejas lo dicen)
- Variables de palanca: ¿qué automatizar para romper los loops negativos?

### 7.3 Diseño TO-BE
- Proceso optimizado con la herramienta nueva
- Automatización de tareas manuales identificadas
- Trazabilidad end-to-end (radicación → pago con tracking visible para el usuario)
- Comunicación proactiva (reducir quejas de "estado de incapacidad")

### 7.4 Simulación de impacto
- ¿Qué pasa si automatizo la validación? ¿Cuánto bajan las quejas?
- ¿Si implemento notificaciones proactivas, cuántas consultas de estado se eliminan?
- Escenarios: pesimista, base, optimista

### 7.5 Metodología de ejecución
- **BPM + Pensamiento Sistémico** para el diseño
- **Scrum** para la ejecución iterativa
- Entregables de valor por sprint alineados a los cuellos de botella prioritarios

### 7.6 Entregables
1. Diagrama BPMN AS-IS y TO-BE
2. Modelo causal / diagrama de stocks & flows
3. Backlog priorizado por impacto en reducción de quejas
4. Roadmap de implementación por sprints
5. Métricas de éxito (reducción de quejas, tiempo de procesamiento, tasa de escalamiento)

---

## Orden de ejecución recomendado
| # | Fase | Prioridad | Dependencia |
|---|------|-----------|-------------|
| 1 | EDA y Calidad | Alta | Ninguna |
| 2 | NLP y Temas | Alta | Fase 1 |
| 3 | ML Explicable - Causas Raíz | Alta | Fase 2 |
| 4 | Clasificador | Media | Fase 2 |
| 5 | Dashboard | Media | Fase 3 |
| 6 | Automatización | Baja | Fase 4, 5 |
| 7 | Dinámica de Sistemas + BPM | Media | Fase 3 |
