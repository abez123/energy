# 🔍 Estrategia de Búsqueda Optimizada para Ahorro Energético

## Objetivo
Enfocar las búsquedas y recomendaciones en productos específicos para proyectos de ahorro energético industrial, filtrando el catálogo de +1000 productos para mostrar solo los relevantes.

## 🎯 Productos Clave para Ahorro Energético

### 1. **Variadores de Frecuencia (Drives)**
- **Modelos principales**: PowerFlex 525, 753, 755
- **Palabras clave**: `PowerFlex`, `variador`, `drive`, `VFD`, `AC drive`
- **Beneficio**: Ahorro energético del 20-40% en motores

### 2. **Guardamotores (Protección)**
- **Modelos principales**: Serie 140M
- **Palabras clave**: `guardamotor`, `140M`, `circuit breaker`, `motor protection`
- **Beneficio**: Reduce paros no programados y mantenimiento

### 3. **Reactores de Línea**
- **Modelos principales**: Serie 1321
- **Palabras clave**: `reactor`, `1321`, `line reactor`, `harmonic`, `impedance`
- **Beneficio**: Mejora calidad de energía y prolonga vida del equipo

## 📊 Algoritmo de Recomendaciones

### Cálculo de Especificaciones
```javascript
// Estimar amperaje basado en HP (para 480V)
Amperaje = HP * 1.5

// Ejemplo: Motor 10HP
- Amperaje estimado: 15A
- Buscar guardamotor: 12-20A
- Buscar reactor: ≥15A
```

### Priorización de Resultados
1. **Productos con precio** (sale_price_usd > 0)
2. **Publicados en website** (publicado_website = true)
3. **Con URL de tienda** (url_aol disponible)
4. **Con inventario** (suma de todas las ubicaciones > 0)

## 🔧 Búsquedas Mejoradas

### Búsqueda de Drives
```
Query original: "drive 10HP"
Query mejorado: "PowerFlex 525 753 755 10HP variador Allen Bradley"
```

### Búsqueda de Guardamotores
```
Query original: "guardamotor"
Query mejorado: "guardamotor 140M protection circuit breaker 15A"
```

### Búsqueda de Reactores
```
Query original: "reactor"
Query mejorado: "reactor 1321 line impedance harmonic 15A"
```

## 💡 Inteligencia de Búsqueda

### Extracción de Especificaciones
El sistema extrae automáticamente:
- **HP**: Busca patrones como "10HP", "10 HP", "10hp"
- **Amperaje**: Busca patrones como "15A", "15 AMP", "15 AMPS"
- **Voltaje**: Busca patrones como "480V", "460VAC", "480 VAC"

### Matching Inteligente
- Si buscan un drive de 10HP pero no hay exacto, busca ±5HP
- Para guardamotores, busca rango de 80% a 150% del amperaje calculado
- Para reactores, busca igual o mayor al amperaje requerido

## 📈 Métricas de Relevancia

### Productos Ideales para Mostrar
✅ **Características de productos relevantes:**
- Marca: Allen Bradley / Rockwell Automation
- Categoría: Variadores, Power, Automatización
- Con precio definido en USD
- Disponible en tienda online (url_aol)
- Con especificaciones técnicas claras

❌ **Productos a evitar:**
- Sin precio (price = 0)
- Sin descripción clara
- Categorías no relacionadas con ahorro energético
- Productos descontinuados o sin stock

## 🚀 Ejemplos de Uso

### API de Búsqueda
```bash
# Buscar drives PowerFlex
GET /api/products/search?q=PowerFlex&limit=5

# Buscar guardamotores
GET /api/products/search?q=guardamotor&limit=5

# Buscar reactores
GET /api/products/search?q=reactor+linea&limit=5
```

### API de Recomendaciones
```bash
# Recomendar productos para 2 motores de 10HP
POST /api/products/recommendations
{
  "motors": 2,
  "hpPerMotor": 10
}

# Respuesta incluirá:
- 3 drives PowerFlex cercanos a 10HP
- 2 guardamotores para ~15A
- 2 reactores de línea apropiados
```

## 🎯 Resultado Esperado

El sistema ahora:
1. **Filtra** automáticamente productos no relevantes
2. **Prioriza** productos con información completa y disponibilidad
3. **Recomienda** basándose en especificaciones técnicas reales
4. **Calcula** automáticamente requerimientos (amperaje desde HP)
5. **Enlaza** directamente a la tienda online cuando está disponible

## 📊 Base de Datos

- **Host**: meilisearch-xenia.grupoabsa.ai
- **Índice**: products (contiene todo el catálogo)
- **Filtrado**: Aplicado en la aplicación para mostrar solo productos de ahorro energético
- **Productos totales**: +1000
- **Productos relevantes**: ~200-300 (drives, guardamotores, reactores)