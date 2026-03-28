"""
Genera PDFs profesionales desde los Markdown del proyecto ARL SURA.
Produce:
  - informe_ejecutivo.pdf
  - informe_con_graficas.pdf

Uso: /opt/anaconda3/bin/python3 generate_apa_report.py
"""

import re
import subprocess
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.platypus import (
    HRFlowable, Image, PageBreak, Paragraph, SimpleDocTemplate,
    Spacer, Table, TableStyle,
)

BASE       = Path(__file__).parent
IMAGES_DIR = BASE / "images"

AZUL       = colors.HexColor("#003087")
AZUL_LIGHT = colors.HexColor("#1a4d8f")
GRIS       = colors.HexColor("#555555")
AMARILLO   = colors.HexColor("#fff8e1")
AMARILLO_B = colors.HexColor("#f5a623")
FONDO_FILA = colors.HexColor("#f0f4ff")
URL        = "https://dashboard-xi-nine-20.vercel.app"
REPO       = "github.com/Vagarh/Arl_insurace_test"


# ── Estilos ────────────────────────────────────────────────────────────────
def estilos():
    base = getSampleStyleSheet()
    def s(name, parent="Normal", **kw):
        return ParagraphStyle(name, parent=base[parent], **kw)

    return {
        "portada_titulo": s("portada_titulo", "Title",
            fontName="Helvetica-Bold", fontSize=22, textColor=AZUL,
            alignment=TA_CENTER, spaceAfter=8),
        "portada_sub": s("portada_sub",
            fontName="Helvetica", fontSize=13, textColor=GRIS,
            alignment=TA_CENTER, spaceAfter=4),
        "portada_meta": s("portada_meta",
            fontName="Helvetica", fontSize=9, textColor=colors.HexColor("#aaaaaa"),
            alignment=TA_CENTER, spaceAfter=16),
        "portada_url": s("portada_url",
            fontName="Helvetica-Bold", fontSize=10, textColor=AZUL,
            alignment=TA_CENTER),

        "h1": s("h1", "Heading1",
            fontName="Helvetica-Bold", fontSize=15, textColor=AZUL,
            spaceBefore=20, spaceAfter=6),
        "h2": s("h2", "Heading2",
            fontName="Helvetica-Bold", fontSize=12, textColor=AZUL,
            spaceBefore=14, spaceAfter=5),
        "h3": s("h3", "Heading3",
            fontName="Helvetica-Bold", fontSize=10.5, textColor=AZUL_LIGHT,
            spaceBefore=10, spaceAfter=4),
        "body": s("body",
            fontName="Helvetica", fontSize=10.5, leading=15,
            alignment=TA_JUSTIFY, spaceAfter=7),
        "blockquote": s("blockquote",
            fontName="Helvetica-BoldOblique", fontSize=10.5,
            textColor=colors.HexColor("#7a4f00"),
            leftIndent=12, rightIndent=12, spaceAfter=8, leading=15),
        "bullet": s("bullet",
            fontName="Helvetica", fontSize=10.5, leading=14,
            leftIndent=16, spaceAfter=3),
        "footer": s("footer",
            fontName="Helvetica", fontSize=8, textColor=colors.HexColor("#aaaaaa"),
            alignment=TA_CENTER),
        "caption": s("caption",
            fontName="Helvetica-Oblique", fontSize=9, textColor=GRIS,
            alignment=TA_CENTER, spaceAfter=6),
    }


def portada(story, st, title, subtitle):
    story += [
        Spacer(1, 2*cm),
        HRFlowable(width="100%", thickness=3, color=AZUL, spaceAfter=20),
        Paragraph(title, st["portada_titulo"]),
        Paragraph(subtitle, st["portada_sub"]),
        Paragraph("ARL SURA · Prueba Técnica Datos y Procesos · Marzo 2026", st["portada_meta"]),
        HRFlowable(width="100%", thickness=1, color=AZUL_LIGHT, spaceBefore=8, spaceAfter=14),
        Paragraph(f"Dashboard en producción: {URL}", st["portada_url"]),
        Paragraph(f"Repositorio: {REPO}", st["portada_url"]),
        Spacer(1, 1*cm),
        PageBreak(),
    ]


def tabla_desde_md(lineas):
    """Convierte líneas Markdown de tabla a Table de ReportLab."""
    filas_raw = [l for l in lineas if l.startswith("|") and "---" not in l]
    if not filas_raw:
        return None
    datos = []
    for i, fila in enumerate(filas_raw):
        celdas = [c.strip() for c in fila.strip("|").split("|")]
        estilo = "Helvetica-Bold" if i == 0 else "Helvetica"
        datos.append([
            Paragraph(f"<b>{c}</b>" if i == 0 else c,
                      ParagraphStyle("tc", fontName=estilo, fontSize=9, leading=12))
            for c in celdas
        ])
    n_cols = len(datos[0])
    ancho  = 16.5 * cm / n_cols

    t = Table(datos, colWidths=[ancho] * n_cols, repeatRows=1)
    t.setStyle(TableStyle([
        ("BACKGROUND",   (0, 0), (-1, 0),  AZUL),
        ("TEXTCOLOR",    (0, 0), (-1, 0),  colors.white),
        ("ROWBACKGROUNDS",(0, 1),(-1, -1), [colors.white, FONDO_FILA]),
        ("GRID",         (0, 0), (-1, -1), 0.4, colors.HexColor("#c8d0e8")),
        ("TOPPADDING",   (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING",(0, 0), (-1, -1), 5),
        ("LEFTPADDING",  (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("VALIGN",       (0, 0), (-1, -1), "MIDDLE"),
    ]))
    return t


def limpiar(texto):
    """Limpia Markdown inline → HTML básico para ReportLab."""
    texto = re.sub(r'\*\*(.+?)\*\*', r'<b>\1</b>', texto)
    texto = re.sub(r'\*(.+?)\*',     r'<i>\1</i>', texto)
    texto = re.sub(r'`(.+?)`',       r'<font face="Courier">\1</font>', texto)
    texto = re.sub(r'\[([^\]]+)\]\([^)]+\)', r'\1', texto)  # links → texto
    texto = texto.replace("🔴", "[ROJO]").replace("🟡", "[AMARILLO]").replace("🟢", "[VERDE]")
    texto = texto.replace("✅", "[OK]").replace("⚠️", "[!]").replace("🔗", "")
    return texto


def md_a_story(md_path: Path, st: dict, con_imagenes: bool = False) -> list:
    texto = md_path.read_text(encoding="utf-8")
    lineas = texto.splitlines()
    story  = []
    i = 0

    while i < len(lineas):
        l = lineas[i]

        # H1 (portada ya lo maneja, saltar)
        if l.startswith("# ") and not l.startswith("## "):
            i += 1
            continue

        # H2
        if l.startswith("## "):
            story.append(Spacer(1, 4))
            story.append(HRFlowable(width="100%", thickness=1.5, color=AZUL, spaceAfter=4))
            story.append(Paragraph(limpiar(l[3:]), st["h2"]))
            i += 1; continue

        # H3
        if l.startswith("### "):
            story.append(Paragraph(limpiar(l[4:]), st["h3"]))
            i += 1; continue

        # HR
        if l.strip() in ("---", "***", "___"):
            story.append(HRFlowable(width="100%", thickness=0.5,
                                    color=colors.HexColor("#d0d8f0"),
                                    spaceBefore=8, spaceAfter=8))
            i += 1; continue

        # Imagen
        if l.startswith("![") and con_imagenes:
            m = re.match(r'!\[([^\]]*)\]\(([^)]+)\)', l)
            if m:
                nombre = Path(m.group(2)).name
                img_path = IMAGES_DIR / nombre
                if img_path.exists():
                    try:
                        img = Image(str(img_path), width=15*cm, height=8*cm, kind="proportional")
                        story.append(Spacer(1, 6))
                        story.append(img)
                        alt = m.group(1)
                        if alt:
                            story.append(Paragraph(alt, st["caption"]))
                        story.append(Spacer(1, 6))
                    except Exception:
                        pass
            i += 1; continue

        # Tabla
        if l.startswith("|"):
            bloque_tabla = []
            while i < len(lineas) and lineas[i].startswith("|"):
                bloque_tabla.append(lineas[i])
                i += 1
            t = tabla_desde_md(bloque_tabla)
            if t:
                story.append(Spacer(1, 4))
                story.append(t)
                story.append(Spacer(1, 8))
            continue

        # Blockquote
        if l.startswith("> "):
            quote = limpiar(l[2:])
            story.append(Table(
                [[Paragraph(quote, st["blockquote"])]],
                colWidths=[16*cm],
                style=TableStyle([
                    ("BACKGROUND", (0,0), (-1,-1), AMARILLO),
                    ("LEFTPADDING", (0,0), (-1,-1), 14),
                    ("RIGHTPADDING", (0,0), (-1,-1), 10),
                    ("TOPPADDING", (0,0), (-1,-1), 8),
                    ("BOTTOMPADDING", (0,0), (-1,-1), 8),
                    ("BOX", (0,0), (-1,-1), 3, AMARILLO_B),
                    ("LINEBEFORE", (0,0), (0,-1), 5, AMARILLO_B),
                    ("ROUNDEDCORNERS", [4]),
                ])
            ))
            i += 1; continue

        # Lista
        if re.match(r'^[-*]\s', l):
            bloque = []
            while i < len(lineas) and re.match(r'^[-*]\s', lineas[i]):
                bloque.append(f"• {limpiar(lineas[i][2:])}")
                i += 1
            for item in bloque:
                story.append(Paragraph(item, st["bullet"]))
            story.append(Spacer(1, 4))
            continue

        # Párrafo normal
        if l.strip():
            story.append(Paragraph(limpiar(l.strip()), st["body"]))

        i += 1

    # Footer
    story.append(Spacer(1, 16))
    story.append(HRFlowable(width="100%", thickness=0.5,
                            color=colors.HexColor("#e0e5f5"), spaceAfter=6))
    story.append(Paragraph(f"Repositorio: {REPO} · Dashboard: {URL}", st["footer"]))
    return story


def pagina_numero(canvas, doc):
    canvas.saveState()
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(colors.HexColor("#aaaaaa"))
    canvas.drawRightString(A4[0] - 2*cm, 1.2*cm, f"Página {doc.page}")
    canvas.restoreState()


def generar_pdf(md_path, pdf_path, title, subtitle, con_imagenes=False):
    print(f"  Generando {pdf_path.name}...")
    st = estilos()
    doc = SimpleDocTemplate(
        str(pdf_path), pagesize=A4,
        leftMargin=2.5*cm, rightMargin=2.5*cm,
        topMargin=2.2*cm, bottomMargin=2.5*cm,
    )
    story = []
    portada(story, st, title, subtitle)
    story += md_a_story(md_path, st, con_imagenes=con_imagenes)
    doc.build(story, onFirstPage=pagina_numero, onLaterPages=pagina_numero)
    size_kb = pdf_path.stat().st_size // 1024
    print(f"  ✓ {pdf_path.name} — {size_kb} KB")


def main():
    print("=== Generador de PDFs ARL SURA ===\n")

    generar_pdf(
        md_path       = BASE / "resumen_ejecutivo.md",
        pdf_path      = BASE / "informe_ejecutivo.pdf",
        title         = "Resumen Ejecutivo — Análisis de Quejas",
        subtitle      = "Traducción Técnica a Negocio · Multi-Audiencia",
        con_imagenes  = False,
    )

    generar_pdf(
        md_path       = BASE / "resumen_con_graficas.md",
        pdf_path      = BASE / "informe_con_graficas.pdf",
        title         = "Análisis de Quejas con Gráficas",
        subtitle      = "Resultados Paso a Paso · Enero–Junio 2025",
        con_imagenes  = True,
    )

    print("\nPDFs listos:")
    for pdf in sorted(BASE.glob("*.pdf")):
        print(f"  {pdf.name}")

    for pdf in [BASE/"informe_ejecutivo.pdf", BASE/"informe_con_graficas.pdf"]:
        subprocess.run(["open", str(pdf)], check=False)


if __name__ == "__main__":
    main()
