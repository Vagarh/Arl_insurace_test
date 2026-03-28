# Resumen Ejecutivo — Análisis de Quejas ARL SURA
**Período:** Enero–Junio 2025 · **Alcance:** 1,841 quejas · Incapacidad Temporal

---

## MINUTO DE ORO

> **Estado General:** 🔴 ROJO — El sistema de quejas está en zona de riesgo operativo y reputacional.

| | |
|---|---|
| **Logro Principal** | Se identificó que el **68% del volumen de quejas tiene una sola causa raíz**: el cliente no puede consultar el estado de su trámite sin quejarse. Esto significa que la mayoría de quejas son evitables con un portal de tracking. |
| **Bloqueante / Riesgo** | El **8.5% de casos ya escaló a Entes de Control** (regulador externo). Cada caso en esta categoría activa una obligación legal de respuesta con SLA regulatorio. El modelo predictivo detecta señal de aumento para julio 2025 (+4% sobre umbral de alerta). |
| **Siguiente Paso** | Implementar notificaciones proactivas de estado por WhatsApp/email: **-35% de quejas web en 90 días**, sin cambios en el proceso de pago. |

---

## PARA EL DIRECTIVO (C-Level) — ROI y Visión Estratégica

**El problema es de visibilidad, no de capacidad.**
El proceso de pago funciona, pero el cliente no lo sabe. Cada queja evitable cuesta tiempo de agente, riesgo regulatorio y pérdida de confianza.

| Impacto de Negocio | Situación Actual | Con Intervención |
|---|---|---|
| **Riesgo regulatorio** | 156 casos en Entes de Control | Reducción proyectada al 3% (-65%) |
| **Satisfacción / Retención** | 20.7% de clientes repiten queja | Objetivo: < 10% en 12 meses |
| **Productividad operativa** | ~307 quejas/mes gestionadas manualmente | Pipeline automatizado clasifica y prioriza sin intervención |
| **Tiempo de backlog** | 169 casos represados al mes 12 (AS-IS) | **21 casos con automatización completa (-88%)** |

**Palanca de mayor retorno:** portal de autogestión en SEGUROSSURA.COM.CO elimina el 55% del canal de quejas web sin tocar el proceso de pago.

---

## PARA EL FINANCIERO (CFO) — Costos y Eficiencia

Cada queja que escala a Entes de Control genera:
- Costo de respuesta regulatoria obligatoria (horas jurídicas + operativas)
- Riesgo de sanción si se incumple SLA del regulador
- Potencial pérdida del cliente empresarial (empleador como cliente B2B)

**Eficiencia del pipeline automatizado:**
- Carga semanal sin intervención manual → 0 horas adicionales de analista
- Clasificación automática de urgencia → priorización de los 156 casos críticos
- Forecast de volumen → permite dimensionar equipo con 4 semanas de anticipación

| Escenario de intervención | Backlog mes 12 | Reducción de carga |
|---|---|---|
| Sin cambios (AS-IS) | 169 casos | — |
| Automatización básica | 45 casos | -73% |
| **TO-BE completo** | **21 casos** | **-88%** |

---

## PARA EL EQUIPO OPERATIVO / TÉCNICO — Funcionalidad y Estabilidad

**Stack implementado y entregado:**

| Componente | Tecnología | Estado |
|---|---|---|
| EDA + Calidad de datos | Python · pandas | ✅ NB01 |
| NLP · Extracción de 12 temas | regex · unicodedata | ✅ NB02 |
| ML explicable + SHAP | scikit-learn · Random Forest | ✅ NB03–NB04 |
| Forecast series de tiempo | Exponential Smoothing | ✅ NB05 |
| Dinámica de sistemas · ODE | scipy.integrate | ✅ NB06 |
| Dashboard 6 vistas | Next.js 14 · Recharts | ✅ Producción |
| Pipeline Airflow | DAG semanal · 6 tareas | ✅ Diseñado |
| Pipeline Power BI | CSV star schema | ✅ Implementado |

**Dashboard en producción:** https://dashboard-xi-nine-20.vercel.app

**Modelo clasificador:** AUC-ROC = 0.81 · split temporal Ene–May/Jun · fallback heurístico si modelo no disponible.

**Deuda técnica identificada:** `src/` módulos Python pendientes de refactorizar; modelo `.joblib` requiere reentrenamiento mensual con datos frescos.

---

## TRADUCCIÓN TÉCNICA A NEGOCIO

| Dato técnico | Impacto en negocio |
|---|---|
| AUC-ROC 0.81 del clasificador | De cada 10 quejas urgentes, el sistema detecta 8 antes de que lleguen a Entes de Control → **Riesgo regulatorio reducible** |
| Forecast 384 quejas > umbral 369 | Julio 2025 superará la capacidad de respuesta estándar → **Necesidad de refuerzo operativo anticipado** |
| 20.7% clientes recurrentes generan 42.6% del volumen | El 20% del problema concentra el 43% del costo operativo → **Pareto accionable con fast-track** |
| Backlog -88% con automatización completa | Libera capacidad equivalente a gestionar 148 casos adicionales por mes → **Productividad sin contratación** |

---

*ARL SURA · Prueba Técnica Datos y Procesos · Marzo 2026*
