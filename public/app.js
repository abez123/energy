const { useState, useEffect, useRef } = React;

const EnergyCalculator = () => {
    // Estados para los inputs
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
    const [presets, setPresets] = useState({});
    const [selectedPreset, setSelectedPreset] = useState('bombas-ventiladores');
    const [calculating, setCalculating] = useState(false);
    
    // Estados para el chat
    const [messages, setMessages] = useState([
        { role: 'assistant', content: '¡Hola! Soy tu asistente experto en eficiencia energética. ¿En qué puedo ayudarte hoy?' }
    ]);
    const [inputMessage, setInputMessage] = useState('');
    const [chatLoading, setChatLoading] = useState(false);
    const chatContainerRef = useRef(null);

    // Cargar presets al iniciar
    useEffect(() => {
        loadPresets();
    }, []);

    // Scroll automático en el chat
    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages]);

    const loadPresets = async () => {
        try {
            const response = await fetch('/api/presets');
            const data = await response.json();
            setPresets(data);
            // Cargar el primer preset por defecto
            if (data['bombas-ventiladores']) {
                setInputs(data['bombas-ventiladores']);
            }
        } catch (error) {
            console.error('Error cargando presets:', error);
        }
    };

    const handlePresetChange = (presetKey) => {
        setSelectedPreset(presetKey);
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
            console.error('Error calculando:', error);
            alert('Error al calcular los ahorros');
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
            console.error('Error en chat:', error);
            setMessages(prev => [...prev, { 
                role: 'assistant', 
                content: 'Lo siento, hubo un error al procesar tu mensaje. Por favor, intenta de nuevo.' 
            }]);
        } finally {
            setChatLoading(false);
        }
    };

    const exportToPDF = async () => {
        if (!results) return;
        
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // Título
        doc.setFontSize(20);
        doc.setTextColor(102, 126, 234);
        doc.text('Reporte de Ahorro Energético', 20, 20);
        
        // Fecha
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Fecha: ${new Date().toLocaleDateString('es-ES')}`, 20, 30);
        
        // Parámetros de entrada
        doc.setFontSize(14);
        doc.setTextColor(0);
        doc.text('Parámetros de Entrada:', 20, 45);
        
        doc.setFontSize(10);
        let y = 55;
        doc.text(`Motores: ${inputs.motors}`, 25, y);
        doc.text(`HP por motor: ${inputs.hpPerMotor}`, 25, y + 7);
        doc.text(`Factor de carga: ${inputs.loadFactor}%`, 25, y + 14);
        doc.text(`Horas de operación/año: ${inputs.operationHours}`, 25, y + 21);
        doc.text(`Tarifa eléctrica: $${inputs.electricityRate}/kWh`, 25, y + 28);
        
        // Resultados
        doc.setFontSize(14);
        doc.text('Resultados del Análisis:', 20, y + 45);
        
        doc.setFontSize(10);
        y = y + 55;
        doc.text(`Consumo actual: ${results.currentConsumption.toFixed(0).toLocaleString()} kWh/año`, 25, y);
        doc.text(`Ahorro energético anual: $${results.energySavings.toFixed(0).toLocaleString()}`, 25, y + 7);
        doc.text(`Ahorro por paros evitados: $${results.stopSavings.toFixed(0).toLocaleString()}`, 25, y + 14);
        doc.text(`Ahorro en mantenimiento: $${results.maintenanceSavings.toFixed(0).toLocaleString()}`, 25, y + 21);
        
        doc.setFontSize(12);
        doc.setTextColor(102, 126, 234);
        doc.text(`Ahorro Total Anual: $${results.totalAnnualSavings.toFixed(0).toLocaleString()}`, 25, y + 35);
        doc.text(`ROI: ${results.annualROI.toFixed(1)}%`, 25, y + 42);
        doc.text(`Payback: ${results.paybackYears.toFixed(2)} años`, 25, y + 49);
        
        // Pie de página
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text('© 2025 GrupoABSA - Calculadora de Ahorro Energético', 20, 280);
        
        // Guardar PDF
        doc.save('reporte-ahorro-energetico.pdf');
    };

    const formatNumber = (num) => {
        return num.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    };

    return React.createElement('div', { className: 'min-h-screen bg-gray-50' },
        // Header
        React.createElement('header', { className: 'gradient-bg text-white py-8 px-4' },
            React.createElement('div', { className: 'max-w-7xl mx-auto' },
                React.createElement('div', { className: 'flex items-center justify-between' },
                    React.createElement('div', null,
                        React.createElement('h1', { className: 'text-3xl md:text-4xl font-bold mb-2' },
                            React.createElement('i', { className: 'fas fa-bolt mr-3' }),
                            'Simulador de Ahorro Energético'
                        ),
                        React.createElement('p', { className: 'text-lg opacity-90' },
                            'Drive + Reactor + Guardamotor'
                        )
                    ),
                    React.createElement('div', { className: 'text-right' },
                        React.createElement('p', { className: 'text-sm opacity-80' }, 'Powered by'),
                        React.createElement('p', { className: 'text-xl font-bold' }, '@GrupoABSA')
                    )
                ),
                React.createElement('div', { className: 'mt-4 bg-white/10 rounded-lg p-4' },
                    React.createElement('p', { className: 'text-sm md:text-base' },
                        React.createElement('i', { className: 'fas fa-info-circle mr-2' }),
                        'Deja de perder dinero en silencio. Descubre cómo transformar los costos ocultos de energía en ahorros medibles y un ROI claro.'
                    )
                )
            )
        ),

        React.createElement('div', { className: 'max-w-7xl mx-auto px-4 py-8' },
            React.createElement('div', { className: 'grid grid-cols-1 lg:grid-cols-3 gap-6' },
                // Panel de Entrada
                React.createElement('div', { className: 'lg:col-span-1' },
                    React.createElement('div', { className: 'bg-white rounded-lg shadow-lg p-6' },
                        React.createElement('h2', { className: 'text-xl font-bold mb-4 text-gray-800' },
                            React.createElement('i', { className: 'fas fa-sliders-h mr-2' }),
                            'Configuración'
                        ),

                        // Selector de Presets
                        React.createElement('div', { className: 'mb-4' },
                            React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-2' }, 'Preset'),
                            React.createElement('select', {
                                className: 'w-full p-2 border rounded-lg',
                                value: selectedPreset,
                                onChange: (e) => handlePresetChange(e.target.value)
                            },
                                React.createElement('option', { value: 'bombas-ventiladores' }, 'Bombas/Ventiladores'),
                                React.createElement('option', { value: 'transportadores' }, 'Transportadores'),
                                React.createElement('option', { value: 'carga-fija' }, 'Carga Fija')
                            )
                        ),

                        // Inputs
                        React.createElement('div', { className: 'space-y-3 max-h-96 overflow-y-auto pr-2' },
                            Object.entries({
                                motors: 'Motores (cantidad)',
                                hpPerMotor: 'HP por motor',
                                loadFactor: 'Factor de carga (%)',
                                operationHours: 'Horas de operación/año',
                                electricityRate: 'Tarifa eléctrica ($/kWh)',
                                driveSavings: 'Ahorro energético por Drive (%)',
                                avoidedStopHours: 'Horas de paro evitadas/año',
                                stopCostPerHour: 'Costo por hora de paro ($/h)',
                                currentMaintenance: 'Gasto mantenimiento actual ($/año)',
                                maintenanceReduction: 'Reducción de mantenimiento (%)',
                                packageCostPerMotor: 'Costo del paquete por motor ($)',
                                projectHorizon: 'Horizonte de proyecto (años)'
                            }).map(([field, label]) =>
                                React.createElement('div', { key: field },
                                    React.createElement('label', { className: 'block text-sm font-medium text-gray-700' }, label),
                                    React.createElement('input', {
                                        type: 'number',
                                        className: 'mt-1 w-full p-2 border rounded',
                                        value: inputs[field],
                                        onChange: (e) => handleInputChange(field, e.target.value),
                                        step: field === 'electricityRate' ? '0.1' : '1'
                                    }),
                                    field === 'hpPerMotor' && React.createElement('p', { className: 'text-xs text-gray-500 mt-1' },
                                        `= ${(inputs.hpPerMotor * 0.746).toFixed(2)} kW`
                                    )
                                )
                            )
                        ),

                        React.createElement('button', {
                            onClick: calculateSavings,
                            disabled: calculating,
                            className: 'w-full mt-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-lg font-semibold hover:opacity-90 transition disabled:opacity-50'
                        },
                            calculating ?
                                React.createElement('span', { className: 'flex items-center justify-center' },
                                    React.createElement('div', { className: 'loader mr-2' }),
                                    'Calculando...'
                                ) :
                                React.createElement('span', null,
                                    React.createElement('i', { className: 'fas fa-calculator mr-2' }),
                                    'Calcular Ahorros'
                                )
                        )
                    )
                ),

                // Panel de Resultados y Chat
                React.createElement('div', { className: 'lg:col-span-2' },
                    // Resultados
                    React.createElement('div', { className: 'bg-white rounded-lg shadow-lg p-6 mb-6' },
                        React.createElement('div', { className: 'flex justify-between items-center mb-4' },
                            React.createElement('h2', { className: 'text-xl font-bold text-gray-800' },
                                React.createElement('i', { className: 'fas fa-chart-line mr-2' }),
                                'Resultados del Simulador'
                            ),
                            results && React.createElement('button', {
                                onClick: exportToPDF,
                                className: 'px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition'
                            },
                                React.createElement('i', { className: 'fas fa-file-pdf mr-2' }),
                                'Exportar PDF'
                            )
                        ),

                        results ? React.createElement('div', null,
                            // Métricas de consumo actual
                            React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-2 gap-4 mb-6' },
                                React.createElement('div', { className: 'bg-gray-50 p-4 rounded-lg' },
                                    React.createElement('p', { className: 'text-sm text-gray-600' }, 'Consumo actual'),
                                    React.createElement('p', { className: 'text-2xl font-bold text-gray-800' },
                                        `${formatNumber(results.currentConsumption)} kWh/año`
                                    )
                                ),
                                React.createElement('div', { className: 'bg-gray-50 p-4 rounded-lg' },
                                    React.createElement('p', { className: 'text-sm text-gray-600' }, 'Costo de energía actual'),
                                    React.createElement('p', { className: 'text-2xl font-bold text-gray-800' },
                                        `$${formatNumber(results.currentEnergyCost)}/año`
                                    )
                                )
                            ),

                            // Métricas de ahorro
                            React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-3 gap-4 mb-6' },
                                React.createElement('div', { className: 'metric-card bg-green-50 p-4 rounded-lg border-l-4 border-green-500' },
                                    React.createElement('div', { className: 'flex items-center justify-between' },
                                        React.createElement('div', null,
                                            React.createElement('p', { className: 'text-sm text-green-700' },
                                                React.createElement('i', { className: 'fas fa-bolt mr-1' }),
                                                'Ahorro energético'
                                            ),
                                            React.createElement('p', { className: 'text-xl font-bold text-green-800' },
                                                `$${formatNumber(results.energySavings)}`
                                            ),
                                            React.createElement('p', { className: 'text-xs text-green-600' },
                                                `${inputs.driveSavings}% de eficiencia`
                                            )
                                        )
                                    )
                                ),
                                React.createElement('div', { className: 'metric-card bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500' },
                                    React.createElement('div', { className: 'flex items-center justify-between' },
                                        React.createElement('div', null,
                                            React.createElement('p', { className: 'text-sm text-blue-700' },
                                                React.createElement('i', { className: 'fas fa-tools mr-1' }),
                                                'Paros evitados'
                                            ),
                                            React.createElement('p', { className: 'text-xl font-bold text-blue-800' },
                                                `$${formatNumber(results.stopSavings)}`
                                            ),
                                            React.createElement('p', { className: 'text-xs text-blue-600' },
                                                `${inputs.avoidedStopHours} horas recuperadas`
                                            )
                                        )
                                    )
                                ),
                                React.createElement('div', { className: 'metric-card bg-purple-50 p-4 rounded-lg border-l-4 border-purple-500' },
                                    React.createElement('div', { className: 'flex items-center justify-between' },
                                        React.createElement('div', null,
                                            React.createElement('p', { className: 'text-sm text-purple-700' },
                                                React.createElement('i', { className: 'fas fa-wrench mr-1' }),
                                                'Mantenimiento'
                                            ),
                                            React.createElement('p', { className: 'text-xl font-bold text-purple-800' },
                                                `$${formatNumber(results.maintenanceSavings)}`
                                            ),
                                            React.createElement('p', { className: 'text-xs text-purple-600' },
                                                `${inputs.maintenanceReduction}% reducción`
                                            )
                                        )
                                    )
                                )
                            ),

                            // Métricas principales
                            React.createElement('div', { className: 'bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg p-6' },
                                React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4' },
                                    React.createElement('div', { className: 'text-center' },
                                        React.createElement('p', { className: 'text-sm opacity-90' }, 'Ahorro Total Anual'),
                                        React.createElement('p', { className: 'text-2xl font-bold' },
                                            `$${formatNumber(results.totalAnnualSavings)}`
                                        )
                                    ),
                                    React.createElement('div', { className: 'text-center' },
                                        React.createElement('p', { className: 'text-sm opacity-90' }, 'Inversión Total'),
                                        React.createElement('p', { className: 'text-2xl font-bold' },
                                            `$${formatNumber(results.totalInvestment)}`
                                        )
                                    ),
                                    React.createElement('div', { className: 'text-center' },
                                        React.createElement('p', { className: 'text-sm opacity-90' }, 'Payback'),
                                        React.createElement('p', { className: 'text-2xl font-bold' },
                                            `${results.paybackYears.toFixed(2)} años`
                                        )
                                    ),
                                    React.createElement('div', { className: 'text-center' },
                                        React.createElement('p', { className: 'text-sm opacity-90' }, 'ROI Anual'),
                                        React.createElement('p', { className: 'text-2xl font-bold' },
                                            `${results.annualROI.toFixed(1)}%`
                                        )
                                    )
                                ),
                                
                                React.createElement('div', { className: 'mt-4 pt-4 border-t border-white/30 text-center' },
                                    React.createElement('p', { className: 'text-sm opacity-90' },
                                        React.createElement('i', { className: 'fas fa-lock mr-1' }),
                                        `Ahorro acumulado en ${inputs.projectHorizon} años`
                                    ),
                                    React.createElement('p', { className: 'text-3xl font-bold' },
                                        `$${formatNumber(results.accumulatedSavings)}`
                                    )
                                )
                            )
                        ) : React.createElement('div', { className: 'text-center py-12 text-gray-500' },
                            React.createElement('i', { className: 'fas fa-chart-area text-6xl mb-4 opacity-30' }),
                            React.createElement('p', null, 'Configura los parámetros y haz clic en "Calcular Ahorros"'),
                            React.createElement('p', { className: 'text-sm mt-2' }, 'Los resultados aparecerán aquí')
                        )
                    ),

                    // Chat con IA
                    React.createElement('div', { className: 'bg-white rounded-lg shadow-lg p-6' },
                        React.createElement('h2', { className: 'text-xl font-bold mb-4 text-gray-800' },
                            React.createElement('i', { className: 'fas fa-robot mr-2' }),
                            'Asistente IA - Experto en Eficiencia Energética'
                        ),
                        
                        React.createElement('div', {
                            ref: chatContainerRef,
                            className: 'chat-container bg-gray-50 rounded-lg p-4 mb-4'
                        },
                            messages.map((msg, index) =>
                                React.createElement('div', {
                                    key: index,
                                    className: `chat-message mb-3 ${msg.role === 'user' ? 'text-right' : 'text-left'}`
                                },
                                    React.createElement('div', {
                                        className: `inline-block max-w-3/4 p-3 rounded-lg ${
                                            msg.role === 'user'
                                                ? 'bg-blue-500 text-white'
                                                : 'bg-white text-gray-800 shadow'
                                        }`
                                    }, msg.content)
                                )
                            ),
                            chatLoading && React.createElement('div', { className: 'text-left' },
                                React.createElement('div', { className: 'inline-block bg-white p-3 rounded-lg shadow' },
                                    React.createElement('div', { className: 'loader' })
                                )
                            )
                        ),
                        
                        React.createElement('div', { className: 'flex gap-2' },
                            React.createElement('input', {
                                type: 'text',
                                className: 'flex-1 p-3 border rounded-lg',
                                placeholder: 'Pregunta sobre eficiencia energética, ROI, mejores prácticas...',
                                value: inputMessage,
                                onChange: (e) => setInputMessage(e.target.value),
                                onKeyPress: (e) => e.key === 'Enter' && sendMessage(),
                                disabled: chatLoading
                            }),
                            React.createElement('button', {
                                onClick: sendMessage,
                                disabled: chatLoading || !inputMessage.trim(),
                                className: 'px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:opacity-90 transition disabled:opacity-50'
                            },
                                React.createElement('i', { className: 'fas fa-paper-plane' })
                            )
                        ),
                        
                        React.createElement('div', { className: 'mt-3 text-xs text-gray-500' },
                            React.createElement('i', { className: 'fas fa-info-circle mr-1' }),
                            'Pregúntame sobre optimización energética, análisis de ROI, o recomendaciones específicas para tu industria.'
                        )
                    )
                )
            )
        ),

        // Footer
        React.createElement('footer', { className: 'bg-gray-800 text-white py-6 mt-12' },
            React.createElement('div', { className: 'max-w-7xl mx-auto px-4 text-center' },
                React.createElement('p', { className: 'mb-2' },
                    '© 2025 — Simulador de ahorros hecho para acelerar decisiones con datos.'
                ),
                React.createElement('p', { className: 'text-sm opacity-70' },
                    React.createElement('i', { className: 'fas fa-industry mr-2' }),
                    '@GrupoABSA - Transformando la eficiencia energética industrial'
                )
            )
        )
    );
};

// Renderizar la aplicación
ReactDOM.render(React.createElement(EnergyCalculator), document.getElementById('root'));