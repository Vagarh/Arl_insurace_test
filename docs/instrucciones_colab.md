# Instrucciones para ejecutar notebooks en Google Colab

## 🚀 Configuración inicial

### 1. Activar GPU en Colab
1. Abre el notebook en Google Colab
2. Ve a `Runtime` > `Change runtime type`
3. Selecciona `GPU` en "Hardware accelerator"
4. Haz clic en `Save`

### 2. Opciones para cargar datos

#### Opción A: Usar Google Drive (Recomendado)

**Pasos:**
1. Sube la carpeta `sura` completa a tu Google Drive en `MyDrive/`
2. La estructura debe quedar así:
   ```
   MyDrive/
   └── sura/
       ├── req/
       │   └── BD_Quejas_Analitica.xlsx
       ├── notebooks/
       │   ├── 01_eda_calidad_datos.ipynb
       │   └── 02_nlp_extraccion_temas.ipynb
       └── data/  (se creará automáticamente)
   ```
3. En el notebook, ejecuta las primeras celdas:
   - **Celda 1:** Detecta si estás en Colab ✓
   - **Celda 2:** Monta Google Drive (te pedirá autorización)
   - El notebook verificará automáticamente si encuentra el archivo

**Ventajas:**
- No necesitas subir el archivo cada vez
- Los datos y resultados se guardan automáticamente en tu Drive
- Puedes trabajar en múltiples sesiones sin perder datos

#### Opción B: Subir archivo manualmente

**Pasos:**
1. En el notebook, ve a la **Celda 3**
2. Cambia `if EN_COLAB and False:` por `if EN_COLAB and True:`
3. Ejecuta la celda
4. Se abrirá un diálogo para subir el archivo
5. Selecciona `BD_Quejas_Analitica.xlsx`

**Desventajas:**
- Debes subir el archivo cada vez que abras una nueva sesión
- Los archivos en `/content/` se borran al cerrar Colab

---

## 📋 Orden de ejecución de notebooks

### Notebook 01: EDA y Calidad de Datos
- **Propósito:** Análisis exploratorio inicial
- **Tiempo estimado:** 2-3 minutos
- **Genera:** Visualizaciones y entendimiento del dataset

### Notebook 02: NLP y Extracción de Temas
- **Propósito:** Procesamiento de texto y topic modeling
- **Tiempo estimado:** 5-10 minutos (dependiendo de GPU)
- **Genera:** `data/quejas_con_features_nlp.csv`
- **Requiere:** Modelo spaCy (se instala automáticamente la primera vez)

### Notebook 03: ML Explicable con SHAP (próximo)
- **Propósito:** Modelo predictivo con interpretabilidad
- **Requiere:** Output del Notebook 02

---

## ⚡ Optimizaciones para Colab

### Procesamiento de texto con spaCy
El notebook 02 usa spaCy para procesamiento de lenguaje natural:

```python
# Se instala automáticamente en la primera ejecución
!python -m spacy download es_core_news_sm
```

**Tiempo de procesamiento:**
- CPU: ~2-3 minutos para 1,839 textos
- GPU: ~1-2 minutos (beneficio menor en NLP, pero útil para modelos grandes)

### Guardar resultados intermedios
Los archivos generados se guardan en:
- **Con Google Drive:** `MyDrive/sura/data/` (persistente)
- **Sin Drive:** `/content/sura/data/` (temporal)

---

## 🐛 Solución de problemas comunes

### Error: "FileNotFoundError"
**Causa:** El archivo no se encuentra en la ruta esperada

**Solución:**
```python
# Verifica la ruta actual
import os
print(os.getcwd())
print(os.listdir('.'))

# Si estás en Colab con Drive montado:
print(os.path.exists('/content/drive/MyDrive/sura/req/BD_Quejas_Analitica.xlsx'))
```

### Error: "Model 'es_core_news_sm' not found"
**Causa:** Modelo de spaCy no instalado

**Solución:**
El notebook lo instala automáticamente, pero si falla:
```python
!python -m spacy download es_core_news_sm
```

### Sesión de Colab desconectada
**Causa:** Inactividad o tiempo límite excedido

**Solución:**
- Colab te desconecta después de ~90 minutos de inactividad
- Con Colab Pro: hasta 24 horas
- Los archivos en Drive se mantienen, los de `/content/` se pierden

### Memoria RAM insuficiente
**Síntoma:** Kernel crashed o "Out of memory"

**Solución:**
```python
# Liberar memoria después de procesar
import gc
gc.collect()

# Reducir tamaño del vocabulario
vec_count = CountVectorizer(
    max_features=300,  # Reducir de 500 a 300
    min_df=10         # Aumentar de 5 a 10
)
```

---

## 📊 Monitoreo de recursos en Colab

```python
# Ver uso de RAM
!cat /proc/meminfo | grep MemTotal
!cat /proc/meminfo | grep MemAvailable

# Ver tipo de GPU asignada
!nvidia-smi

# Ver uso de disco
!df -h
```

---

## 💡 Consejos adicionales

1. **Ejecuta celda por celda** la primera vez para entender cada paso
2. **Guarda copias** de los notebooks en tu Drive (`File` > `Save a copy in Drive`)
3. **Descarga resultados importantes** antes de cerrar la sesión
4. **Usa comentarios** para documentar cambios que hagas
5. **Runtime > Run all** ejecuta todo el notebook de una vez (útil después de la primera ejecución)

---

## 🔗 Recursos útiles

- [Google Colab - Guía oficial](https://colab.research.google.com/notebooks/intro.ipynb)
- [spaCy - Documentación en español](https://spacy.io/models/es)
- [Scikit-learn - Topic Modeling](https://scikit-learn.org/stable/modules/decomposition.html#latent-dirichlet-allocation-lda)
