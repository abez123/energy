import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { getClientHtml } from './client'
import { getAppJs } from './app'
import { RockwellProductSearch } from './meilisearch-client'

type Bindings = {
  DB: D1Database;
  OPENAI_API_KEY?: string;
  MEILISEARCH_HOST?: string;
  MEILISEARCH_API_KEY?: string;
  MEILISEARCH_INDEX?: string;
}

type CalculationInput = {
  motors: number;
  hpPerMotor: number;
  loadFactor: number;
  operationHours: number;
  electricityRate: number;
  driveSavings: number;
  avoidedStopHours: number;
  stopCostPerHour: number;
  currentMaintenance: number;
  maintenanceReduction: number;
  packageCostPerMotor: number;
  projectHorizon: number;
}

type CalculationResult = {
  currentConsumption: number;
  currentEnergyCost: number;
  energySavings: number;
  stopSavings: number;
  maintenanceSavings: number;
  totalAnnualSavings: number;
  totalInvestment: number;
  paybackYears: number;
  annualROI: number;
  accumulatedSavings: number;
}

const app = new Hono<{ Bindings: Bindings }>()

// Enable CORS for API endpoints
app.use('/api/*', cors())

// Serve JavaScript app
app.get('/app.js', (c) => {
  return c.text(getAppJs(), 200, {
    'Content-Type': 'application/javascript'
  });
});

// Serve main HTML file at root
app.get('/', (c) => {
  return c.html(getClientHtml())
})

// API endpoint for energy savings calculation
app.post('/api/calculate', async (c) => {
  try {
    const input: CalculationInput = await c.req.json()
    
    // Convert HP to kW (1 HP = 0.746 kW)
    const kwPerMotor = input.hpPerMotor * 0.746
    
    // Calculate current consumption
    const currentConsumption = input.motors * kwPerMotor * (input.loadFactor / 100) * input.operationHours
    const currentEnergyCost = currentConsumption * input.electricityRate
    
    // Calculate savings
    const energySavings = currentEnergyCost * (input.driveSavings / 100)
    const stopSavings = input.avoidedStopHours * input.stopCostPerHour
    const maintenanceSavings = input.currentMaintenance * (input.maintenanceReduction / 100)
    
    const totalAnnualSavings = energySavings + stopSavings + maintenanceSavings
    const totalInvestment = input.packageCostPerMotor * input.motors
    
    // Calculate ROI metrics
    const paybackYears = totalInvestment / totalAnnualSavings
    const annualROI = (totalAnnualSavings / totalInvestment) * 100
    const accumulatedSavings = totalAnnualSavings * input.projectHorizon
    
    const result: CalculationResult = {
      currentConsumption,
      currentEnergyCost,
      energySavings,
      stopSavings,
      maintenanceSavings,
      totalAnnualSavings,
      totalInvestment,
      paybackYears,
      annualROI,
      accumulatedSavings
    }
    
    // Store calculation in database if available
    if (c.env.DB) {
      try {
        await c.env.DB.prepare(`
          CREATE TABLE IF NOT EXISTS calculations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            input TEXT NOT NULL,
            result TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `).run()
        
        await c.env.DB.prepare(`
          INSERT INTO calculations (input, result) VALUES (?, ?)
        `).bind(JSON.stringify(input), JSON.stringify(result)).run()
      } catch (dbError) {
        console.error('Database error:', dbError)
      }
    }
    
    return c.json(result)
  } catch (error) {
    return c.json({ error: 'Error en el cálculo' }, 400)
  }
})

// API endpoint for presets
app.get('/api/presets', (c) => {
  const presets = {
    'bombas-ventiladores': {
      name: 'Bombas/Ventiladores',
      motors: 1,
      hpPerMotor: 10,
      loadFactor: 90,
      operationHours: 2500,
      electricityRate: 2.5,
      driveSavings: 30,
      avoidedStopHours: 40,
      stopCostPerHour: 25000,
      currentMaintenance: 10000,
      maintenanceReduction: 30,
      packageCostPerMotor: 2400,
      projectHorizon: 5
    },
    'transportadores': {
      name: 'Transportadores',
      motors: 2,
      hpPerMotor: 5,
      loadFactor: 85,
      operationHours: 3000,
      electricityRate: 2.5,
      driveSavings: 25,
      avoidedStopHours: 30,
      stopCostPerHour: 20000,
      currentMaintenance: 8000,
      maintenanceReduction: 25,
      packageCostPerMotor: 2000,
      projectHorizon: 5
    },
    'carga-fija': {
      name: 'Carga Fija',
      motors: 1,
      hpPerMotor: 15,
      loadFactor: 95,
      operationHours: 4000,
      electricityRate: 2.5,
      driveSavings: 20,
      avoidedStopHours: 20,
      stopCostPerHour: 30000,
      currentMaintenance: 12000,
      maintenanceReduction: 35,
      packageCostPerMotor: 3000,
      projectHorizon: 5
    }
  }
  
  return c.json(presets)
})

// Load Profile Calculator endpoint
app.post('/api/calculate-load-profile', async (c) => {
  try {
    const input = await c.req.json()
    
    // Import the calculator
    const { calculateWithLoadProfile } = await import('./load-profile-calculator')
    
    // Calcular con perfil de carga
    const result = calculateWithLoadProfile(input)
    
    // Save to database if available
    if (c.env.DB) {
      try {
        await c.env.DB.prepare(`
          CREATE TABLE IF NOT EXISTS load_profile_calculations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            input TEXT NOT NULL,
            result TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `).run()
        
        await c.env.DB.prepare(`
          INSERT INTO load_profile_calculations (input, result) VALUES (?, ?)
        `).bind(JSON.stringify(input), JSON.stringify(result)).run()
      } catch (dbError) {
        console.error('Database error:', dbError)
      }
    }
    
    return c.json(result)
  } catch (error) {
    console.error('Load profile calculation error:', error)
    return c.json({ error: 'Error en el cálculo con perfil de carga' }, 400)
  }
})

// Get load profile presets
app.get('/api/load-profile-presets', async (c) => {
  const { PRESET_LOAD_PROFILES } = await import('./load-profile-calculator')
  
  return c.json({
    presets: PRESET_LOAD_PROFILES,
    flowLevels: [1.0, 0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3, 0.2, 0.1]
  })
})

// Chat endpoint for AI assistance
app.post('/api/chat', async (c) => {
  const { message, context } = await c.req.json()
  
  if (!c.env.OPENAI_API_KEY) {
    return c.json({ 
      response: "El asistente de IA no está configurado. Por favor, configure la API key de OpenAI para habilitar esta función."
    })
  }
  
  try {
    let contextualInfo = "";
    
    // Si hay contexto de cálculos, crear un análisis detallado
    if (context && context.results) {
      const { inputs, results } = context;
      
      // Formatear números para mejor legibilidad
      const fmt = (num: number) => Math.round(num).toLocaleString('es-ES');
      
      contextualInfo = `
CONTEXTO DE CÁLCULO ACTUAL (Ciclo de Operación):

📊 CONFIGURACIÓN DEL MOTOR:
- Cantidad de motores: ${inputs.cantidadMotores} unidad(es)
- Potencia: ${inputs.hp} HP (${results.kw ? results.kw.toFixed(2) : 'N/A'} kW)
- Eficiencia: ${inputs.eficiencia}%
- Voltaje: ${inputs.voltaje}V
- Horas de operación: ${fmt(inputs.horasAnio)} horas/año
- Tarifa eléctrica: $${inputs.costoKwhUsd}/kWh

⚡ CONSUMO Y COSTOS:
A TENSIÓN PLENA (Sin VFD):
- Consumo: ${fmt(results.consumoPlenaKwh)} kWh/año
- Costo: $${fmt(results.consumoPlenaUsd)}/año

CON VARIADOR DE FRECUENCIA:
- Consumo: ${fmt(results.consumoVfdKwh)} kWh/año
- Costo: $${fmt(results.consumoVfdUsd)}/año

💰 AHORROS:
- Ahorro energético: ${fmt(results.ahorroKwh)} kWh/año
- Ahorro económico: $${fmt(results.ahorroUsd)}/año

📈 ANÁLISIS FINANCIERO:
- Inversión requerida: $${fmt(inputs.inversionDriveInstalacion)}
- ROI: ${results.roiAnios.toFixed(2)} años (${results.roiMeses.toFixed(1)} meses)
- Porcentaje de ahorro: ${((results.ahorroKwh / results.consumoPlenaKwh) * 100).toFixed(1)}%

${context.products && context.products.length > 0 ? `🛒 PRODUCTOS ROCKWELL AUTOMATION RECOMENDADOS:
${context.products.map(p => `- ${p.product.name} (${p.product.sku})
  Precio: $${p.product.price} ${p.product.currency}
  ${p.reason}`).join('\n')}

${context.packageData ? `💼 PRECIO TOTAL DEL PAQUETE: $${context.packageData.total} ${context.packageData.currency}` : ''}
` : ''}`;
    }
    
    const systemPrompt = `Eres un experto consultor en eficiencia energética industrial de GrupoABSA, especializado en:
- Variadores de frecuencia (VFD/Drives) - especialmente PowerFlex de Rockwell Automation
- Ley de Afinidad para bombas y ventiladores (Potencia ∝ Velocidad³)
- Cálculos con perfil de carga (load profile)
- Reactores de línea y carga
- Guardamotores y protección eléctrica
- Optimización de consumo energético
- Cálculo de ROI y análisis financiero
- Mejores prácticas de la industria
- Productos y soluciones Rockwell Automation

Tu objetivo es ayudar a los usuarios a entender sus ahorros potenciales con variadores de frecuencia, especialmente en aplicaciones de bombas y ventiladores donde la Ley de Afinidad genera ahorros significativos.

${contextualInfo ? `DATOS DEL CÁLCULO ACTUAL QUE DEBES ANALIZAR:
${contextualInfo}

IMPORTANTE: 
- Siempre haz referencia a estos números específicos cuando respondas
- Explica cómo el perfil de carga (ciclo de operación) afecta los ahorros
- Analiza si el ROI es atractivo (menos de 2 años es excelente)
- Sugiere optimizaciones basadas en los datos actuales
- Compara con estándares de la industria para bombas/ventiladores
- Menciona que la Ley de Afinidad (Potencia ∝ Velocidad³) es clave para estos ahorros
- Si el ROI es menor a 1 año, enfatiza lo excepcional de la inversión
` : 'No hay cálculos actuales. Ayuda al usuario a entender cómo usar la calculadora con perfil de carga (ciclo de operación).'}

Responde siempre en español, de manera profesional pero amigable.
Usa bullets, negritas y emojis para hacer la información más digerible.
Si el usuario pregunta sobre los resultados, analízalos en detalle y da recomendaciones específicas sobre el perfil de carga y los productos Rockwell Automation.`
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${c.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        temperature: 0.7,
        max_tokens: 500
      })
    })
    
    const data = await response.json()
    
    if (data.choices && data.choices[0]) {
      return c.json({ response: data.choices[0].message.content })
    } else {
      throw new Error('Invalid response from OpenAI')
    }
  } catch (error) {
    console.error('OpenAI API error:', error)
    return c.json({ 
      response: "Lo siento, hubo un error al procesar tu consulta. Por favor, intenta de nuevo."
    })
  }
})

// Get calculation history
app.get('/api/history', async (c) => {
  if (!c.env.DB) {
    return c.json({ history: [] })
  }
  
  try {
    const result = await c.env.DB.prepare(`
      SELECT * FROM calculations 
      ORDER BY created_at DESC 
      LIMIT 20
    `).all()
    
    return c.json({ history: result.results || [] })
  } catch (error) {
    console.error('Database error:', error)
    return c.json({ history: [] })
  }
})

// Search Rockwell products
app.get('/api/products/search', async (c) => {
  const query = c.req.query('q') || ''
  const limit = parseInt(c.req.query('limit') || '10')
  
  const productSearch = new RockwellProductSearch(
    c.env.MEILISEARCH_HOST,
    c.env.MEILISEARCH_API_KEY,
    c.env.MEILISEARCH_INDEX
  )
  
  try {
    const results = await productSearch.searchProducts(query, { limit })
    return c.json(results)
  } catch (error) {
    console.error('Product search error:', error)
    return c.json({ products: [], totalHits: 0, processingTime: 0, query })
  }
})

// Get product by SKU
app.get('/api/products/:sku', async (c) => {
  const sku = c.req.param('sku')
  
  const productSearch = new RockwellProductSearch(
    c.env.MEILISEARCH_HOST,
    c.env.MEILISEARCH_API_KEY,
    c.env.MEILISEARCH_INDEX
  )
  
  try {
    const product = await productSearch.getProductBySku(sku)
    if (!product) {
      return c.json({ error: 'Product not found' }, 404)
    }
    return c.json(product)
  } catch (error) {
    console.error('Product fetch error:', error)
    return c.json({ error: 'Error fetching product' }, 500)
  }
})

// Get product recommendations based on calculation
app.post('/api/products/recommendations', async (c) => {
  const { motors, hpPerMotor, applicationType } = await c.req.json()
  
  const productSearch = new RockwellProductSearch(
    c.env.MEILISEARCH_HOST,
    c.env.MEILISEARCH_API_KEY,
    c.env.MEILISEARCH_INDEX
  )
  
  try {
    const recommendations = await productSearch.getRecommendations({
      motors,
      hpPerMotor,
      applicationType
    })
    
    return c.json({ recommendations })
  } catch (error) {
    console.error('Recommendations error:', error)
    return c.json({ recommendations: [] })
  }
})

// Calculate package price
app.post('/api/products/package-price', async (c) => {
  const { skus } = await c.req.json()
  
  const productSearch = new RockwellProductSearch(
    c.env.MEILISEARCH_HOST,
    c.env.MEILISEARCH_API_KEY,
    c.env.MEILISEARCH_INDEX
  )
  
  try {
    const packagePrice = await productSearch.calculatePackagePrice(skus)
    return c.json(packagePrice)
  } catch (error) {
    console.error('Package price error:', error)
    return c.json({ total: 0, items: [], currency: 'USD' })
  }
})

export default app