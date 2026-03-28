import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import os

# Configuración
DATA_PATH = "/Users/juanfelipearango/Library/CloudStorage/OneDrive-Personal/Documents/sura/req/BD_Quejas_Analitica.xlsx"
IMG_DIR = "/Users/juanfelipearango/Library/CloudStorage/OneDrive-Personal/Documents/sura/resume/images"
sns.set_style("whitegrid")
plt.rcParams['figure.dpi'] = 100

# Cargar datos
df = pd.read_excel(DATA_PATH, sheet_name='Incapacidad Temporal')
df.columns = ['mes_apertura', 'descripcion', 'tipo', 'cliente', 'canal']
df['fecha'] = pd.to_datetime(df['mes_apertura'].astype(str), format='%Y%m')

# 1. Gráfico de Volumen Mensual
plt.figure(figsize=(10, 5))
vol_mensual = df.groupby(df['fecha'].dt.strftime('%b %Y')).size().reindex(
    pd.to_datetime(df['mes_apertura'].unique().astype(str), format='%Y%m').strftime('%b %Y')
)
vol_mensual.plot(kind='bar', color='skyblue', edgecolor='black')
plt.title('Evolución Mensual de Quejas (2025)', fontsize=14)
plt.ylabel('Cantidad de Quejas')
plt.xticks(rotation=45)
plt.tight_layout()
plt.savefig(os.path.join(IMG_DIR, 'volumen_mensual.png'))
plt.close()

# 2. Gráfico por Canal
plt.figure(figsize=(8, 8))
df['canal'].value_counts().plot(kind='pie', autopct='%1.1f%%', colors=sns.color_palette('pastel'))
plt.title('Distribución por Canal de Entrada', fontsize=14)
plt.ylabel('')
plt.tight_layout()
plt.savefig(os.path.join(IMG_DIR, 'distribucion_canales.png'))
plt.close()

# 3. Gráfico de Recurrencia (Top Clientes)
plt.figure(figsize=(10, 5))
top_clientes = df['cliente'].value_counts().head(10)
top_clientes.plot(kind='barh', color='salmon', edgecolor='black')
plt.title('Top 10 Clientes por Volumen de Quejas (Recurrencia)', fontsize=14)
plt.xlabel('Número de Quejas')
plt.gca().invert_yaxis()
plt.tight_layout()
plt.savefig(os.path.join(IMG_DIR, 'recurrencia_clientes.png'))
plt.close()

print("Gráficos generados exitosamente en:", IMG_DIR)
