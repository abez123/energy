# ✅ Despliegue del Calculador con Perfil de Carga

## 🚀 Despliegue Completado

**URL de Producción:** https://energy-calculator-absa.pages.dev

**Última actualización:** Diciembre 18, 2025

---

## 📊 Funcionalidad Implementada

### 1. **Calculadora con Perfil de Carga**
Basada en el archivo Excel `Calculador Ahorro de Energía con VFD.xlsx`, implementa:

- ✅ Ley de Afinidad para bombas y ventiladores (Potencia ∝ Velocidad³)
- ✅ 10 puntos de perfil de carga (100% a 10% de flujo)
- ✅ Validación automática (suma de tiempos debe ser 100%)
- ✅ Cálculo de consumo a tensión plena vs. con VFD
- ✅ Cálculo de ahorros energéticos y económicos
- ✅ Cálculo de ROI en años y meses

### 2. **API Endpoints**

#### `POST /api/calculate-load-profile`
Calcula ahorros energéticos basados en perfil de carga.

**Parámetros de entrada:**
```json
{
  "cantidadMotores": 1,
  "hp": 100,
  "eficiencia": 1.0,
  "voltaje": 460,
  "horasAnio": 5000,
  "costoKwhUsd": 0.12,
  "inversionDriveInstalacion": 16000,
  "loadProfile": [
    {"flow": 1.0, "timePercent": 0},
    {"flow": 0.9, "timePercent": 0},
    {"flow": 0.8, "timePercent": 0.8},
    {"flow": 0.7, "timePercent": 0},
    {"flow": 0.6, "timePercent": 0.2},
    {"flow": 0.5, "timePercent": 0},
    {"flow": 0.4, "timePercent": 0},
    {"flow": 0.3, "timePercent": 0},
    {"flow": 0.2, "timePercent": 0},
    {"flow": 0.1, "timePercent": 0}
  ]
}
```

**Respuesta:**
```json
{
  "kw": 74.6,
  "consumoPlenaKwh": 373000,
  "consumoPlenaUsd": 44760,
  "consumoVfdKwh": 168894.4,
  "consumoVfdUsd": 20267.33,
  "ahorroKwh": 204105.6,
  "ahorroUsd": 24492.67,
  "roiAnios": 0.65,
  "roiMeses": 7.84,
  "totalTiempoPercent": 1,
  "profileValid": true,
  "loadProfileBreakdown": [...]
}
```

#### `GET /api/load-profile-presets`
Devuelve perfiles de carga predefinidos.

**Respuesta:**
```json
{
  "presets": {
    "bombas-caudal-variable": [...],
    "ventiladores-variable": [...],
    "carga-constante": [...]
  },
  "flowLevels": [1.0, 0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3, 0.2, 0.1]
}
```

---

## 🧪 Validación de Cálculos

### Ejemplo: Motor de 100 HP

**Entrada:**
- 1 motor de 100 HP
- Eficiencia: 100%
- 5,000 horas/año
- $0.12/kWh
- Inversión: $16,000
- Perfil: 80% tiempo @ 80% flujo, 20% tiempo @ 60% flujo

**Resultados:**
- **KW del motor:** 74.6 kW
- **Consumo sin VFD:** 373,000 kWh/año ($44,760/año)
- **Consumo con VFD:** 168,894 kWh/año ($20,267/año)
- **Ahorro:** 204,106 kWh/año ($24,493/año)
- **ROI:** 0.65 años (7.8 meses)

✅ **Los cálculos coinciden con el archivo Excel**

---

## 🔧 Fórmulas Implementadas

### 1. Potencia del Motor (KW)
```
KW = HP × 0.746 / Eficiencia
```

### 2. Consumo a Tensión Plena
```
Consumo = Horas × Cantidad × KW
```

### 3. Consumo con VFD (Ley de Afinidad)
```
Consumo VFD = Σ(Flujo³ × Horas × Cantidad × Tiempo% × KW)
```

Para bombas y ventiladores:
- Potencia ∝ Velocidad³
- Velocidad/Velocidad_nominal = Flujo%

### 4. Ahorros
```
Ahorro = Consumo Plena - Consumo VFD
```

### 5. ROI
```
ROI (años) = Inversión / Ahorro Anual (USD)
ROI (meses) = ROI (años) × 12
```

---

## 🎯 Perfiles Predefinidos

### Bombas con Caudal Variable
- 80% del tiempo @ 80% de flujo
- 20% del tiempo @ 60% de flujo
- **Ahorro típico:** 45-55%

### Ventiladores de Velocidad Variable
- Distribución gradual de cargas
- 10% @ 100%, 15% @ 90%, 25% @ 80%, 30% @ 70%, 15% @ 60%, 5% @ 50%
- **Ahorro típico:** 30-40%

### Carga Constante
- 100% del tiempo @ 100% de flujo
- **Ahorro típico:** 0-5% (solo eficiencia del VFD)

---

## 📱 Integración con Frontend

El frontend debe:

1. **Validar que la suma de tiempos = 100%**
2. **Mostrar mensaje de error si no suma 100%**
3. **Permitir editar los 10 puntos del perfil de carga**
4. **Cargar perfiles predefinidos desde la API**
5. **Mostrar desglose detallado por punto de carga**

---

## 🔐 Configuración de Producción

### Variables de Entorno en Cloudflare Pages

```bash
MEILISEARCH_HOST=https://meilisearch-xenia.grupoabsa.ai/
MEILISEARCH_API_KEY=[configurado]
MEILISEARCH_INDEX=products
OPENAI_API_KEY=[configurado]
```

---

## 📦 Archivos Relacionados

- `src/load-profile-calculator.ts` - Lógica de cálculo
- `src/index.tsx` - API endpoints
- `Calculador_Ahorro_VFD.xlsx` - Archivo Excel de referencia
- `LOAD_PROFILE_IMPLEMENTATION.md` - Documentación técnica

---

## ✅ Estado del Proyecto

- ✅ Backend desplegado y funcionando
- ✅ API endpoints validados
- ✅ Cálculos verificados vs Excel
- ✅ Perfiles predefinidos disponibles
- ⏳ **Pendiente: Frontend UI para el calculador con perfil de carga**

---

## 🔗 URLs de Producción

- **Aplicación:** https://energy-calculator-absa.pages.dev
- **API Load Profile:** https://energy-calculator-absa.pages.dev/api/calculate-load-profile
- **API Presets:** https://energy-calculator-absa.pages.dev/api/load-profile-presets
- **Búsqueda de Productos:** https://energy-calculator-absa.pages.dev/api/products/search
- **GitHub:** https://github.com/abez123/energy

---

## 🚀 Próximos Pasos

1. **Desarrollar UI para el calculador con perfil de carga**
   - Formulario con campos del Excel
   - Tabla editable de 10 puntos de perfil de carga
   - Selector de perfiles predefinidos
   - Validación visual de suma de tiempos
   - Gráfico de perfil de carga

2. **Integrar con recomendaciones de productos**
   - Mostrar PowerFlex recomendado según HP
   - Calcular inversión automáticamente

3. **Mejorar visualización de resultados**
   - Gráfico comparativo (con/sin VFD)
   - Desglose por punto de carga
   - Proyección de ahorros acumulados

---

**Última actualización:** Diciembre 18, 2025
**Versión:** 2.0 - Load Profile Calculator Deployed
