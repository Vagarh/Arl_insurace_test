# Resumen Ejecutivo: Análisis de Quejas ARL SURA (Ene–Jun 2025)

## 1. Contexto y Objetivo

ARL SURA atiende más de 500,000 clientes activos en pagos a prestadores de salud por accidentes laborales. En los últimos 12 meses se registró una **caída sostenida en satisfacción** y un aumento de quejas formales. Este proyecto analiza **1,841 quejas de incapacidades temporales** (enero–junio 2025) para identificar causas raíz, cuantificar su impacto y proponer soluciones accionables.

**Metodología**: NLP (TF-IDF + LDA + spaCy en español) para extracción de temas → Machine Learning explicable (Random Forest + SHAP) para cuantificar causas → Dinámica de Sistemas para modelar el proceso de pagos como sistema con loops de retroalimentación.

---

## 2. Hallazgos Principales

### 2.1 El problema no es el volumen — es la recurrencia

| Indicador | Valor | Señal |
|-----------|-------|-------|
| Quejas totales | 1,841 | Período: 6 meses |
| Clientes únicos | 1,334 | — |
| Clientes recurrentes (>1 queja) | 277 (20.7%) | Generan el 42.6% del volumen |
| Concentración Pareto | ~18.5% de clientes | Generan el 80% de las quejas |
| Escalamiento a Entes de Control | 8.5% | Tasa de crisis del sistema |

El hallazgo central: **el sistema no está resolviendo los problemas en el primer contacto**. El 20.7% de clientes que vuelve a quejarse genera casi la mitad del volumen total. Esto indica una falla de resolución, no solo de recepción.

### 2.2 Las 7 categorías temáticas (NLP)

El análisis de texto libre identificó 7 categorías con distribución estable a lo largo de los 6 meses:

1. **Estado de incapacidad** (~35%) — *"¿en qué estado está mi radicado?"*
2. **Demora en pago** (~25%) — *"llevan meses sin pagarme"*
3. **Solicitud de documentos** (~15%) — certificados, soportes, cartas de pago
4. **Radicación con problemas** (~10%) — el radicado no aparece o la plataforma falla
5. **Error en monto pagado** (~7%) — pago incorrecto o a destinatario equivocado
6. **Escalamiento legal** (~5%) — tutelas, derechos de petición, quejas formales
7. **Inconformidad general** (~3%) — trato, comunicación, falta de respuesta

**Interpretación clave**: los temas 1, 2 y 4 (~70%) comparten la misma raíz: **el cliente no tiene visibilidad del estado de su proceso** y usa la queja como único mecanismo de consulta. Esto es un problema de transparencia, no de capacidad de pago.

### 2.3 Causas raíz cuantificadas (SHAP)

El modelo ML explicable identificó qué factores predicen más la insatisfacción grave (escalamiento o recurrencia):

| Factor | Efecto sobre riesgo |
|--------|---------------------|
| Recurrencia del cliente | **+2.66x** — el mayor predictor individual |
| Canal Entes de Control | Indicador tardío de crisis ya instalada |
| Lenguaje legal (tutela, derecho de petición) | Señal de umbral de escalamiento inminente |
| "Pago" + "meses/semanas" | Señal clara de demora crónica acumulada |
| Descripción larga (>800 chars) | Complejidad no resuelta en contactos previos |

---

## 3. Análisis por Canal

| Canal | % del volumen | Característica |
|-------|--------------|----------------|
| SEGUROSSURA.COM.CO | 55% | Canal principal; clientes autogestionados que no encuentran respuesta en el portal |
| LÍNEA DE ATENCIÓN | 35% | Canal de escalamiento informal |
| ENTES DE CONTROL | 8.5% | Canal de crisis; SLA externo forzado |
| PLATAFORMA DE ATENCIÓN | 1.8% | Uso residual |

**Hallazgo del canal web**: el 55% que llega al portal está buscando información que debería estar disponible sin quejarse. La queja web es un síntoma de autogestión fallida.

---

## 4. KPIs Propuestos con Línea Base

| KPI | Línea base actual | Objetivo 12 meses |
|-----|------------------|-------------------|
| Tasa de Escalamiento | 8.5% | < 3% |
| FCR (First Contact Resolution) | ~79% | > 90% |
| Tasa de Recurrencia de Clientes | 20.7% | < 10% |
| Índice de Urgencia Textual (lenguaje legal) | ~5% | < 1% |
| Concentración Pareto (quejas) | top 18.5% → 80% | top 20% → < 50% |

---

## 5. Recomendaciones Estratégicas (Prioridad por Impacto)

### Prioridad 1 — Visibilidad del proceso (impacto: -30% a -40% del volumen)
Implementar portal de tracking de incapacidades en tiempo real en SEGUROSSURA.COM.CO. El cliente debe poder consultar en qué etapa está su caso sin necesidad de llamar ni quejarse. Estimado: elimina el grueso de las categorías 1 y 4.

### Prioridad 2 — Notificaciones proactivas (impacto: -15% a -20%)
Alertas automáticas por WhatsApp/email en cada cambio de estado: radicado → validado → en liquidación → pagado. Anticipa la consulta antes de que se convierta en queja.

### Prioridad 3 — Fast-Track para clientes recurrentes (impacto: -10%)
Crear un flujo de atención prioritario para los 277 clientes recurrentes. Un cliente que ya se quejó una vez y no fue resuelto tiene 2.66x más probabilidad de escalar. Intervención temprana en el segundo contacto corta el espiral.

### Prioridad 4 — Clasificador automático con alerta de urgencia (impacto: -8%)
El clasificador NLP desarrollado (NB02–NB03) puede identificar en tiempo real quejas con lenguaje legal (tutelas, derechos de petición) y asignarlas a un equipo especializado antes de que lleguen a Entes de Control.

### Impacto total estimado: **-55% a -63% del volumen de quejas**

---

## 6. Entregables del Proyecto

| Entregable | Estado | Detalle |
|---|---|---|
| 1. Patrones y causas raíz | ✅ Completo | 7 categorías NLP + SHAP quantificado |
| 2. Métricas clave | ✅ Completo | 5 KPIs con línea base y objetivos |
| 3. Dashboard interactivo | ✅ Construido | Next.js, 5 vistas, clasificador en vivo |
| 4. Flujo automatizado | ⚠️ Diseñado | Pipeline documentado, módulos pendientes de refactorizar |
| 5. Metodología optimización pagos | ✅ Completo | Dinámica de Sistemas + BPMN + simulación de impacto |

---

*Prueba Técnica — Analítica de Datos y Procesos — ARL SURA — Marzo 2026*
