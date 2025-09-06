// Función mejorada de exportación a PDF
function exportToPDF(inputs, results) {
    if (!results) return;
    
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Función helper para formatear números
    const formatNumber = (num) => {
        return Math.round(num).toLocaleString('es-ES');
    };
    
    // Logo y título
    doc.setFontSize(24);
    doc.setTextColor(30, 58, 138);
    doc.text('GrupoABSA', 20, 20);
    
    doc.setFontSize(18);
    doc.setTextColor(59, 130, 246);
    doc.text('Reporte de Ahorro Energético', 20, 30);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Fecha: ${new Date().toLocaleDateString('es-ES')}`, 20, 38);
    doc.text('Drive + Reactor + Guardamotor', 20, 44);
    
    // Línea separadora
    doc.setDrawColor(59, 130, 246);
    doc.line(20, 48, 190, 48);
    
    // Sección 1: Parámetros de Entrada
    doc.setFontSize(14);
    doc.setTextColor(30, 58, 138);
    doc.text('1. Parámetros de Entrada', 20, 58);
    
    doc.setFontSize(10);
    doc.setTextColor(0);
    let y = 66;
    
    // Columna 1
    doc.text(`• Motores: ${inputs.motors} unidades`, 25, y);
    doc.text(`• HP por motor: ${inputs.hpPerMotor} HP (${(inputs.hpPerMotor * 0.746).toFixed(2)} kW)`, 25, y + 6);
    doc.text(`• Factor de carga: ${inputs.loadFactor}%`, 25, y + 12);
    doc.text(`• Horas de operación: ${formatNumber(inputs.operationHours)} horas/año`, 25, y + 18);
    doc.text(`• Tarifa eléctrica: $${inputs.electricityRate}/kWh`, 25, y + 24);
    doc.text(`• Horizonte del proyecto: ${inputs.projectHorizon} años`, 25, y + 30);
    
    // Columna 2
    doc.text(`• Ahorro energético por Drive: ${inputs.driveSavings}%`, 110, y);
    doc.text(`• Horas de paro evitadas: ${inputs.avoidedStopHours} horas/año`, 110, y + 6);
    doc.text(`• Costo por hora de paro: $${formatNumber(inputs.stopCostPerHour)}/h`, 110, y + 12);
    doc.text(`• Gasto mantenimiento actual: $${formatNumber(inputs.currentMaintenance)}/año`, 110, y + 18);
    doc.text(`• Reducción de mantenimiento: ${inputs.maintenanceReduction}%`, 110, y + 24);
    doc.text(`• Costo del paquete por motor: $${formatNumber(inputs.packageCostPerMotor)}`, 110, y + 30);
    
    // Sección 2: Análisis de Consumo
    y = y + 45;
    doc.setFontSize(14);
    doc.setTextColor(30, 58, 138);
    doc.text('2. Análisis de Consumo Actual', 20, y);
    
    doc.setFontSize(10);
    doc.setTextColor(0);
    doc.text(`• Consumo energético anual: ${formatNumber(results.currentConsumption)} kWh/año`, 25, y + 8);
    doc.text(`• Costo de energía actual: $${formatNumber(results.currentEnergyCost)}/año`, 25, y + 14);
    
    // Sección 3: Desglose de Ahorros
    y = y + 28;
    doc.setFontSize(14);
    doc.setTextColor(30, 58, 138);
    doc.text('3. Desglose de Ahorros Anuales', 20, y);
    
    doc.setFontSize(10);
    doc.setTextColor(0);
    doc.setTextColor(34, 197, 94);
    doc.text(`✓ Ahorro energético (${inputs.driveSavings}% eficiencia): $${formatNumber(results.energySavings)}`, 25, y + 8);
    doc.setTextColor(59, 130, 246);
    doc.text(`✓ Ahorro por paros evitados (${inputs.avoidedStopHours} horas): $${formatNumber(results.stopSavings)}`, 25, y + 14);
    doc.setTextColor(147, 51, 234);
    doc.text(`✓ Ahorro en mantenimiento (${inputs.maintenanceReduction}% reducción): $${formatNumber(results.maintenanceSavings)}`, 25, y + 20);
    
    // Total de ahorros
    doc.setFontSize(12);
    doc.setTextColor(30, 58, 138);
    doc.setFont(undefined, 'bold');
    doc.text(`AHORRO TOTAL ANUAL: $${formatNumber(results.totalAnnualSavings)}`, 25, y + 30);
    doc.setFont(undefined, 'normal');
    
    // Sección 4: Análisis Financiero
    y = y + 44;
    doc.setFontSize(14);
    doc.setTextColor(30, 58, 138);
    doc.text('4. Análisis Financiero', 20, y);
    
    doc.setFontSize(10);
    doc.setTextColor(0);
    doc.text(`• Inversión total requerida: $${formatNumber(results.totalInvestment)}`, 25, y + 8);
    doc.text(`• Periodo de retorno (Payback): ${results.paybackYears.toFixed(2)} años`, 25, y + 14);
    doc.text(`• ROI Anual: ${results.annualROI.toFixed(1)}%`, 25, y + 20);
    doc.text(`• Ahorro acumulado en ${inputs.projectHorizon} años: $${formatNumber(results.accumulatedSavings)}`, 25, y + 26);
    
    // Conclusión
    y = y + 40;
    doc.setFontSize(12);
    doc.setTextColor(30, 58, 138);
    doc.text('Conclusión:', 20, y);
    
    doc.setFontSize(10);
    doc.setTextColor(0);
    const paybackMonths = Math.ceil(results.paybackYears * 12);
    doc.text(`La inversión se recupera en aproximadamente ${paybackMonths} meses, generando un ROI del ${results.annualROI.toFixed(0)}%.`, 20, y + 8);
    doc.text(`En ${inputs.projectHorizon} años, el ahorro total será de $${formatNumber(results.accumulatedSavings)}.`, 20, y + 14);
    
    // Pie de página
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text('© 2025 GrupoABSA - Soluciones Energéticas Inteligentes', 20, 280);
    doc.text('www.grupoabsa.com | Calculadora de Ahorro Energético', 20, 285);
    doc.text(`Generado: ${new Date().toLocaleString('es-ES')}`, 20, 290);
    
    // Guardar PDF
    doc.save(`GrupoABSA_Reporte_Ahorro_${new Date().toISOString().split('T')[0]}.pdf`);
}