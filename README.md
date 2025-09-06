# Calculadora de Ahorro Energético - GrupoABSA

## 🚀 Descripción del Proyecto
**Nombre**: Energy Savings Calculator  
**Objetivo**: Proporcionar una herramienta interactiva para calcular el retorno de inversión (ROI) y los ahorros potenciales al implementar soluciones de eficiencia energética con drives, reactores y guardamotores.

## 🌐 URLs de Acceso
- **Producción (Cloudflare Pages)**: https://energy-calculator-absa.pages.dev
- **Producción (Cloudflare Worker)**: https://energy-calculator.hola-245.workers.dev
- **Desarrollo (Sandbox)**: https://3000-iatagrmdafp5tkpz5ryxg-6532622b.e2b.dev
- **GitHub**: https://github.com/abez123/energy
- **Tienda Online ABSA**: https://www.absaonline.mx
- **Base de Datos de Productos**: https://meilisearch-xenia.grupoabsa.ai

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

### 7. **Integración con Meilisearch - Productos Rockwell Automation** ✅ CONECTADO
- ✅ **Base de datos real conectada**: meilisearch-xenia.grupoabsa.ai
- ✅ Búsqueda en catálogo real de +1000 productos Rockwell/Allen-Bradley
- ✅ Precios reales en USD desde base de datos ABSA
- ✅ Inventario en tiempo real (Guadalajara, León, Chihuahua, Hermosillo, Juárez)
- ✅ Enlaces directos a tienda online ABSA (absaonline.mx)
- ✅ Recomendaciones automáticas basadas en configuración de motores
- ✅ Cálculo de precio total del paquete (drive + reactor + guardamotor)
- ✅ Extracción automática de especificaciones (HP, voltaje, corriente)
- ✅ Integración con chatbot para consultas de productos

## 📊 Rutas API Disponibles

| Método | Ruta | Descripción | Parámetros |
|--------|------|-------------|------------|
| GET | `/` | Interfaz principal | - |
| GET | `/app.js` | JavaScript de la aplicación | - |
| POST | `/api/calculate` | Calcular ahorros | JSON con inputs |
| GET | `/api/presets` | Obtener presets | - |
| POST | `/api/chat` | Chat con IA | message, context |
| GET | `/api/history` | Histórico de cálculos | - |
| GET | `/api/products/search` | Buscar productos Rockwell | q (query), limit |
| POST | `/api/products/recommendations` | Obtener recomendaciones | motors, hpPerMotor |
| POST | `/api/products/package-price` | Calcular precio paquete | skus[] |

## 🛠 Arquitectura Técnica

### Stack Tecnológico
- **Backend**: Hono Framework + TypeScript
- **Frontend**: React 18 (sin build, usando CDN)
- **Estilos**: TailwindCSS (CDN)
- **Base de Datos**: Cloudflare D1 (SQLite)
- **Búsqueda**: Meilisearch (catálogo de productos)
- **IA**: OpenAI GPT-4 API
- **Despliegue**: Cloudflare Pages/Workers
- **PDF**: jsPDF

### Estructura del Proyecto
```
webapp/
├── src/
│   ├── index.tsx      # Backend principal con Hono
│   ├── app.ts         # Lógica React del frontend
│   ├── client.ts      # HTML base de la aplicación
│   ├── meilisearch-client.ts  # Cliente para búsqueda de productos
│   └── products-ui.ts  # Componentes UI de productos
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
Para habilitar todas las funciones, configura:
```bash
# Desarrollo local (.dev.vars)
OPENAI_API_KEY=tu-api-key-aqui
MEILISEARCH_HOST=https://tu-instancia.meilisearch.com
MEILISEARCH_API_KEY=tu-meilisearch-key
MEILISEARCH_INDEX=rockwell_products

# Producción (Cloudflare Worker)
npx wrangler secret put OPENAI_API_KEY
npx wrangler secret put MEILISEARCH_HOST
npx wrangler secret put MEILISEARCH_API_KEY
npx wrangler secret put MEILISEARCH_INDEX

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
1. **Configurar API Key de OpenAI** para habilitar chatbot completo ✅
2. **Meilisearch conectado** con base de datos real de ABSA ✅
3. **Desplegar a Cloudflare Pages** para acceso público
4. **GitHub configurado** - Repositorio: github.com/abez123/energy ✅

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