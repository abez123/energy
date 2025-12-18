// Calculadora de Ahorro Energético con Perfil de Carga (Load Profile)
// Basada en la Ley de Afinidad para bombas y ventiladores

export interface LoadProfilePoint {
  flow: number;      // Porcentaje de flujo (0.1 a 1.0)
  timePercent: number; // Porcentaje de tiempo (0 a 1)
}

export interface LoadProfileInputs {
  // Datos del motor
  cantidadMotores: number;
  hp: number;
  eficiencia: number; // 0 a 1 (ej: 0.95 = 95%)
  voltaje: number;
  
  // Datos operacionales
  horasAnio: number;
  costoKwhUsd: number;
  
  // Inversión
  inversionDriveInstalacion: number;
  
  // Perfil de carga (10 puntos de 100% a 10%)
  loadProfile: LoadProfilePoint[];
}

export interface LoadProfileResults {
  // Datos calculados del motor
  kw: number;
  
  // Consumo a tensión plena (sin VFD)
  consumoPlenaKwh: number;
  consumoPlenaUsd: number;
  
  // Consumo con VFD
  consumoVfdKwh: number;
  consumoVfdUsd: number;
  
  // Ahorros
  ahorroKwh: number;
  ahorroUsd: number;
  
  // ROI
  roiAnios: number;
  roiMeses: number;
  
  // Validación del perfil
  totalTiempoPercent: number;
  profileValid: boolean;
  
  // Desglose por punto de carga
  loadProfileBreakdown: Array<{
    flow: number;
    timePercent: number;
    consumoKwh: number;
  }>;
}

export function calculateWithLoadProfile(inputs: LoadProfileInputs): LoadProfileResults {
  // Validar que el perfil de carga sume 100%
  const totalTiempoPercent = inputs.loadProfile.reduce((sum, point) => sum + point.timePercent, 0);
  const profileValid = Math.abs(totalTiempoPercent - 1.0) < 0.001; // Tolerancia de 0.1%
  
  // Calcular KW del motor
  // KW = HP × 0.746 / Eficiencia
  const kw = (inputs.hp * 0.746) / inputs.eficiencia;
  
  // Consumo a tensión plena (sin VFD)
  // Consumo = Horas × Cantidad × KW
  const consumoPlenaKwh = inputs.horasAnio * inputs.cantidadMotores * kw;
  const consumoPlenaUsd = inputs.costoKwhUsd * consumoPlenaKwh;
  
  // Consumo con VFD usando la Ley de Afinidad
  // Para bombas y ventiladores: Potencia ∝ Velocidad³
  // Consumo VFD = Σ(Flujo³ × Horas × Cantidad × Tiempo% × KW)
  let consumoVfdKwh = 0;
  const loadProfileBreakdown: Array<{flow: number; timePercent: number; consumoKwh: number}> = [];
  
  for (const point of inputs.loadProfile) {
    // Ley de afinidad: P = P_nominal × (v/v_nominal)³
    // donde v/v_nominal = flujo%
    const consumoPoint = Math.pow(point.flow, 3) * 
                        inputs.horasAnio * 
                        inputs.cantidadMotores * 
                        point.timePercent * 
                        kw;
    
    consumoVfdKwh += consumoPoint;
    
    loadProfileBreakdown.push({
      flow: point.flow,
      timePercent: point.timePercent,
      consumoKwh: consumoPoint
    });
  }
  
  const consumoVfdUsd = inputs.costoKwhUsd * consumoVfdKwh;
  
  // Calcular ahorros
  const ahorroKwh = consumoPlenaKwh - consumoVfdKwh;
  const ahorroUsd = consumoPlenaUsd - consumoVfdUsd;
  
  // Calcular ROI
  const roiAnios = ahorroUsd > 0 ? inputs.inversionDriveInstalacion / ahorroUsd : 0;
  const roiMeses = roiAnios * 12;
  
  return {
    kw,
    consumoPlenaKwh,
    consumoPlenaUsd,
    consumoVfdKwh,
    consumoVfdUsd,
    ahorroKwh,
    ahorroUsd,
    roiAnios,
    roiMeses,
    totalTiempoPercent,
    profileValid,
    loadProfileBreakdown
  };
}

// Perfiles de carga predefinidos
export const PRESET_LOAD_PROFILES = {
  'bombas-caudal-variable': [
    { flow: 1.0, timePercent: 0.00 },
    { flow: 0.9, timePercent: 0.00 },
    { flow: 0.8, timePercent: 0.80 },
    { flow: 0.7, timePercent: 0.00 },
    { flow: 0.6, timePercent: 0.20 },
    { flow: 0.5, timePercent: 0.00 },
    { flow: 0.4, timePercent: 0.00 },
    { flow: 0.3, timePercent: 0.00 },
    { flow: 0.2, timePercent: 0.00 },
    { flow: 0.1, timePercent: 0.00 },
  ],
  'ventiladores-variable': [
    { flow: 1.0, timePercent: 0.10 },
    { flow: 0.9, timePercent: 0.15 },
    { flow: 0.8, timePercent: 0.25 },
    { flow: 0.7, timePercent: 0.30 },
    { flow: 0.6, timePercent: 0.15 },
    { flow: 0.5, timePercent: 0.05 },
    { flow: 0.4, timePercent: 0.00 },
    { flow: 0.3, timePercent: 0.00 },
    { flow: 0.2, timePercent: 0.00 },
    { flow: 0.1, timePercent: 0.00 },
  ],
  'carga-constante': [
    { flow: 1.0, timePercent: 1.00 },
    { flow: 0.9, timePercent: 0.00 },
    { flow: 0.8, timePercent: 0.00 },
    { flow: 0.7, timePercent: 0.00 },
    { flow: 0.6, timePercent: 0.00 },
    { flow: 0.5, timePercent: 0.00 },
    { flow: 0.4, timePercent: 0.00 },
    { flow: 0.3, timePercent: 0.00 },
    { flow: 0.2, timePercent: 0.00 },
    { flow: 0.1, timePercent: 0.00 },
  ],
};
