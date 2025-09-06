# Calculadora de Ahorro Energético - GrupoABSA

## 🚀 Descripción del Proyecto
**Nombre**: Energy Savings Calculator  
**Objetivo**: Proporcionar una herramienta interactiva para calcular el retorno de inversión (ROI) y los ahorros potenciales al implementar soluciones de eficiencia energética con drives, reactores y guardamotores.

## 🌐 URLs de Acceso
- **Producción (Cloudflare Pages)**: https://energy-calculator-absa.pages.dev
- **Producción (Cloudflare Worker)**: https://energy-calculator.hola-245.workers.dev
- **Desarrollo (Sandbox)**: https://3000-iatagrmdafp5tkpz5ryxg-6532622b.e2b.dev
- **GitHub**: https://github.com/[tu-usuario]/energy

## ✅ Funcionalidades Completadas

### 1. **Calculadora de Ahorro Energético**
- ✅ Cálculo automático de consumo actual y ahorros potenciales
- ✅ Conversión HP a kW integrada
- ✅ Cálculo de ROI y periodo de retorno (payback)
- ✅ Visualización de ahorros acumulados

### 2. **Sistema de Presets**
- ✅ Preset Bombas/Ventiladores
- ✅ Preset Transportadores
- ✅ Preset Carga Fija
- ✅ Carga automática de valores predefinidos

### 3. **Análisis de Métricas**
- ✅ Ahorro energético por implementación de drives
- ✅ Ahorro por reducción de paros no programados
- ✅ Ahorro en costos de mantenimiento
- ✅ Cálculo de inversión total y ROI anual

### 4. **Chatbot con IA**
- ✅ Integración con OpenAI GPT-4
- ✅ Contexto de cálculos actuales
- ✅ Respuestas especializadas en eficiencia energética
- ✅ Recomendaciones personalizadas

### 5. **Exportación de Reportes**
- ✅ Generación de PDF con resultados
- ✅ Formato profesional con datos completos
- ✅ Descarga directa desde el navegador

### 6. **Base de Datos**
- ✅ Configuración para Cloudflare D1
- ✅ Esquema de tablas para históricos
- ✅ Migraciones preparadas

## 📊 Rutas API Disponibles

| Método | Ruta | Descripción | Parámetros |
|--------|------|-------------|------------|
| GET | `/` | Interfaz principal | - |
| GET | `/app.js` | JavaScript de la aplicación | - |
| POST | `/api/calculate` | Calcular ahorros | JSON con inputs |
| GET | `/api/presets` | Obtener presets | - |
| POST | `/api/chat` | Chat con IA | message, context |
| GET | `/api/history` | Histórico de cálculos | - |

## 🛠 Arquitectura Técnica

### Stack Tecnológico
- **Backend**: Hono Framework + TypeScript
- **Frontend**: React 18 (sin build, usando CDN)
- **Estilos**: TailwindCSS (CDN)
- **Base de Datos**: Cloudflare D1 (SQLite)
- **IA**: OpenAI GPT-4 API
- **Despliegue**: Cloudflare Pages/Workers
- **PDF**: jsPDF

### Estructura del Proyecto
```
webapp/
├── src/
│   ├── index.tsx      # Backend principal con Hono
│   ├── app.ts         # Lógica React del frontend
│   └── client.ts      # HTML base de la aplicación
├── public/
│   ├── index.html     # HTML completo (desarrollo)
│   └── app.js         # JavaScript React (desarrollo)
├── migrations/
│   └── 0001_initial_schema.sql  # Esquema de DB
├── ecosystem.config.cjs  # Configuración PM2
├── wrangler.jsonc     # Configuración Cloudflare
└── package.json       # Dependencias y scripts
```

## 🔧 Configuración Requerida

### Variables de Entorno
Para habilitar el chatbot con IA, configura:
```bash
# Desarrollo local (.dev.vars)
OPENAI_API_KEY=tu-api-key-aqui

# Producción (Cloudflare Worker)
npx wrangler secret put OPENAI_API_KEY

# O directamente con el nombre del worker
npx wrangler secret put OPENAI_API_KEY --name energy-calculator
```

### Base de Datos D1
```bash
# Crear base de datos
npx wrangler d1 create energy-calculator-production

# Aplicar migraciones
npm run db:migrate:local  # Local
npm run db:migrate:prod   # Producción
```

## 📈 Próximos Pasos Recomendados

### Alta Prioridad
1. **Configurar API Key de OpenAI** para habilitar chatbot completo
2. **Desplegar a Cloudflare Pages** para acceso público
3. **Configurar GitHub** para control de versiones

### Mejoras Futuras
1. **Gráficos interactivos** con Chart.js o Recharts
2. **Autenticación de usuarios** para guardar cálculos
3. **Comparación de múltiples escenarios**
4. **API REST documentada** con Swagger
5. **Modo oscuro** para la interfaz
6. **Exportación a Excel** además de PDF
7. **Multiidioma** (inglés, portugués)
8. **Dashboard administrativo** para estadísticas

## 💻 Comandos Útiles

```bash
# Desarrollo
npm run dev:sandbox    # Iniciar servidor local
npm run build          # Compilar proyecto
pm2 logs --nostream    # Ver logs

# Base de Datos
npm run db:migrate:local    # Migraciones locales
npm run db:seed            # Cargar datos de prueba

# Despliegue a Cloudflare Worker
npx wrangler deploy --config wrangler-worker.toml

# Configurar secretos en producción
npx wrangler secret put OPENAI_API_KEY

# Ver logs en tiempo real
npx wrangler tail energy-calculator

# Git
git add . && git commit -m "mensaje"
git push origin main
```

## 📝 Notas de Implementación

### Cálculos Implementados
- **Consumo anual** = Motores × kW × Factor carga × Horas/año
- **Ahorro energético** = Costo energía actual × % ahorro drive
- **Ahorro paros** = Horas evitadas × Costo por hora
- **Ahorro mantenimiento** = Gasto actual × % reducción
- **Payback** = Inversión total / Ahorro anual
- **ROI** = (Ahorro anual / Inversión) × 100

### Limitaciones Actuales
- Chatbot requiere API key de OpenAI configurada
- Base de datos D1 requiere configuración en Cloudflare
- Máximo 10MB de bundle para Cloudflare Workers
- Límite de 10ms CPU por request (plan gratuito)

## 🤝 Soporte
Para soporte o consultas sobre la implementación, contactar al equipo de desarrollo.

---
© 2025 GrupoABSA - Transformando la eficiencia energética industrial