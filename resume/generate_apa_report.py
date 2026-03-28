import os
from reportlab.lib.pagesizes import LETTER
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY
from reportlab.lib import colors
from datetime import datetime

def generate_report():
    output_filename = "/Users/juanfelipearango/Library/CloudStorage/OneDrive-Personal/Documents/sura/resume/informe_estilo_apa.pdf"
    doc = SimpleDocTemplate(output_filename, pagesize=LETTER)
    styles = getSampleStyleSheet()

    # Custom APA-like styles
    apa_title = ParagraphStyle(
        'ApaTitle',
        parent=styles['Title'],
        fontName='Helvetica-Bold',
        fontSize=18,
        spaceAfter=30,
        alignment=TA_CENTER
    )
    
    apa_heading1 = ParagraphStyle(
        'ApaHeading1',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=14,
        spaceBefore=12,
        spaceAfter=6
    )

    apa_body = ParagraphStyle(
        'ApaBody',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=12,
        leading=16,
        alignment=TA_JUSTIFY,
        firstLineIndent=20
    )

    apa_centered = ParagraphStyle(
        'ApaCentered',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=12,
        alignment=TA_CENTER
    )

    content = []

    # --- COVER PAGE ---
    content.append(Spacer(1, 100))
    content.append(Paragraph("Informe de Análisis de Quejas e Insatisfacción", apa_title))
    content.append(Spacer(1, 20))
    content.append(Paragraph("ARL SURA - Technical Analysis", apa_centered))
    content.append(Spacer(1, 150))
    content.append(Paragraph("<b>Autor:</b> Equipo de Analítica", apa_centered))
    content.append(Paragraph("<b>Institución:</b> Gerencia de Operaciones ARL", apa_centered))
    content.append(Paragraph(f"<b>Fecha:</b> {datetime.now().strftime('%d de %B, %Y')}", apa_centered))
    content.append(PageBreak())

    # --- ABSTRACT ---
    content.append(Paragraph("Resumen", apa_heading1))
    content.append(Paragraph(
        "El presente informe detalla los hallazgos del análisis realizado sobre 1,841 quejas de clientes "
        "de ARL SURA durante el primer semestre de 2025. El estudio utiliza técnicas de procesamiento "
        "de lenguaje natural (NLP) para identificar tópicos recurrentes y modelos de aprendizaje "
        "automático para predecir la gravedad de la insatisfacción. Los resultados sugieren que el "
        "seguimiento del estado de los trámites y la recurrencia de los clientes son los principales "
        "vectores de descontento.",
        apa_body
    ))
    content.append(Spacer(1, 12))

    # --- BODY ---
    content.append(Paragraph("Análisis de Datos y Hallazgos", apa_heading1))
    content.append(Paragraph(
        "Se analizaron los canales de comunicación más frecuentes, evidenciando que el portal web "
        "(SEGUROSSURA.COM.CO) concentra el 55% del volumen operativo, seguido por la línea de atención. "
        "A pesar de que el volumen absoluto es manejable, la segmentación revela que un grupo reducido "
        "de clientes (277 individuos) genera quejas recurrentes, lo que incrementa el riesgo de "
        "escalamiento legal.",
        apa_body
    ))

    content.append(Paragraph("Causas Raíz Detectadas", apa_heading1))
    content.append(Paragraph(
        "Mediante la aplicación de valores SHAP sobre un modelo de Gradient Boosting, se identificaron "
        "los siguientes factores críticos como disparadores de insatisfacción grave:",
        apa_body
    ))
    
    # Simple Table for findings
    data = [
        ['Variable', 'Impacto', 'Descripción'],
        ['Recurrencia', 'Muy Alto', 'Pacientes con >2 quejas sin cierre efectivo.'],
        ['Canal Ente de Control', 'Alto', 'Carga administrativa y reputacional elevada.'],
        ['Menciones a Tutela', 'Alto', 'Palabras clave asociadas a procesos legales.'],
    ]
    t = Table(data, hAlign='LEFT')
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('GRID', (0, 0), (-1, -1), 1, colors.black),
    ]))
    content.append(Spacer(1, 10))
    content.append(t)
    content.append(Spacer(1, 20))

    # --- CONCLUSION ---
    content.append(Paragraph("Conclusiones y Recomendaciones", apa_heading1))
    content.append(Paragraph(
        "Se concluye que el proceso de pagos actual presenta puntos de fricción en la fase de "
        "comunicación del estado del trámite. Se recomienda la automatización de notificaciones "
        "proactivas y la creación de una célula de atención prioritaria para mitigar la recurrencia "
        "y el riesgo de demandas judiciales.",
        apa_body
    ))

    # Build the PDF
    doc.build(content)
    print(f"Informe PDF generado con éxito en: {output_filename}")

if __name__ == "__main__":
    generate_report()
