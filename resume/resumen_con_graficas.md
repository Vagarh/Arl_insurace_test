# Análisis de Quejas ARL SURA — Resultados con Gráficas
**Prueba Técnica · Datos y Procesos · Enero–Junio 2025**
**Dashboard:** https://dashboard-xi-nine-20.vercel.app

---

## Paso 1 · Volumen y Comportamiento Temporal

**Pregunta:** ¿Cuándo se concentran las quejas y hay tendencia?

![Volumen Mensual de Quejas](images/volumen_mensual.png)

**Resultado:**
- Pico en **marzo (370 quejas)** → coincide con período post-liquidación trimestral
- Tendencia **decreciente en mayo–junio** (254 → 173): posible efecto de corte de datos o estacionalidad
- Promedio base: **307 quejas/mes** → usado como referencia para el umbral de alerta del forecast

> **Traducción negocio:** El sistema tiene una demanda predecible con picos estacionales. Anticipar estos picos con el modelo de forecast permite dimensionar el equipo con 4 semanas de margen.

---

## Paso 2 · Distribución por Canal de Comunicación

**Pregunta:** ¿Por dónde llegan las quejas y qué dice eso del cliente?

![Distribución por Canal](images/distribucion_canales.png)

**Resultado:**

| Canal | % | Interpretación |
|---|---|---|
| SEGUROSSURA.COM.CO | 55% | Cliente digital autogestionado que no encuentra información |
| LÍNEA DE ATENCIÓN | 35% | Escalamiento informal tras falla en canal web |
| ENTES DE CONTROL | 8.5% | Crisis instalada — SLA regulatorio obligatorio |
| PLATAFORMA DE ATENCIÓN | 1.8% | Uso residual |

> **Traducción negocio:** El 55% del volumen es queja web evitable. El cliente usa el formulario de quejas como buscador de estado porque no tiene otra opción. Portal de tracking elimina este canal sin tocar el proceso de pago.

---

## Paso 3 · Recurrencia de Clientes

**Pregunta:** ¿Hay clientes que se quejan repetidamente? ¿Concentración?

![Recurrencia de Clientes](images/recurrencia_clientes.png)

**Resultado:**
- **277 clientes (20.7%)** con más de una queja → generan el **42.6% del volumen total**
- Concentración tipo Pareto: top 18.5% de clientes → 80% de quejas
- Factor de riesgo multiplicador: cliente recurrente tiene **2.66x** más probabilidad de escalar a Entes de Control

> **Traducción negocio:** Intervenir el 20% de clientes recurrentes con fast-track resuelve casi la mitad del problema operativo. Es el punto de mayor palanca con menor inversión.

---

## Paso 4 · Scoring y Ranking de Riesgo por Cliente

**Pregunta:** ¿A qué clientes debo atender primero?

![Ranking Riesgo Clientes](images/05_ranking_riesgo_clientes.png)
![Scoring de Riesgo](images/05_scoring_riesgo.png)

**Resultado:**
- Modelo Random Forest (AUC-ROC = **0.81**) asigna probabilidad de escalamiento a cada queja
- Score 0–100: Bajo (0–30) · Medio (30–50) · Alto (50–70) · Crítico (70–100)
- ~27% de quejas clasificadas como "Alto Riesgo"
- Variable Y proxy: `escaló a Entes de Control` OR `≥3 quejas en el período`

> **Traducción negocio:** El clasificador permite al equipo de atención priorizar los casos críticos antes de que lleguen al regulador. De 10 casos urgentes, el sistema detecta 8 correctamente.

---

## Paso 5 · Forecast de Volumen

**Pregunta:** ¿Cuántas quejas esperamos el próximo mes? ¿Hay alerta?

![Forecast Volumen](images/05_forecast_volumen.png)

**Resultado:**
- Método: **Exponential Smoothing** con banda de confianza 80%
- Forecast julio 2025: **384 quejas** (IC 80%: 351–417)
- Umbral de alerta definido: **369 quejas/mes**
- **Estado: 🔴 ALERTA ACTIVA** — forecast supera el umbral

| Mes | Forecast base | Límite inferior | Límite superior |
|---|---|---|---|
| Julio 2025 | 384 | 351 | 417 |
| Agosto 2025 | 401 | 362 | 440 |
| Septiembre 2025 | 415 | 368 | 462 |
| Octubre 2025 | 426 | 371 | 481 |

> **Traducción negocio:** Sin intervención, el volumen seguirá creciendo. Julio ya supera la capacidad estándar. El dashboard activa alerta automática cuando el forecast cruza el umbral.

---

## Paso 6 · Dinámica de Sistemas — Simulación de Escenarios

**Pregunta:** ¿Qué impacto real tiene cada intervención en el proceso de pagos?

### 6a. Comportamiento AS-IS (sin cambios)

![Dinámica AS-IS](images/06_dinamica_asis.png)

El modelo ODE (ecuación diferencial ordinaria) simula el backlog de casos como stock con entradas (nuevas quejas) y salidas (resoluciones). **Sin intervención: 169 casos represados al mes 12.**

### 6b. Comparativa de 6 Escenarios

![Comparativa Escenarios](images/06_comparativa_escenarios.png)

| Escenario | Backlog mes 12 | Reducción |
|---|---|---|
| AS-IS (sin cambios) | 169 | — |
| +20% capacidad | 112 | -34% |
| -30% tasa de error | 98 | -42% |
| +20% cap + -30% error | 61 | -64% |
| Automatización básica | 45 | -73% |
| **TO-BE completo** | **21** | **-88%** |

### 6c. Impacto de Intervenciones en el Tiempo

![Impacto Intervenciones](images/06_impacto_intervenciones.png)

### 6d. Análisis de Sensibilidad (Tornado)

![Sensibilidad Tornado](images/06_sensibilidad_tornado.png)

**Parámetros más críticos del sistema:**

| Parámetro | Impacto en backlog |
|---|---|
| Entrada de quejas (volumen) | 42% — el más determinante |
| Tasa de error en pagos | 28% |
| Capacidad de resolución | 15% |
| Tiempo de procesamiento | 8% |
| Tasa de recurrencia | 5% |
| Escalamiento a entes | 2% |

> **Traducción negocio:** Reducir el volumen entrante (notificaciones proactivas + portal) tiene mayor impacto que contratar más personal. La automatización del proceso TO-BE reduce el backlog un **88% en 12 meses**.

---

## Resumen de Resultados — Prueba Técnica

| Entregable | Método | Resultado clave |
|---|---|---|
| Patrones NLP | 12 features regex · texto libre | 68% de quejas por demora/falta de visibilidad |
| Causas raíz | Random Forest + SHAP | Recurrencia = factor ×2.66 de riesgo |
| Métricas | EDA + forecast | Alerta activa julio 2025 |
| Dashboard | Next.js 14 · 6 vistas | https://dashboard-xi-nine-20.vercel.app |
| Pipeline | Airflow DAG + Power BI | Automatización semanal sin intervención |
| Optimización pagos | ODE + BPM · 6 escenarios | -88% backlog con TO-BE completo |

---

*ARL SURA · Prueba Técnica Datos y Procesos · Marzo 2026*
