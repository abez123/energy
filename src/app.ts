export const getAppJs = () => {
  return `
// Energy Calculator React Application
const { useState, useEffect, useRef } = React;
const { createElement: h } = React;

const EnergyCalculator = () => {
    const [inputs, setInputs] = useState({
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
    });

    const [results, setResults] = useState(null);
    const [selectedPreset, setSelectedPreset] = useState('bombas-ventiladores');
    const [calculating, setCalculating] = useState(false);
    const [messages, setMessages] = useState([
        { role: 'assistant', content: '¡Hola! Soy tu asistente experto en eficiencia energética. ¿En qué puedo ayudarte?' }
    ]);
    const [inputMessage, setInputMessage] = useState('');
    const [chatLoading, setChatLoading] = useState(false);

    useEffect(() => {
        loadPresets();
    }, []);

    const loadPresets = async () => {
        try {
            const response = await fetch('/api/presets');
            const data = await response.json();
            if (data[selectedPreset]) {
                setInputs(data[selectedPreset]);
            }
        } catch (error) {
            console.error('Error loading presets:', error);
        }
    };

    const handlePresetChange = async (presetKey) => {
        setSelectedPreset(presetKey);
        const response = await fetch('/api/presets');
        const presets = await response.json();
        if (presets[presetKey]) {
            setInputs(presets[presetKey]);
        }
    };

    const handleInputChange = (field, value) => {
        setInputs(prev => ({
            ...prev,
            [field]: parseFloat(value) || 0
        }));
    };

    const calculateSavings = async () => {
        setCalculating(true);
        try {
            const response = await fetch('/api/calculate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(inputs)
            });
            const data = await response.json();
            setResults(data);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setCalculating(false);
        }
    };

    const sendMessage = async () => {
        if (!inputMessage.trim()) return;
        const userMessage = inputMessage;
        setInputMessage('');
        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        setChatLoading(true);

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: userMessage,
                    context: results ? { inputs, results } : null
                })
            });
            const data = await response.json();
            setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setChatLoading(false);
        }
    };

    const exportToPDF = () => {
        if (!results) return;
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        doc.setFontSize(20);
        doc.setTextColor(102, 126, 234);
        doc.text('Reporte de Ahorro Energético', 20, 20);
        
        doc.setFontSize(10);
        doc.text(\`Fecha: \${new Date().toLocaleDateString('es-ES')}\`, 20, 30);
        doc.text(\`Motores: \${inputs.motors}\`, 25, 55);
        doc.text(\`Ahorro Total Anual: $\${results.totalAnnualSavings.toFixed(0)}\`, 25, 145);
        doc.text(\`ROI: \${results.annualROI.toFixed(1)}%\`, 25, 152);
        
        doc.save('reporte-ahorro-energetico.pdf');
    };

    const formatNumber = (num) => num.toFixed(0).replace(/\\B(?=(\\d{3})+(?!\\d))/g, ".");

    return h('div', { className: 'min-h-screen bg-gray-50' },
        // Header
        h('header', { className: 'gradient-bg text-white py-8 px-4' },
            h('div', { className: 'max-w-7xl mx-auto' },
                h('h1', { className: 'text-3xl font-bold mb-2' },
                    h('i', { className: 'fas fa-bolt mr-3' }),
                    'Simulador de Ahorro Energético'
                ),
                h('p', { className: 'text-lg opacity-90' }, 'Drive + Reactor + Guardamotor'),
                h('p', { className: 'text-sm mt-2' }, 'Transforma costos ocultos en ahorros medibles')
            )
        ),

        h('div', { className: 'max-w-7xl mx-auto px-4 py-8' },
            h('div', { className: 'grid grid-cols-1 lg:grid-cols-3 gap-6' },
                // Panel de Entrada
                h('div', { className: 'lg:col-span-1' },
                    h('div', { className: 'bg-white rounded-lg shadow-lg p-6' },
                        h('h2', { className: 'text-xl font-bold mb-4' },
                            h('i', { className: 'fas fa-sliders-h mr-2' }),
                            'Configuración'
                        ),
                        // Preset Selector
                        h('div', { className: 'mb-4' },
                            h('label', { className: 'block text-sm font-medium mb-2' }, 'Preset'),
                            h('select', {
                                className: 'w-full p-2 border rounded-lg',
                                value: selectedPreset,
                                onChange: (e) => handlePresetChange(e.target.value)
                            },
                                h('option', { value: 'bombas-ventiladores' }, 'Bombas/Ventiladores'),
                                h('option', { value: 'transportadores' }, 'Transportadores'),
                                h('option', { value: 'carga-fija' }, 'Carga Fija')
                            )
                        ),
                        // Input Fields
                        h('div', { className: 'space-y-3 max-h-96 overflow-y-auto' },
                            Object.entries({
                                motors: 'Motores',
                                hpPerMotor: 'HP por motor',
                                loadFactor: 'Factor carga (%)',
                                operationHours: 'Horas/año',
                                electricityRate: 'Tarifa ($/kWh)',
                                driveSavings: 'Ahorro Drive (%)',
                                avoidedStopHours: 'Paros evitados (h)',
                                stopCostPerHour: 'Costo paro ($/h)',
                                currentMaintenance: 'Manten. actual ($)',
                                maintenanceReduction: 'Reducción (%)',
                                packageCostPerMotor: 'Costo paquete ($)',
                                projectHorizon: 'Horizonte (años)'
                            }).map(([field, label]) =>
                                h('div', { key: field },
                                    h('label', { className: 'block text-sm font-medium' }, label),
                                    h('input', {
                                        type: 'number',
                                        className: 'mt-1 w-full p-2 border rounded',
                                        value: inputs[field],
                                        onChange: (e) => handleInputChange(field, e.target.value)
                                    })
                                )
                            )
                        ),
                        h('button', {
                            onClick: calculateSavings,
                            disabled: calculating,
                            className: 'w-full mt-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-lg font-semibold'
                        },
                            calculating ? 'Calculando...' : 'Calcular Ahorros'
                        )
                    )
                ),

                // Panel de Resultados
                h('div', { className: 'lg:col-span-2' },
                    // Results Section
                    h('div', { className: 'bg-white rounded-lg shadow-lg p-6 mb-6' },
                        h('div', { className: 'flex justify-between items-center mb-4' },
                            h('h2', { className: 'text-xl font-bold' }, 'Resultados'),
                            results && h('button', {
                                onClick: exportToPDF,
                                className: 'px-4 py-2 bg-red-500 text-white rounded-lg'
                            }, 'Exportar PDF')
                        ),
                        results ? h('div', null,
                            // Metrics Grid
                            h('div', { className: 'grid grid-cols-2 gap-4 mb-6' },
                                h('div', { className: 'bg-gray-50 p-4 rounded' },
                                    h('p', { className: 'text-sm text-gray-600' }, 'Consumo actual'),
                                    h('p', { className: 'text-2xl font-bold' }, 
                                        \`\${formatNumber(results.currentConsumption)} kWh/año\`)
                                ),
                                h('div', { className: 'bg-gray-50 p-4 rounded' },
                                    h('p', { className: 'text-sm text-gray-600' }, 'Costo energía'),
                                    h('p', { className: 'text-2xl font-bold' }, 
                                        \`$\${formatNumber(results.currentEnergyCost)}/año\`)
                                )
                            ),
                            // Savings Cards
                            h('div', { className: 'grid grid-cols-3 gap-4 mb-6' },
                                h('div', { className: 'metric-card bg-green-50 p-4 rounded border-l-4 border-green-500' },
                                    h('p', { className: 'text-sm text-green-700' }, 'Ahorro energético'),
                                    h('p', { className: 'text-xl font-bold text-green-800' }, 
                                        \`$\${formatNumber(results.energySavings)}\`)
                                ),
                                h('div', { className: 'metric-card bg-blue-50 p-4 rounded border-l-4 border-blue-500' },
                                    h('p', { className: 'text-sm text-blue-700' }, 'Paros evitados'),
                                    h('p', { className: 'text-xl font-bold text-blue-800' }, 
                                        \`$\${formatNumber(results.stopSavings)}\`)
                                ),
                                h('div', { className: 'metric-card bg-purple-50 p-4 rounded border-l-4 border-purple-500' },
                                    h('p', { className: 'text-sm text-purple-700' }, 'Mantenimiento'),
                                    h('p', { className: 'text-xl font-bold text-purple-800' }, 
                                        \`$\${formatNumber(results.maintenanceSavings)}\`)
                                )
                            ),
                            // Main Metrics
                            h('div', { className: 'bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg p-6' },
                                h('div', { className: 'grid grid-cols-4 gap-4' },
                                    h('div', { className: 'text-center' },
                                        h('p', { className: 'text-sm opacity-90' }, 'Ahorro Total'),
                                        h('p', { className: 'text-2xl font-bold' }, 
                                            \`$\${formatNumber(results.totalAnnualSavings)}\`)
                                    ),
                                    h('div', { className: 'text-center' },
                                        h('p', { className: 'text-sm opacity-90' }, 'Inversión'),
                                        h('p', { className: 'text-2xl font-bold' }, 
                                            \`$\${formatNumber(results.totalInvestment)}\`)
                                    ),
                                    h('div', { className: 'text-center' },
                                        h('p', { className: 'text-sm opacity-90' }, 'Payback'),
                                        h('p', { className: 'text-2xl font-bold' }, 
                                            \`\${results.paybackYears.toFixed(2)} años\`)
                                    ),
                                    h('div', { className: 'text-center' },
                                        h('p', { className: 'text-sm opacity-90' }, 'ROI Anual'),
                                        h('p', { className: 'text-2xl font-bold' }, 
                                            \`\${results.annualROI.toFixed(1)}%\`)
                                    )
                                )
                            )
                        ) : h('div', { className: 'text-center py-12 text-gray-500' },
                            h('i', { className: 'fas fa-chart-area text-6xl mb-4 opacity-30' }),
                            h('p', null, 'Configura y calcula para ver resultados')
                        )
                    ),

                    // Chat Section
                    h('div', { className: 'bg-white rounded-lg shadow-lg p-6' },
                        h('h2', { className: 'text-xl font-bold mb-4' }, 'Asistente IA'),
                        h('div', { className: 'chat-container bg-gray-50 rounded-lg p-4 mb-4' },
                            messages.map((msg, i) =>
                                h('div', {
                                    key: i,
                                    className: \`mb-3 \${msg.role === 'user' ? 'text-right' : 'text-left'}\`
                                },
                                    h('div', {
                                        className: \`inline-block max-w-xs p-3 rounded-lg \${
                                            msg.role === 'user' ? 'bg-blue-500 text-white' : 'bg-white shadow'
                                        }\`
                                    }, msg.content)
                                )
                            ),
                            chatLoading && h('div', { className: 'loader' })
                        ),
                        h('div', { className: 'flex gap-2' },
                            h('input', {
                                type: 'text',
                                className: 'flex-1 p-3 border rounded-lg',
                                placeholder: 'Pregunta sobre eficiencia energética...',
                                value: inputMessage,
                                onChange: (e) => setInputMessage(e.target.value),
                                onKeyPress: (e) => e.key === 'Enter' && sendMessage()
                            }),
                            h('button', {
                                onClick: sendMessage,
                                className: 'px-6 py-3 bg-blue-600 text-white rounded-lg'
                            }, h('i', { className: 'fas fa-paper-plane' }))
                        )
                    )
                )
            )
        )
    );
};

ReactDOM.render(React.createElement(EnergyCalculator), document.getElementById('root'));
`;
};