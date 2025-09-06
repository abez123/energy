import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { getClientHtml } from './client'
import { getAppJs } from './app'

type Bindings = {
  DB: D1Database;
  OPENAI_API_KEY?: string;
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

// Chat endpoint for AI assistance
app.post('/api/chat', async (c) => {
  const { message, context } = await c.req.json()
  
  if (!c.env.OPENAI_API_KEY) {
    return c.json({ 
      response: "El asistente de IA no está configurado. Por favor, configure la API key de OpenAI para habilitar esta función."
    })
  }
  
  try {
    const systemPrompt = `Eres un experto en eficiencia energética y ahorro de energía industrial. 
    Especializado en el uso de variadores de frecuencia (drives), reactores y guardamotores.
    Ayudas a analizar y optimizar el consumo energético, calcular ROI y hacer recomendaciones específicas.
    Siempre responde en español y de manera profesional pero amigable.
    
    Contexto del cálculo actual (si está disponible): ${JSON.stringify(context)}`
    
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

export default app