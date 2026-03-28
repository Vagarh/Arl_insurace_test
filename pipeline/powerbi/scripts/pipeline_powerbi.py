"""
Pipeline Power BI — Escenario B
Genera los archivos Excel/CSV que Power BI Desktop consume mediante DirectQuery local
o que Power BI Service refresca automáticamente desde SharePoint/OneDrive.

Uso:
  python pipeline_powerbi.py --input <ruta_excel> [--output <carpeta_salida>]

Estrategia de actualización automática en Power BI:
  - Guardar los CSV de salida en una carpeta de OneDrive/SharePoint.
  - En Power BI Service: Dataset Settings → Scheduled Refresh → cada semana.
  - Power BI Desktop puede usar "Actualizar ahora" manual.

Alternativamente ejecutar este script con cron (Linux/Mac) o Task Scheduler (Windows):
  # cron: cada lunes a las 7am
  0 7 * * 1 /usr/bin/python3 /ruta/pipeline_powerbi.py --input /ruta/BD_Quejas.xlsx
"""

import argparse
import json
import logging
import re
import unicodedata
from datetime import date
from pathlib import Path

import pandas as pd

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
log = logging.getLogger(__name__)

BASE_DIR       = Path(__file__).resolve().parents[3]
DEFAULT_INPUT  = BASE_DIR / "req/BD_Quejas_Analitica.xlsx"
DEFAULT_OUTPUT = BASE_DIR / "pipeline/powerbi/outputs"
DEFAULT_MODEL  = BASE_DIR / "src/modelo_scoring.joblib"

STOPWORDS = {
    "de","la","el","en","y","a","los","del","se","las","por","un","con",
    "una","su","para","es","al","lo","que","le","da","son","no","hay",
}

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


def limpiar_texto(texto: str) -> str:
    if not isinstance(texto, str):
        return ""
    texto = unicodedata.normalize("NFKD", texto)
    texto = "".join(c for c in texto if not unicodedata.combining(c))
    texto = texto.lower()
    texto = re.sub(r"[^a-z0-9\s]", " ", texto)
    tokens = [t for t in texto.split() if len(t) > 2 and t not in STOPWORDS]
    return " ".join(tokens)


def construir_dataset_principal(df: pd.DataFrame, model_path: Path) -> pd.DataFrame:
    """Tabla principal: una fila por queja con todas las features y clasificación."""
    df = df.copy()
    df.columns = df.columns.str.strip()
    if "Descripción" in df.columns:
        df = df.rename(columns={"Descripción": "Descripcion"})

    df["texto_limpio"] = df["Descripcion"].fillna("").apply(limpiar_texto)

    for feat, patron in TERMINOS.items():
        df[f"tema_{feat}"] = df["texto_limpio"].str.contains(patron, regex=True).astype(int)

    df["longitud_texto"] = df["Descripcion"].fillna("").str.len()

    recurrencia = df.groupby("Nombre del cliente")["Nombre del cliente"].transform("count")
    df["n_quejas_cliente"]   = recurrencia
    df["cliente_recurrente"] = (recurrencia >= 2).astype(int)
    df["cliente_critico"]    = (recurrencia >= 3).astype(int)

    df["es_escalado"] = (df.get("Canal de comunicacion", pd.Series()).fillna("") == "ENTES DE CONTROL").astype(int)
    df["mes"]         = pd.to_numeric(df["Mes apertura"].astype(str).str[-2:], errors="coerce").fillna(0).astype(int)

    nombre_mes = {1:"Ene",2:"Feb",3:"Mar",4:"Abr",5:"May",6:"Jun",
                  7:"Jul",8:"Ago",9:"Sep",10:"Oct",11:"Nov",12:"Dic"}
    df["mes_nombre"] = df["mes"].map(nombre_mes).fillna("Desconocido")

    # Scoring de riesgo
    if model_path.exists():
        import joblib
        model = joblib.load(model_path)
        feat_cols = [c for c in df.columns if c.startswith("tema_") or c in [
            "longitud_texto","n_quejas_cliente","cliente_recurrente","cliente_critico","mes"
        ]]
        df["prob_riesgo"] = model.predict_proba(df[feat_cols].fillna(0))[:, 1]
    else:
        # Heurístico
        df["prob_riesgo"] = (
            df["tema_tutela"] * 0.35 +
            df["tema_derecho_peticion"] * 0.25 +
            df["tema_respuesta"] * 0.15 +
            df["cliente_critico"] * 0.15 +
            df["tema_tiempo"] * 0.10
        ).clip(0, 1)

    df["score_riesgo_pct"] = (df["prob_riesgo"] * 100).round(1)
    df["clasificacion"]    = (df["prob_riesgo"] >= 0.5).map({True: "Alto Riesgo", False: "Normal"})
    df["segmento_riesgo"]  = pd.cut(
        df["prob_riesgo"],
        bins=[0, 0.3, 0.5, 0.7, 1.0],
        labels=["Bajo (0-30%)", "Medio (30-50%)", "Alto (50-70%)", "Crítico (70-100%)"],
    ).astype(str)

    return df


def exportar_tablas_powerbi(df: pd.DataFrame, output_dir: Path) -> None:
    """Genera las tablas optimizadas para el modelo de datos Power BI."""
    output_dir.mkdir(parents=True, exist_ok=True)

    # ── Tabla de hechos: quejas ────────────────────────────────────────────
    cols_hechos = [
        "Mes apertura", "mes", "mes_nombre",
        "Nombre del cliente", "Canal de comunicacion",
        "Descripcion", "longitud_texto",
        "n_quejas_cliente", "cliente_recurrente", "cliente_critico",
        "es_escalado", "prob_riesgo", "score_riesgo_pct",
        "clasificacion", "segmento_riesgo",
    ] + [c for c in df.columns if c.startswith("tema_")]

    tabla_hechos = df[[c for c in cols_hechos if c in df.columns]].copy()
    tabla_hechos.to_csv(output_dir / "fact_quejas.csv", index=False, encoding="utf-8-sig")
    log.info(f"  fact_quejas.csv — {len(tabla_hechos)} filas")

    # ── Dimensión clientes ─────────────────────────────────────────────────
    canal_entes = df.get("Canal de comunicacion", pd.Series()).fillna("")
    dim_clientes = (
        df.groupby("Nombre del cliente")
        .agg(
            total_quejas=("Nombre del cliente", "count"),
            score_riesgo_max=("score_riesgo_pct", "max"),
            n_escalados=("es_escalado", "sum"),
            prob_riesgo_max=("prob_riesgo", "max"),
        )
        .reset_index()
        .rename(columns={"Nombre del cliente": "cliente"})
    )
    dim_clientes["segmento"] = dim_clientes.apply(
        lambda r: "Crítico" if r["n_escalados"] > 0 else
                  "Recurrente" if r["total_quejas"] >= 3 else
                  "Normal",
        axis=1,
    )
    dim_clientes.to_csv(output_dir / "dim_clientes.csv", index=False, encoding="utf-8-sig")
    log.info(f"  dim_clientes.csv — {len(dim_clientes)} clientes únicos")

    # ── Resumen mensual ────────────────────────────────────────────────────
    resumen_mensual = (
        df.groupby(["mes", "mes_nombre"])
        .agg(
            total_quejas=("Nombre del cliente", "count"),
            quejas_alto_riesgo=("clasificacion", lambda x: (x == "Alto Riesgo").sum()),
            quejas_escaladas=("es_escalado", "sum"),
            score_promedio=("score_riesgo_pct", "mean"),
            clientes_unicos=("Nombre del cliente", "nunique"),
        )
        .reset_index()
        .sort_values("mes")
    )
    resumen_mensual["score_promedio"] = resumen_mensual["score_promedio"].round(1)
    resumen_mensual.to_csv(output_dir / "dim_tiempo_mensual.csv", index=False, encoding="utf-8-sig")
    log.info(f"  dim_tiempo_mensual.csv — {len(resumen_mensual)} meses")

    # ── Resumen por canal ──────────────────────────────────────────────────
    resumen_canal = (
        df.groupby("Canal de comunicacion")
        .agg(
            total_quejas=("Nombre del cliente", "count"),
            quejas_alto_riesgo=("clasificacion", lambda x: (x == "Alto Riesgo").sum()),
            score_promedio=("score_riesgo_pct", "mean"),
            pct_del_total=("Nombre del cliente", "count"),
        )
        .reset_index()
    )
    resumen_canal["pct_del_total"] = (resumen_canal["pct_del_total"] / len(df) * 100).round(1)
    resumen_canal["score_promedio"] = resumen_canal["score_promedio"].round(1)
    resumen_canal.to_csv(output_dir / "dim_canal.csv", index=False, encoding="utf-8-sig")
    log.info(f"  dim_canal.csv — {len(resumen_canal)} canales")

    # ── Tabla de temas (formato largo para gráficos de barras) ────────────
    temas_cols = [c for c in df.columns if c.startswith("tema_")]
    temas_data = []
    for col in temas_cols:
        tema = col.replace("tema_", "").replace("_", " ").title()
        temas_data.append({
            "tema": tema,
            "n_quejas": int(df[col].sum()),
            "pct_total": round(df[col].mean() * 100, 1),
            "pct_alto_riesgo": round(
                df.loc[df[col] == 1, "clasificacion"].eq("Alto Riesgo").mean() * 100, 1
            ) if df[col].sum() > 0 else 0,
        })
    pd.DataFrame(temas_data).sort_values("n_quejas", ascending=False).to_csv(
        output_dir / "dim_temas.csv", index=False, encoding="utf-8-sig"
    )
    log.info(f"  dim_temas.csv — {len(temas_data)} temas")

    # ── Archivo Excel consolidado (opcional, para usuarios finales) ────────
    with pd.ExcelWriter(output_dir / "sura_quejas_dashboard.xlsx", engine="xlsxwriter") as writer:
        tabla_hechos.to_excel(writer, sheet_name="Quejas Detalle", index=False)
        dim_clientes.to_excel(writer, sheet_name="Clientes", index=False)
        resumen_mensual.to_excel(writer, sheet_name="Resumen Mensual", index=False)
        resumen_canal.to_excel(writer, sheet_name="Por Canal", index=False)
        pd.DataFrame(temas_data).to_excel(writer, sheet_name="Temas NLP", index=False)
    log.info(f"  sura_quejas_dashboard.xlsx — archivo consolidado generado")

    # Metadatos de la ejecución
    meta = {
        "fecha_ejecucion": date.today().isoformat(),
        "total_registros": len(df),
        "clientes_unicos": int(df["Nombre del cliente"].nunique()),
        "pct_alto_riesgo": round((df["clasificacion"] == "Alto Riesgo").mean() * 100, 1),
        "archivos_generados": [
            "fact_quejas.csv", "dim_clientes.csv", "dim_tiempo_mensual.csv",
            "dim_canal.csv", "dim_temas.csv", "sura_quejas_dashboard.xlsx",
        ],
    }
    (output_dir / "meta_ejecucion.json").write_text(
        json.dumps(meta, ensure_ascii=False, indent=2)
    )
    log.info(f"  meta_ejecucion.json — metadatos guardados")


def main():
    parser = argparse.ArgumentParser(description="Pipeline Power BI — ARL SURA Quejas")
    parser.add_argument("--input",  type=Path, default=DEFAULT_INPUT)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--model",  type=Path, default=DEFAULT_MODEL)
    args = parser.parse_args()

    log.info("=== Pipeline Power BI — ARL SURA ===")
    df_raw = pd.read_excel(args.input, sheet_name="Incapacidad Temporal")
    df     = construir_dataset_principal(df_raw, args.model)
    exportar_tablas_powerbi(df, args.output)
    log.info(f"=== Completado. Archivos en: {args.output} ===")


if __name__ == "__main__":
    main()
