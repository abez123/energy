# 📊 Implementación del Perfil de Carga - Guía Completa

## ✅ Completado

### 1. **Backend - Calculadora con Perfil de Carga**
- ✅ Creado `/src/load-profile-calculator.ts` con toda la lógica
- ✅ Implementada la Ley de Afinidad: Potencia = Potencia_nominal × (Flujo%)³
- ✅ Endpoint `/api/calculate-load-profile` para cálculos
- ✅ Endpoint `/api/load-profile-presets` para perfiles predefinidos

### 2. **Fórmulas Implementadas** (según Excel)
```typescript
// KW del motor
KW = HP × 0.746 / Eficiencia

// Consumo a tensión plena (sin VFD)
Consumo_Plena = Horas × Cantidad_Motores × KW

// Consumo con VFD (Ley de Afinidad)
Consumo_VFD = Σ(Flujo³ × Horas × Cantidad × Tiempo% × KW)

// Ahorros
Ahorro_KWh = Consumo_Plena - Consumo_VFD
Ahorro_USD = Costo_KWh × Ahorro_KWh

// ROI
ROI_Años = Inversión / Ahorro_USD
ROI_Meses = ROI_Años × 12
```

### 3. **Validación del Perfil de Carga**
- ✅ Suma automática de porcentajes de tiempo
- ✅ Validación que sume 100% (con tolerancia de 0.1%)
- ✅ No calcula si no suma 100%

### 4. **Perfiles Predefinidos**
```javascript
- bombas-caudal-variable: 80% @ 80%, 20% @ 60%
- ventiladores-variable: Distribución gradual
- carga-constante: 100% @ 100%
```

## 🔧 Campos Nuevos del Formulario

### Inputs Principales:
1. **Cantidad de Motores** (cantidadMotores)
2. **HP** (hp)
3. **Eficiencia %** (eficiencia: 0-100)
4. **Voltaje** (voltaje)
5. **Horas x Año** (horasAnio)
6. **Costo KW/Hr (USD)** (costoKwhUsd)
7. **Inversión: Drive + Instalación (USD)** (inversionDriveInstalacion)

### Perfil de Carga (10 puntos):
| Flujo % | Tiempo % |
|---------|----------|
| 100%    | 0%       |
| 90%     | 0%       |
| 80%     | 80%      |
| 70%     | 0%       |
| 60%     | 20%      |
| 50%     | 0%       |
| 40%     | 0%       |
| 30%     | 0%       |
| 20%     | 0%       |
| 10%     | 0%       |
| **Total** | **100%** |

## 📊 Resultados que Calcula

### Outputs:
```typescript
{
  // Datos del motor
  kw: number,
  
  // Sin VFD
  consumoPlenaKwh: number,
  consumoPlenaUsd: number,
  
  // Con VFD
  consumoVfdKwh: number,
  consumoVfdUsd: number,
  
  // Ahorros
  ahorroKwh: number,
  ahorroUsd: number,
  
  // ROI
  roiAnios: number,
  roiMeses: number,
  
  // Validación
  totalTiempoPercent: number,
  profileValid: boolean,
  
  // Desglose detallado
  loadProfileBreakdown: [{
    flow: number,
    timePercent: number,
    consumoKwh: number
  }]
}
```

## 🎯 Ejemplo de Cálculo

### Input Example:
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
    { "flow": 1.0, "timePercent": 0.00 },
    { "flow": 0.9, "timePercent": 0.00 },
    { "flow": 0.8, "timePercent": 0.80 },
    { "flow": 0.7, "timePercent": 0.00 },
    { "flow": 0.6, "timePercent": 0.20 },
    { "flow": 0.5, "timePercent": 0.00 },
    { "flow": 0.4, "timePercent": 0.00 },
    { "flow": 0.3, "timePercent": 0.00 },
    { "flow": 0.2, "timePercent": 0.00 },
    { "flow": 0.1, "timePercent": 0.00 }
  ]
}
```

### Expected Output:
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
  "roiMeses": 7.8,
  "totalTiempoPercent": 1.0,
  "profileValid": true
}
```

## 🚀 Próximos Pasos

### TODO: Frontend UI
1. Crear formulario con los nuevos campos
2. Tabla de perfil de carga con 10 filas editables
3. Validador visual del total de tiempo (debe sumar 100%)
4. Selector de perfiles predefinidos
5. Mostrar resultados:
   - Consumo sin VFD
   - Consumo con VFD
   - Ahorro en kWh y USD
   - ROI en años y meses
6. Gráfico del perfil de carga
7. Integrar con búsqueda de productos Rockwell

### TODO: Testing
1. Probar con los valores del Excel
2. Verificar que los cálculos coincidan exactamente
3. Probar validación de 100% en perfil de carga

## 📝 Notas Importantes

1. **Ley de Afinidad**: Se usa Flujo³ porque es para bombas y ventiladores
2. **Eficiencia**: En el Excel está como 100% (1.0), ajustar según motor real
3. **Validación**: No permitir calcular si el perfil no suma 100%
4. **Perfiles**: Ofrecer templates comunes para facilitar la entrada de datos

## 🧪 Endpoint de Prueba

```bash
curl -X POST http://localhost:3000/api/calculate-load-profile \
  -H "Content-Type: application/json" \
  -d '{
    "cantidadMotores": 1,
    "hp": 100,
    "eficiencia": 1.0,
    "voltaje": 460,
    "horasAnio": 5000,
    "costoKwhUsd": 0.12,
    "inversionDriveInstalacion": 16000,
    "loadProfile": [
      {"flow": 1.0, "timePercent": 0.00},
      {"flow": 0.9, "timePercent": 0.00},
      {"flow": 0.8, "timePercent": 0.80},
      {"flow": 0.7, "timePercent": 0.00},
      {"flow": 0.6, "timePercent": 0.20},
      {"flow": 0.5, "timePercent": 0.00},
      {"flow": 0.4, "timePercent": 0.00},
      {"flow": 0.3, "timePercent": 0.00},
      {"flow": 0.2, "timePercent": 0.00},
      {"flow": 0.1, "timePercent": 0.00}
    ]
  }'
```
