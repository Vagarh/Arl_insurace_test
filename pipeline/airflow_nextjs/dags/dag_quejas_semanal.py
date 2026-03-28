"""
DAG: dag_quejas_semanal
Orquestación semanal del pipeline de quejas ARL SURA.

Ejecución: Lunes 6:00 AM (hora Bogotá, UTC-5 → 11:00 UTC)
Flujo: Extraer → Transformar → Clasificar → Exportar JSON → Notificar

Requisitos Airflow:
  - Variable SURA_DATA_PATH: ruta al Excel de quejas
  - Variable SURA_DASHBOARD_PATH: ruta a dashboard/public/data
  - Variable SURA_MODEL_PATH: ruta al modelo .joblib
  - Connection SURA_SMTP (opcional, para alertas por email)
"""

from datetime import datetime, timedelta
from airflow import DAG
from airflow.operators.python import PythonOperator, BranchPythonOperator
from airflow.operators.email import EmailOperator
from airflow.operators.empty import EmptyOperator
from airflow.models import Variable
import logging

# ── Configuración del DAG ──────────────────────────────────────────────────
DEFAULT_ARGS = {
    "owner": "analitica_sura",
    "depends_on_past": False,
    "email": ["analitica@sura.com.co"],
    "email_on_failure": True,
    "email_on_retry": False,
    "retries": 2,
    "retry_delay": timedelta(minutes=5),
}

dag = DAG(
    dag_id="quejas_semanal_sura",
    description="Pipeline semanal de clasificación y actualización de dashboard de quejas ARL SURA",
    schedule_interval="0 11 * * 1",   # Cada lunes 11:00 UTC = 6:00 AM Bogotá
    start_date=datetime(2025, 1, 6),
    catchup=False,
    tags=["sura", "quejas", "produccion"],
    default_args=DEFAULT_ARGS,
    doc_md=__doc__,
)


# ── Funciones de cada tarea ────────────────────────────────────────────────

def tarea_extraer(**context):
    """Carga el Excel de quejas y valida integridad mínima."""
    import pandas as pd
    from pathlib import Path

    data_path = Variable.get("SURA_DATA_PATH")
    df = pd.read_excel(data_path, sheet_name="Incapacidad Temporal")

    # Validaciones de calidad
    assert len(df) > 0, "El archivo está vacío"
    assert "Descripcion" in df.columns or "Descripción" in df.columns, \
        "Columna de descripción no encontrada"

    # Normalizar nombre de columna
    df.columns = df.columns.str.strip()
    if "Descripción" in df.columns:
        df = df.rename(columns={"Descripción": "Descripcion"})

    n_filas = len(df)
    n_nulos = df["Descripcion"].isna().sum()
    logging.info(f"Datos cargados: {n_filas} registros, {n_nulos} nulos en descripción")

    # Guardar en XCom para siguiente tarea
    context["ti"].xcom_push(key="n_registros", value=n_filas)
    context["ti"].xcom_push(key="n_nulos", value=int(n_nulos))

    # Serializar a parquet temporal (más eficiente que CSV para XCom grande)
    tmp_path = "/tmp/sura_quejas_raw.parquet"
    df.to_parquet(tmp_path, index=False)
    context["ti"].xcom_push(key="raw_path", value=tmp_path)

    return n_filas


def tarea_transformar(**context):
    """Limpia texto, extrae features NLP y construye features para el modelo."""
    import pandas as pd
    import re
    import unicodedata

    raw_path = context["ti"].xcom_pull(key="raw_path", task_ids="extraer")
    df = pd.read_parquet(raw_path)

    # ── Limpieza de texto ──────────────────────────────────────────────────
    STOPWORDS = {
        "de","la","el","en","y","a","los","del","se","las","por","un","con",
        "una","su","para","es","al","lo","que","le","da","son","no","hay",
    }

    def limpiar_texto(texto):
        if not isinstance(texto, str):
            return ""
        # Normalizar caracteres Unicode
        texto = unicodedata.normalize("NFKD", texto)
        texto = "".join(c for c in texto if not unicodedata.combining(c))
        texto = texto.lower()
        texto = re.sub(r"[^a-z0-9\s]", " ", texto)
        tokens = [t for t in texto.split() if len(t) > 2 and t not in STOPWORDS]
        return " ".join(tokens)

    df["texto_limpio"] = df["Descripcion"].fillna("").apply(limpiar_texto)

    # ── Features NLP por patrones de temas ────────────────────────────────
    TERMINOS = {
        "pago":              r"pag[oa]|cancel|liquidaci|abon|transfer|desembolso",
        "incapacidad":       r"incapacidad|incapac|dias? incap|periodo incap",
        "radicacion":        r"radic|radicar|radicado|n[uú]mero de caso",
        "respuesta":         r"respuesta|no respond|sin respuesta|espera|esperando",
        "tramite":           r"tr[aá]mite|proceso|gesti[oó]n|demor[ao]",
        "estado":            r"estado|seguimiento|consultar estado|actualiz",
        "tiempo":            r"tiempo|d[ií]as?|meses?|semanas?|tardanza|retraso",
        "certificado":       r"certificad|document|soporte|anexo|adjunt",
        "tutela":            r"tutela|acci[oó]n legal|juzgado|fallo",
        "derecho_peticion":  r"derecho de petici|petici[oó]n|queja formal",
        "monto":             r"valor|monto|cuant[ií]a|pesos|plata|dinero",
        "empresa":           r"empresa|empleador|empleado|contrato|vinculaci",
    }

    for feature, patron in TERMINOS.items():
        df[f"f_{feature}"] = df["texto_limpio"].str.contains(patron, regex=True).astype(int)

    # ── Features estructurales ─────────────────────────────────────────────
    df["longitud_texto"] = df["Descripcion"].fillna("").str.len()
    q25 = df["longitud_texto"].quantile(0.25)
    q75 = df["longitud_texto"].quantile(0.75)
    df["texto_corto"]  = (df["longitud_texto"] < q25).astype(int)
    df["texto_largo"]  = (df["longitud_texto"] > q75).astype(int)

    # Features de canal (one-hot)
    canales = ["SEGUROSSURA.COM.CO", "LINEA DE ATENCIÓN", "ENTES DE CONTROL", "PLATAFORMA DE ATENCIÓN"]
    for canal in canales:
        col = "canal_" + canal.lower().replace(" ", "_").replace(".", "_")
        df[col] = (df["Canal de comunicacion"].fillna("") == canal).astype(int)

    # Recurrencia del cliente
    recurrencia = df.groupby("Nombre del cliente")["Nombre del cliente"].transform("count")
    df["n_quejas_cliente"] = recurrencia
    df["cliente_recurrente"] = (recurrencia >= 2).astype(int)
    df["cliente_critico"]   = (recurrencia >= 3).astype(int)

    # Mes de apertura
    df["mes"] = pd.to_numeric(df["Mes apertura"].astype(str).str[-2:], errors="coerce").fillna(0).astype(int)

    tmp_path = "/tmp/sura_quejas_features.parquet"
    df.to_parquet(tmp_path, index=False)
    context["ti"].xcom_push(key="features_path", value=tmp_path)

    logging.info(f"Features generadas: {len(df)} registros, {len([c for c in df.columns if c.startswith('f_')])} features NLP")


def tarea_clasificar(**context):
    """Aplica el modelo Random Forest para clasificar cada queja."""
    import pandas as pd
    import joblib
    from pathlib import Path

    features_path = context["ti"].xcom_pull(key="features_path", task_ids="transformar")
    model_path    = Variable.get("SURA_MODEL_PATH")

    df = pd.read_parquet(features_path)
    model = joblib.load(model_path)

    # Features del modelo (deben coincidir con el entrenamiento en NB04)
    FEATURES = [
        "f_pago","f_incapacidad","f_radicacion","f_respuesta","f_tramite",
        "f_estado","f_tiempo","f_certificado","f_tutela","f_derecho_peticion",
        "f_monto","f_empresa","longitud_texto","texto_corto","texto_largo",
        "n_quejas_cliente","cliente_recurrente","cliente_critico","mes",
        "canal_segurossura_com_co","canal_linea_de_atención",
        "canal_entes_de_control","canal_plataforma_de_atención",
    ]

    # Solo usar features que existan en el dataframe
    features_disponibles = [f for f in FEATURES if f in df.columns]
    X = df[features_disponibles].fillna(0)

    df["prob_riesgo"] = model.predict_proba(X)[:, 1]
    df["clasificacion"] = (df["prob_riesgo"] >= 0.5).map({True: "Alto Riesgo", False: "Normal"})
    df["score_categoria"] = pd.cut(
        df["prob_riesgo"],
        bins=[0, 0.3, 0.5, 0.7, 1.0],
        labels=["Bajo", "Medio", "Alto", "Crítico"],
    )

    tmp_path = "/tmp/sura_quejas_clasificadas.parquet"
    df.to_parquet(tmp_path, index=False)
    context["ti"].xcom_push(key="clasificadas_path", value=tmp_path)

    n_alto = (df["clasificacion"] == "Alto Riesgo").sum()
    logging.info(f"Clasificación: {n_alto}/{len(df)} quejas de alto riesgo ({n_alto/len(df):.1%})")
    context["ti"].xcom_push(key="n_alto_riesgo", value=int(n_alto))


def tarea_exportar_json(**context):
    """Genera los JSON del dashboard Next.js desde los datos clasificados."""
    import pandas as pd
    import json
    from pathlib import Path
    from datetime import date

    clasificadas_path = context["ti"].xcom_pull(key="clasificadas_path", task_ids="clasificar")
    dashboard_dir     = Path(Variable.get("SURA_DASHBOARD_PATH"))
    dashboard_dir.mkdir(parents=True, exist_ok=True)

    df = pd.read_parquet(clasificadas_path)

    # ── 1. Clasificacion resumen ───────────────────────────────────────────
    cats = df["score_categoria"].value_counts().to_dict()
    resumen_clasificacion = {
        "fecha_actualizacion": date.today().isoformat(),
        "total_quejas": len(df),
        "distribucion": {str(k): int(v) for k, v in cats.items()},
        "pct_alto_riesgo": round((df["clasificacion"] == "Alto Riesgo").mean() * 100, 1),
    }
    (dashboard_dir / "clasificacion_resumen.json").write_text(
        json.dumps(resumen_clasificacion, ensure_ascii=False, indent=2)
    )

    # ── 2. Scoring clientes ────────────────────────────────────────────────
    scoring = (
        df.groupby("Nombre del cliente")
        .agg(
            n_quejas=("Nombre del cliente", "count"),
            prob_riesgo_max=("prob_riesgo", "max"),
            n_escalados=("canal_entes_de_control", "sum"),
        )
        .reset_index()
        .rename(columns={"Nombre del cliente": "cliente_norm"})
    )
    scoring["score_riesgo"] = (scoring["prob_riesgo_max"] * 100).round(1)
    scoring["segmento"] = scoring["n_escalados"].apply(
        lambda x: "Crítico" if x > 0 else "Normal"
    )
    scoring["lenguaje_legal"] = 0  # placeholder
    (dashboard_dir / "scoring_clientes.json").write_text(
        scoring.to_json(orient="records", force_ascii=False)
    )

    # ── 3. Alertas ────────────────────────────────────────────────────────
    vol_mensual = df.groupby("mes").size().to_dict()
    alertas = {
        "fecha_actualizacion": date.today().isoformat(),
        "forecast_proximo_mes": int(df["mes"].value_counts().median() * 1.05),
        "umbral_alerta": 369,
        "canales": {
            "SEGUROSSURA.COM.CO": int(df["canal_segurossura_com_co"].sum()),
            "LINEA DE ATENCIÓN": int(df["canal_linea_de_atención"].sum()),
            "ENTES DE CONTROL": int(df["canal_entes_de_control"].sum()),
        },
        "vol_mensual": {str(k): int(v) for k, v in vol_mensual.items()},
    }
    (dashboard_dir / "alertas.json").write_text(
        json.dumps(alertas, ensure_ascii=False, indent=2)
    )

    logging.info(f"JSON exportados a {dashboard_dir}")


def decidir_alerta(**context):
    """Branch: si hay >20% quejas de alto riesgo, enviar alerta por email."""
    n_alto      = context["ti"].xcom_pull(key="n_alto_riesgo", task_ids="clasificar")
    n_registros = context["ti"].xcom_pull(key="n_registros", task_ids="extraer")
    pct = n_alto / n_registros if n_registros else 0
    return "enviar_alerta" if pct > 0.20 else "sin_alerta"


# ── Definición de tareas ───────────────────────────────────────────────────

t_extraer = PythonOperator(
    task_id="extraer",
    python_callable=tarea_extraer,
    dag=dag,
)

t_transformar = PythonOperator(
    task_id="transformar",
    python_callable=tarea_transformar,
    dag=dag,
)

t_clasificar = PythonOperator(
    task_id="clasificar",
    python_callable=tarea_clasificar,
    dag=dag,
)

t_exportar = PythonOperator(
    task_id="exportar_json",
    python_callable=tarea_exportar_json,
    dag=dag,
)

t_branch = BranchPythonOperator(
    task_id="decidir_alerta",
    python_callable=decidir_alerta,
    dag=dag,
)

t_alerta = EmailOperator(
    task_id="enviar_alerta",
    to=["analitica@sura.com.co", "gerencia@sura.com.co"],
    subject="[SURA] Alerta: volumen de quejas de alto riesgo elevado",
    html_content="""
    <h2>Alerta automática — Pipeline de Quejas ARL SURA</h2>
    <p>El pipeline semanal detectó un porcentaje de quejas de alto riesgo superior al 20%.</p>
    <p>Revise el dashboard para detalles: <a href="http://dashboard.sura.internal">Dashboard</a></p>
    """,
    dag=dag,
)

t_sin_alerta = EmptyOperator(task_id="sin_alerta", dag=dag)
t_fin        = EmptyOperator(task_id="fin", trigger_rule="none_failed_min_one_success", dag=dag)

# ── Dependencias ───────────────────────────────────────────────────────────
t_extraer >> t_transformar >> t_clasificar >> t_exportar >> t_branch
t_branch >> [t_alerta, t_sin_alerta]
t_alerta >> t_fin
t_sin_alerta >> t_fin
