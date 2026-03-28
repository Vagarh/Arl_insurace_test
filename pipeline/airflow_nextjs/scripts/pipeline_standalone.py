"""
Pipeline standalone — Escenario A (sin Airflow)
Uso: python pipeline_standalone.py --input <ruta_excel> [--dashboard <ruta_dashboard>]

Ejecuta el flujo completo: extraer → transformar → clasificar → exportar JSON.
Compatible con cron / Task Scheduler sin necesidad de Airflow instalado.
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

# ── Constantes ─────────────────────────────────────────────────────────────
BASE_DIR      = Path(__file__).resolve().parents[3]
DEFAULT_INPUT = BASE_DIR / "req/BD_Quejas_Analitica.xlsx"
DEFAULT_DASH  = BASE_DIR / "dashboard/public/data"
DEFAULT_MODEL = BASE_DIR / "src/modelo_scoring.joblib"

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


# ── Pasos del pipeline ─────────────────────────────────────────────────────

def extraer(data_path: Path) -> pd.DataFrame:
    log.info(f"Cargando datos desde {data_path}")
    df = pd.read_excel(data_path, sheet_name="Incapacidad Temporal")
    df.columns = df.columns.str.strip()
    if "Descripción" in df.columns:
        df = df.rename(columns={"Descripción": "Descripcion"})
    log.info(f"  {len(df)} registros cargados, {df['Descripcion'].isna().sum()} nulos")
    return df


def transformar(df: pd.DataFrame) -> pd.DataFrame:
    def limpiar_texto(texto):
        if not isinstance(texto, str):
            return ""
        texto = unicodedata.normalize("NFKD", texto)
        texto = "".join(c for c in texto if not unicodedata.combining(c))
        texto = texto.lower()
        texto = re.sub(r"[^a-z0-9\s]", " ", texto)
        tokens = [t for t in texto.split() if len(t) > 2 and t not in STOPWORDS]
        return " ".join(tokens)

    df["texto_limpio"] = df["Descripcion"].fillna("").apply(limpiar_texto)

    for feat, patron in TERMINOS.items():
        df[f"f_{feat}"] = df["texto_limpio"].str.contains(patron, regex=True).astype(int)

    df["longitud_texto"] = df["Descripcion"].fillna("").str.len()
    q25 = df["longitud_texto"].quantile(0.25)
    q75 = df["longitud_texto"].quantile(0.75)
    df["texto_corto"] = (df["longitud_texto"] < q25).astype(int)
    df["texto_largo"] = (df["longitud_texto"] > q75).astype(int)

    for canal in ["SEGUROSSURA.COM.CO", "LINEA DE ATENCIÓN", "ENTES DE CONTROL", "PLATAFORMA DE ATENCIÓN"]:
        col = "canal_" + re.sub(r"[^a-z_]", "_", canal.lower())
        df[col] = (df.get("Canal de comunicacion", pd.Series()).fillna("") == canal).astype(int)

    recurrencia = df.groupby("Nombre del cliente")["Nombre del cliente"].transform("count")
    df["n_quejas_cliente"]  = recurrencia
    df["cliente_recurrente"] = (recurrencia >= 2).astype(int)
    df["cliente_critico"]    = (recurrencia >= 3).astype(int)
    df["mes"] = pd.to_numeric(df["Mes apertura"].astype(str).str[-2:], errors="coerce").fillna(0).astype(int)

    log.info(f"  Features generadas: {len([c for c in df.columns if c.startswith('f_')])} NLP features")
    return df


def clasificar(df: pd.DataFrame, model_path: Path) -> pd.DataFrame:
    if not model_path.exists():
        log.warning(f"Modelo no encontrado en {model_path}. Usando scoring heurístico.")
        # Scoring de respaldo basado en reglas cuando el modelo no está disponible
        df["prob_riesgo"] = (
            df["f_tutela"] * 0.35 +
            df["f_derecho_peticion"] * 0.25 +
            df["f_respuesta"] * 0.15 +
            df["cliente_critico"] * 0.15 +
            df["f_tiempo"] * 0.10
        ).clip(0, 1)
    else:
        import joblib
        model = joblib.load(model_path)
        FEATURES = [c for c in df.columns if c.startswith("f_") or c in [
            "longitud_texto","texto_corto","texto_largo","n_quejas_cliente",
            "cliente_recurrente","cliente_critico","mes",
        ]]
        X = df[FEATURES].fillna(0)
        df["prob_riesgo"] = model.predict_proba(X)[:, 1]

    df["clasificacion"]   = (df["prob_riesgo"] >= 0.5).map({True: "Alto Riesgo", False: "Normal"})
    df["score_categoria"] = pd.cut(
        df["prob_riesgo"],
        bins=[0, 0.3, 0.5, 0.7, 1.0],
        labels=["Bajo", "Medio", "Alto", "Crítico"],
    ).astype(str)

    n_alto = (df["clasificacion"] == "Alto Riesgo").sum()
    log.info(f"  {n_alto}/{len(df)} quejas clasificadas como Alto Riesgo ({n_alto/len(df):.1%})")
    return df


def exportar_json(df: pd.DataFrame, dashboard_dir: Path) -> None:
    dashboard_dir.mkdir(parents=True, exist_ok=True)

    # clasificacion_resumen.json
    cats = df["score_categoria"].value_counts().to_dict()
    resumen = {
        "fecha_actualizacion": date.today().isoformat(),
        "total_quejas": len(df),
        "distribucion": {str(k): int(v) for k, v in cats.items()},
        "pct_alto_riesgo": round((df["clasificacion"] == "Alto Riesgo").mean() * 100, 1),
        "top_temas": {
            feat.replace("f_", ""): int(df[feat].sum())
            for feat in sorted(df.columns[df.columns.str.startswith("f_")],
                               key=lambda c: -df[c].sum())[:5]
        },
    }
    (dashboard_dir / "clasificacion_resumen.json").write_text(
        json.dumps(resumen, ensure_ascii=False, indent=2)
    )

    # scoring_clientes.json
    canal_entes = [c for c in df.columns if "entes" in c]
    scoring = (
        df.groupby("Nombre del cliente")
        .agg(
            n_quejas=("Nombre del cliente", "count"),
            prob_riesgo_max=("prob_riesgo", "max"),
            n_escalados=(canal_entes[0] if canal_entes else "prob_riesgo", "sum"),
        )
        .reset_index()
        .rename(columns={"Nombre del cliente": "cliente_norm"})
    )
    scoring["score_riesgo"] = (scoring["prob_riesgo_max"] * 100).round(1)
    scoring["segmento"]     = scoring["n_escalados"].apply(lambda x: "Crítico" if x > 0 else "Normal")
    scoring["lenguaje_legal"] = 0
    (dashboard_dir / "scoring_clientes.json").write_text(
        scoring.to_json(orient="records", force_ascii=False)
    )

    # alertas.json
    vol_mensual = df.groupby("mes").size().to_dict()
    mediana_vol = df["mes"].value_counts().median()
    alertas = {
        "fecha_actualizacion": date.today().isoformat(),
        "forecast_proximo_mes": int(mediana_vol * 1.05),
        "umbral_alerta": 369,
        "canales": {
            c: int(df[col].sum())
            for c, col in [
                ("SEGUROSSURA.COM.CO",     "canal_segurossura_com_co"),
                ("LINEA DE ATENCION",      "canal_linea_de_atenci_n"),
                ("ENTES DE CONTROL",       "canal_entes_de_control"),
                ("PLATAFORMA DE ATENCION", "canal_plataforma_de_atenci_n"),
            ] if col in df.columns
        },
        "vol_mensual": {str(k): int(v) for k, v in sorted(vol_mensual.items())},
    }
    (dashboard_dir / "alertas.json").write_text(
        json.dumps(alertas, ensure_ascii=False, indent=2)
    )

    log.info(f"  JSON exportados en {dashboard_dir}")


# ── Punto de entrada ───────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Pipeline de quejas ARL SURA")
    parser.add_argument("--input",     type=Path, default=DEFAULT_INPUT)
    parser.add_argument("--dashboard", type=Path, default=DEFAULT_DASH)
    parser.add_argument("--model",     type=Path, default=DEFAULT_MODEL)
    args = parser.parse_args()

    log.info("=== Pipeline ARL SURA — Inicio ===")
    df = extraer(args.input)
    df = transformar(df)
    df = clasificar(df, args.model)
    exportar_json(df, args.dashboard)
    log.info("=== Pipeline completado exitosamente ===")


if __name__ == "__main__":
    main()
