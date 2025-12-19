export const getAppJs = () => {
  return `
// Energy Calculator with Load Profile - React Application
const { useState, useEffect } = React;
const { createElement: h } = React;

const LoadProfileCalculator = () => {
    // Inputs del formulario (basado en el Excel)
    const [inputs, setInputs] = useState({
        cantidadMotores: 1,
        hp: 100,
        eficiencia: 100, // Se muestra como %, se envía como decimal
        voltaje: 460,
        horasAnio: 5000,
        costoKwhUsd: 0.12,
        inversionDriveInstalacion: 16000
    });

    // Load Profile (10 puntos de 100% a 10%)
    const [loadProfile, setLoadProfile] = useState([
        { flow: 100, timePercent: 0 },
        { flow: 90, timePercent: 0 },
        { flow: 80, timePercent: 80 },
        { flow: 70, timePercent: 0 },
        { flow: 60, timePercent: 20 },
        { flow: 50, timePercent: 0 },
        { flow: 40, timePercent: 0 },
        { flow: 30, timePercent: 0 },
        { flow: 20, timePercent: 0 },
        { flow: 10, timePercent: 0 }
    ]);

    const [results, setResults] = useState(null);
    const [calculating, setCalculating] = useState(false);
    const [selectedPreset, setSelectedPreset] = useState('');
    const [presets, setPresets] = useState(null);
    const [validationError, setValidationError] = useState('');
    
    // Productos Rockwell
    const [showProducts, setShowProducts] = useState(false);
    const [productsLoading, setProductsLoading] = useState(false);
    const [products, setProducts] = useState([]);
    const [packageData, setPackageData] = useState(null);
    
    // Chatbot
    const [messages, setMessages] = useState([
        { role: 'assistant', content: '¡Hola! Soy tu asistente experto en eficiencia energética con VFDs. ¿En qué puedo ayudarte?' }
    ]);
    const [inputMessage, setInputMessage] = useState('');
    const [chatLoading, setChatLoading] = useState(false);

    useEffect(() => {
        loadPresets();
    }, []);

    // Cargar perfiles predefinidos
    const loadPresets = async () => {
        try {
            const response = await fetch('/api/load-profile-presets');
            const data = await response.json();
            setPresets(data.presets);
        } catch (error) {
            console.error('Error loading presets:', error);
        }
    };

    // Aplicar preset al perfil de carga
    const handlePresetChange = (presetKey) => {
        setSelectedPreset(presetKey);
        if (presets && presets[presetKey]) {
            const presetProfile = presets[presetKey];
            setLoadProfile(presetProfile.map(p => ({
                flow: p.flow * 100,
                timePercent: p.timePercent * 100
            })));
        }
    };

    // Cambiar input
    const handleInputChange = (field, value) => {
        setInputs(prev => ({
            ...prev,
            [field]: parseFloat(value) || 0
        }));
    };

    // Cambiar punto del load profile
    const handleLoadProfileChange = (index, field, value) => {
        const newProfile = [...loadProfile];
        newProfile[index][field] = parseFloat(value) || 0;
        setLoadProfile(newProfile);
        
        // Validar suma de tiempos
        validateProfile(newProfile);
    };

    // Validar que la suma de tiempos sea 100%
    const validateProfile = (profile) => {
        const total = profile.reduce((sum, point) => sum + point.timePercent, 0);
        
        if (Math.abs(total - 100) > 0.1) {
            setValidationError(\`⚠️ La suma de tiempos debe ser 100%. Actual: \${total.toFixed(1)}%\`);
            return false;
        } else {
            setValidationError('');
            return true;
        }
    };

    // Calcular ahorros
    const calculateSavings = async () => {
        // Validar antes de enviar
        if (!validateProfile(loadProfile)) {
            return;
        }

        setCalculating(true);
        try {
            // Convertir a formato de API (decimales)
            const apiLoadProfile = loadProfile.map(p => ({
                flow: p.flow / 100,
                timePercent: p.timePercent / 100
            }));

            const requestBody = {
                cantidadMotores: inputs.cantidadMotores,
                hp: inputs.hp,
                eficiencia: inputs.eficiencia / 100, // Convertir % a decimal
                voltaje: inputs.voltaje,
                horasAnio: inputs.horasAnio,
                costoKwhUsd: inputs.costoKwhUsd,
                inversionDriveInstalacion: inputs.inversionDriveInstalacion,
                loadProfile: apiLoadProfile
            };

            const response = await fetch('/api/calculate-load-profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)
            });
            const data = await response.json();
            setResults(data);
            
            // Auto-cargar productos recomendados
            if (data) {
                loadProductRecommendations();
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error al calcular. Por favor verifica los datos.');
        } finally {
            setCalculating(false);
        }
    };

    // Cargar recomendaciones de productos
    const loadProductRecommendations = async () => {
        setShowProducts(true);
        setProductsLoading(true);
        
        try {
            const response = await fetch('/api/products/recommendations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    motors: inputs.cantidadMotores, 
                    hpPerMotor: inputs.hp 
                })
            });
            const data = await response.json();
            setProducts(data.recommendations || []);
            
            // Calcular precio del paquete
            if (data.recommendations && data.recommendations.length > 0) {
                const skus = data.recommendations.map(r => r.product.sku);
                const priceResponse = await fetch('/api/products/package-price', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ skus, motors: inputs.cantidadMotores })
                });
                const priceData = await priceResponse.json();
                setPackageData(priceData);
                
                // Actualizar inversión con el precio calculado
                if (priceData.total > 0) {
                    setInputs(prev => ({
                        ...prev,
                        inversionDriveInstalacion: priceData.total
                    }));
                }
            }
        } catch (error) {
            console.error('Error loading products:', error);
        } finally {
            setProductsLoading(false);
        }
    };

    // Exportar PDF
    const exportToPDF = async () => {
        if (!results) return;
        
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        
        // Encabezado con logo
        doc.setFillColor(0, 51, 102);
        doc.rect(0, 0, pageWidth, 35, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        doc.setFont(undefined, 'bold');
        doc.text('GRUPO ABSA', pageWidth / 2, 15, { align: 'center' });
        doc.setFontSize(14);
        doc.setFont(undefined, 'normal');
        doc.text('Calculadora de Ahorro Energético con VFD', pageWidth / 2, 25, { align: 'center' });
        
        let yPos = 45;
        
        // Datos del motor
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text('DATOS DEL MOTOR', 15, yPos);
        yPos += 8;
        
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        doc.text(\`Cantidad de Motores: \${inputs.cantidadMotores}\`, 15, yPos);
        yPos += 6;
        doc.text(\`Potencia: \${inputs.hp} HP (\${results.kw.toFixed(2)} kW)\`, 15, yPos);
        yPos += 6;
        doc.text(\`Eficiencia: \${inputs.eficiencia}%\`, 15, yPos);
        yPos += 6;
        doc.text(\`Voltaje: \${inputs.voltaje}V\`, 15, yPos);
        yPos += 10;
        
        // Datos operacionales
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text('DATOS OPERACIONALES', 15, yPos);
        yPos += 8;
        
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        doc.text(\`Horas de operación: \${inputs.horasAnio.toLocaleString('es-ES')} horas/año\`, 15, yPos);
        yPos += 6;
        doc.text(\`Costo energía: $\${inputs.costoKwhUsd}/kWh\`, 15, yPos);
        yPos += 6;
        doc.text(\`Inversión: $\${inputs.inversionDriveInstalacion.toLocaleString('es-ES')} USD\`, 15, yPos);
        yPos += 10;
        
        // Resultados
        doc.setFillColor(0, 102, 204);
        doc.rect(10, yPos, pageWidth - 20, 8, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text('RESULTADOS', 15, yPos + 6);
        yPos += 15;
        
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        
        // A Tensión Plena
        doc.setFont(undefined, 'bold');
        doc.text('A TENSIÓN PLENA (Sin VFD):', 15, yPos);
        yPos += 6;
        doc.setFont(undefined, 'normal');
        doc.text(\`Consumo: \${results.consumoPlenaKwh.toLocaleString('es-ES')} kWh/año\`, 20, yPos);
        yPos += 6;
        doc.text(\`Costo: $\${results.consumoPlenaUsd.toLocaleString('es-ES')} USD/año\`, 20, yPos);
        yPos += 10;
        
        // Con VFD
        doc.setFont(undefined, 'bold');
        doc.text('CON VARIADOR DE FRECUENCIA:', 15, yPos);
        yPos += 6;
        doc.setFont(undefined, 'normal');
        doc.text(\`Consumo: \${results.consumoVfdKwh.toLocaleString('es-ES')} kWh/año\`, 20, yPos);
        yPos += 6;
        doc.text(\`Costo: $\${results.consumoVfdUsd.toLocaleString('es-ES')} USD/año\`, 20, yPos);
        yPos += 10;
        
        // Ahorros
        doc.setFillColor(34, 197, 94);
        doc.rect(10, yPos, pageWidth - 20, 8, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont(undefined, 'bold');
        doc.text('AHORROS', 15, yPos + 6);
        yPos += 15;
        
        doc.setTextColor(0, 0, 0);
        doc.setFont(undefined, 'normal');
        doc.text(\`Ahorro Energético: \${results.ahorroKwh.toLocaleString('es-ES')} kWh/año\`, 15, yPos);
        yPos += 6;
        doc.text(\`Ahorro Económico: $\${results.ahorroUsd.toLocaleString('es-ES')} USD/año\`, 15, yPos);
        yPos += 10;
        
        // ROI
        doc.setFillColor(59, 130, 246);
        doc.rect(10, yPos, pageWidth - 20, 8, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont(undefined, 'bold');
        doc.text('RETORNO DE INVERSIÓN', 15, yPos + 6);
        yPos += 15;
        
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(12);
        doc.text(\`ROI: \${results.roiAnios.toFixed(2)} años (\${results.roiMeses.toFixed(1)} meses)\`, 15, yPos);
        
        // Footer
        doc.setFontSize(8);
        doc.setTextColor(128, 128, 128);
        doc.text('Generado por GrupoABSA - Calculadora de Ahorro Energético', pageWidth / 2, 285, { align: 'center' });
        doc.text(new Date().toLocaleDateString('es-ES'), pageWidth / 2, 290, { align: 'center' });
        
        // Guardar
        doc.save(\`ahorro-energetico-vfd-\${inputs.hp}hp.pdf\`);
    };

    // Enviar mensaje al chatbot
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
            setMessages(prev => [...prev, { 
                role: 'assistant', 
                content: 'Lo siento, hubo un error. Por favor intenta de nuevo.' 
            }]);
        } finally {
            setChatLoading(false);
        }
    };

    // Calcular suma total de tiempos
    const getTotalTime = () => {
        return loadProfile.reduce((sum, point) => sum + point.timePercent, 0);
    };

    return h('div', { className: 'min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-8' },
        // Header
        h('div', { className: 'max-w-7xl mx-auto mb-8' },
            h('div', { className: 'bg-white rounded-lg shadow-lg p-4 md:p-6' },
                h('div', { className: 'flex flex-col md:flex-row items-center justify-between gap-4' },
                    h('div', { className: 'flex items-center gap-4' },
                        h('img', { 
                            src: 'https://grupoabsacdn-1521b.kxcdn.com/web/image/res.company/1/logo?unique=77c3fa7',
                            alt: 'GrupoABSA',
                            className: 'h-12 md:h-16'
                        }),
                        h('div', null,
                            h('h1', { className: 'text-2xl md:text-3xl font-bold text-gray-800' }, 
                                'Calculadora de Ahorro Energético con VFD'
                            ),
                            h('p', { className: 'text-sm md:text-base text-gray-600' }, 
                                'Calculadora Profesional con Ciclo de Operación'
                            )
                        )
                    )
                )
            )
        ),

        // Main Content
        h('div', { className: 'max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6' },
            // Left Column - Inputs
            h('div', { className: 'lg:col-span-2 space-y-6' },
                // Datos del Motor
                h('div', { className: 'bg-white rounded-lg shadow-lg p-6' },
                    h('h2', { className: 'text-xl font-bold text-gray-800 mb-4 flex items-center gap-2' },
                        h('i', { className: 'fas fa-cog text-blue-600' }),
                        'Datos del Motor'
                    ),
                    h('div', { className: 'grid grid-cols-1 md:grid-cols-2 gap-4' },
                        // Cantidad Motores
                        h('div', null,
                            h('label', { className: 'block text-sm font-medium text-gray-700 mb-2' }, 
                                'Cantidad de Motores'
                            ),
                            h('input', {
                                type: 'number',
                                value: inputs.cantidadMotores,
                                onChange: (e) => handleInputChange('cantidadMotores', e.target.value),
                                className: 'w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500',
                                min: 1
                            })
                        ),
                        // HP
                        h('div', null,
                            h('label', { className: 'block text-sm font-medium text-gray-700 mb-2' }, 
                                'Potencia (HP)'
                            ),
                            h('input', {
                                type: 'number',
                                value: inputs.hp,
                                onChange: (e) => handleInputChange('hp', e.target.value),
                                className: 'w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500',
                                min: 0,
                                step: 0.1
                            })
                        ),
                        // Eficiencia
                        h('div', null,
                            h('label', { className: 'block text-sm font-medium text-gray-700 mb-2' }, 
                                'Eficiencia (%)'
                            ),
                            h('input', {
                                type: 'number',
                                value: inputs.eficiencia,
                                onChange: (e) => handleInputChange('eficiencia', e.target.value),
                                className: 'w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500',
                                min: 0,
                                max: 100,
                                step: 0.1
                            })
                        ),
                        // Voltaje
                        h('div', null,
                            h('label', { className: 'block text-sm font-medium text-gray-700 mb-2' }, 
                                'Voltaje (V)'
                            ),
                            h('input', {
                                type: 'number',
                                value: inputs.voltaje,
                                onChange: (e) => handleInputChange('voltaje', e.target.value),
                                className: 'w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500',
                                min: 0
                            })
                        )
                    )
                ),

                // Datos Operacionales
                h('div', { className: 'bg-white rounded-lg shadow-lg p-6' },
                    h('h2', { className: 'text-xl font-bold text-gray-800 mb-4 flex items-center gap-2' },
                        h('i', { className: 'fas fa-clock text-green-600' }),
                        'Datos Operacionales'
                    ),
                    h('div', { className: 'grid grid-cols-1 md:grid-cols-3 gap-4' },
                        // Horas x Año
                        h('div', null,
                            h('label', { className: 'block text-sm font-medium text-gray-700 mb-2' }, 
                                'Horas x Año'
                            ),
                            h('input', {
                                type: 'number',
                                value: inputs.horasAnio,
                                onChange: (e) => handleInputChange('horasAnio', e.target.value),
                                className: 'w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500',
                                min: 0
                            })
                        ),
                        // Costo kWh
                        h('div', null,
                            h('label', { className: 'block text-sm font-medium text-gray-700 mb-2' }, 
                                'Costo KW/Hr (USD)'
                            ),
                            h('input', {
                                type: 'number',
                                value: inputs.costoKwhUsd,
                                onChange: (e) => handleInputChange('costoKwhUsd', e.target.value),
                                className: 'w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500',
                                min: 0,
                                step: 0.01
                            })
                        ),
                        // Inversión
                        h('div', null,
                            h('label', { className: 'block text-sm font-medium text-gray-700 mb-2' }, 
                                'Inversión: Drive + Instalación (USD)'
                            ),
                            h('input', {
                                type: 'number',
                                value: inputs.inversionDriveInstalacion,
                                onChange: (e) => handleInputChange('inversionDriveInstalacion', e.target.value),
                                className: 'w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500',
                                min: 0
                            })
                        )
                    )
                ),

                // Ciclo de Operación
                h('div', { className: 'bg-white rounded-lg shadow-lg p-6' },
                    h('div', { className: 'flex items-center justify-between mb-4' },
                        h('h2', { className: 'text-xl font-bold text-gray-800 flex items-center gap-2' },
                            h('i', { className: 'fas fa-chart-line text-purple-600' }),
                            'Ciclo de Operación'
                        ),
                        // Selector de preset
                        h('select', {
                            value: selectedPreset,
                            onChange: (e) => handlePresetChange(e.target.value),
                            className: 'px-4 py-2 border border-gray-300 rounded-lg text-sm'
                        },
                            h('option', { value: '' }, 'Cargar Perfil...'),
                            h('option', { value: 'bombas-caudal-variable' }, 'Bombas Caudal Variable'),
                            h('option', { value: 'ventiladores-variable' }, 'Ventiladores Variable'),
                            h('option', { value: 'carga-constante' }, 'Carga Constante')
                        )
                    ),
                    
                    // Tabla de perfil de carga
                    h('div', { className: 'overflow-x-auto' },
                        h('table', { className: 'w-full text-sm' },
                            h('thead', { className: 'bg-gray-100' },
                                h('tr', null,
                                    h('th', { className: 'px-4 py-2 text-left' }, 'Flujo (%)'),
                                    h('th', { className: 'px-4 py-2 text-left' }, 'Tiempo (%)')
                                )
                            ),
                            h('tbody', null,
                                ...loadProfile.map((point, index) =>
                                    h('tr', { 
                                        key: index,
                                        className: index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                                    },
                                        h('td', { className: 'px-4 py-2' },
                                            h('div', { className: 'flex items-center gap-2' },
                                                h('span', { className: 'font-medium' }, \`\${point.flow}%\`)
                                            )
                                        ),
                                        h('td', { className: 'px-4 py-2' },
                                            h('input', {
                                                type: 'number',
                                                value: point.timePercent,
                                                onChange: (e) => handleLoadProfileChange(index, 'timePercent', e.target.value),
                                                className: 'w-full px-2 py-1 border border-gray-300 rounded',
                                                min: 0,
                                                max: 100,
                                                step: 0.1
                                            })
                                        )
                                    )
                                ),
                                // Fila de total
                                h('tr', { className: 'bg-blue-100 font-bold' },
                                    h('td', { className: 'px-4 py-2' }, 'Total:'),
                                    h('td', { className: 'px-4 py-2' },
                                        h('span', { 
                                            className: Math.abs(getTotalTime() - 100) < 0.1 
                                                ? 'text-green-600' 
                                                : 'text-red-600'
                                        }, \`\${getTotalTime().toFixed(1)}%\`)
                                    )
                                )
                            )
                        )
                    ),
                    
                    // Mensaje de validación
                    validationError && h('div', { 
                        className: 'mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm'
                    }, validationError),
                    
                    // Botón calcular
                    h('button', {
                        onClick: calculateSavings,
                        disabled: calculating || validationError,
                        className: \`mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2 \${
                            (calculating || validationError) ? 'opacity-50 cursor-not-allowed' : ''
                        }\`
                    },
                        h('i', { className: 'fas fa-calculator' }),
                        calculating ? 'Calculando...' : 'Calcular Ahorros'
                    )
                ),

                // Resultados
                results && h('div', { className: 'bg-white rounded-lg shadow-lg p-6' },
                    h('div', { className: 'flex items-center justify-between mb-6' },
                        h('h2', { className: 'text-xl font-bold text-gray-800 flex items-center gap-2' },
                            h('i', { className: 'fas fa-chart-bar text-green-600' }),
                            'Resultados'
                        ),
                        h('button', {
                            onClick: exportToPDF,
                            className: 'bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2'
                        },
                            h('i', { className: 'fas fa-file-pdf' }),
                            'Exportar PDF'
                        )
                    ),
                    
                    // KW del motor
                    h('div', { className: 'mb-6 p-4 bg-blue-50 rounded-lg' },
                        h('p', { className: 'text-sm text-gray-600' }, 'Potencia del Motor'),
                        h('p', { className: 'text-2xl font-bold text-blue-600' }, 
                            \`\${results.kw.toFixed(2)} kW\`
                        )
                    ),
                    
                    // Métricas principales en grid
                    h('div', { className: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6' },
                        // Consumo Plena
                        h('div', { className: 'bg-red-50 p-4 rounded-lg' },
                            h('p', { className: 'text-xs text-gray-600 mb-1' }, 'Consumo sin VFD'),
                            h('p', { className: 'text-lg font-bold text-red-600' }, 
                                \`\${results.consumoPlenaKwh.toLocaleString('es-ES')} kWh\`
                            ),
                            h('p', { className: 'text-sm text-gray-700' }, 
                                \`$\${results.consumoPlenaUsd.toLocaleString('es-ES')}\`
                            )
                        ),
                        // Consumo VFD
                        h('div', { className: 'bg-green-50 p-4 rounded-lg' },
                            h('p', { className: 'text-xs text-gray-600 mb-1' }, 'Consumo con VFD'),
                            h('p', { className: 'text-lg font-bold text-green-600' }, 
                                \`\${results.consumoVfdKwh.toLocaleString('es-ES')} kWh\`
                            ),
                            h('p', { className: 'text-sm text-gray-700' }, 
                                \`$\${results.consumoVfdUsd.toLocaleString('es-ES')}\`
                            )
                        ),
                        // Ahorro
                        h('div', { className: 'bg-yellow-50 p-4 rounded-lg' },
                            h('p', { className: 'text-xs text-gray-600 mb-1' }, 'Ahorro Anual'),
                            h('p', { className: 'text-lg font-bold text-yellow-600' }, 
                                \`\${results.ahorroKwh.toLocaleString('es-ES')} kWh\`
                            ),
                            h('p', { className: 'text-sm text-gray-700' }, 
                                \`$\${results.ahorroUsd.toLocaleString('es-ES')}\`
                            )
                        ),
                        // ROI
                        h('div', { className: 'bg-purple-50 p-4 rounded-lg' },
                            h('p', { className: 'text-xs text-gray-600 mb-1' }, 'ROI'),
                            h('p', { className: 'text-lg font-bold text-purple-600' }, 
                                \`\${results.roiAnios.toFixed(2)} años\`
                            ),
                            h('p', { className: 'text-sm text-gray-700' }, 
                                \`(\${results.roiMeses.toFixed(1)} meses)\`
                            )
                        )
                    )
                ),

                // Productos Rockwell recomendados
                showProducts && h('div', { className: 'bg-white rounded-lg shadow-lg p-6' },
                    h('h2', { className: 'text-xl font-bold text-gray-800 mb-4 flex items-center gap-2' },
                        h('i', { className: 'fas fa-shopping-cart text-orange-600' }),
                        'Productos Rockwell Automation Recomendados'
                    ),
                    productsLoading ? h('div', { className: 'text-center py-8' },
                        h('i', { className: 'fas fa-spinner fa-spin text-3xl text-blue-600' })
                    ) : products.length > 0 ? h('div', { className: 'space-y-4' },
                        ...products.map((rec, idx) =>
                            h('div', { 
                                key: idx,
                                className: 'border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow'
                            },
                                h('div', { className: 'flex gap-4 items-start' },
                                    // Imagen del producto
                                    rec.product.imageUrl && h('div', { className: 'flex-shrink-0' },
                                        h('img', {
                                            src: rec.product.imageUrl,
                                            alt: rec.product.name,
                                            className: 'w-24 h-24 object-contain rounded border border-gray-200',
                                            onError: (e) => {
                                                e.target.style.display = 'none';
                                            }
                                        })
                                    ),
                                    // Información del producto
                                    h('div', { className: 'flex-1' },
                                        h('h3', { className: 'font-bold text-lg text-gray-800' }, 
                                            rec.product.name
                                        ),
                                        h('p', { className: 'text-sm text-gray-600' }, 
                                            \`SKU: \${rec.product.sku}\`
                                        ),
                                        rec.product.specifications && h('div', { className: 'mt-2 text-sm text-gray-700' },
                                            Object.entries(rec.product.specifications).map(([key, value]) =>
                                                h('span', { key, className: 'inline-block mr-3' },
                                                    \`\${key}: \${value}\`
                                                )
                                            )
                                        )
                                    ),
                                    // Precio
                                    h('div', { className: 'text-right flex-shrink-0' },
                                        h('p', { className: 'text-2xl font-bold text-green-600' }, 
                                            \`$\${rec.product.price.toLocaleString('es-ES')}\`
                                        ),
                                        h('p', { className: 'text-xs text-gray-500 mt-1' }, 
                                            'USD'
                                        )
                                    )
                                ),
                                h('div', { className: 'mt-3 pt-3 border-t border-gray-200' },
                                    h('p', { className: 'text-sm text-blue-600 font-medium' }, rec.reason),
                                    rec.savings && h('p', { className: 'text-sm text-green-600' },
                                        \`Ahorro estimado: $\${rec.savings.toLocaleString('es-ES')}/año\`
                                    )
                                ),
                                rec.product.url_aol && h('a', {
                                    href: rec.product.url_aol,
                                    target: '_blank',
                                    rel: 'noopener noreferrer',
                                    className: 'mt-3 inline-block text-sm text-blue-600 hover:text-blue-800'
                                },
                                    'Ver en Tienda →'
                                )
                            )
                        ),
                        // Resumen del paquete
                        packageData && h('div', { className: 'mt-6 p-4 bg-blue-50 rounded-lg' },
                            h('h3', { className: 'font-bold text-lg text-gray-800 mb-3' }, 
                                'Paquete Completo'
                            ),
                            h('div', { className: 'space-y-1 text-sm' },
                                ...packageData.items.map((item, idx) =>
                                    h('div', { key: idx, className: 'flex justify-between' },
                                        h('span', null, item.name),
                                        h('span', { className: 'font-medium' }, 
                                            \`$\${item.price.toLocaleString('es-ES')}\`
                                        )
                                    )
                                )
                            ),
                            h('div', { className: 'mt-3 pt-3 border-t border-blue-200 flex justify-between items-center' },
                                h('span', { className: 'font-bold text-lg' }, 'Total:'),
                                h('span', { className: 'font-bold text-2xl text-blue-600' },
                                    \`$\${packageData.total.toLocaleString('es-ES')} \${packageData.currency}\`
                                )
                            )
                        )
                    ) : h('p', { className: 'text-gray-600 text-center py-4' },
                        'No se encontraron productos recomendados.'
                    )
                )
            ),

            // Right Column - Chatbot
            h('div', { className: 'lg:col-span-1' },
                h('div', { className: 'bg-white rounded-lg shadow-lg p-6 sticky top-4' },
                    h('h2', { className: 'text-xl font-bold text-gray-800 mb-4 flex items-center gap-2' },
                        h('i', { className: 'fas fa-robot text-blue-600' }),
                        'Asistente IA'
                    ),
                    
                    // Chat messages
                    h('div', { className: 'chat-container mb-4', style: { height: '400px', overflowY: 'auto' } },
                        messages.map((msg, idx) =>
                            h('div', {
                                key: idx,
                                className: \`mb-3 p-3 rounded-lg \${
                                    msg.role === 'user' 
                                        ? 'bg-blue-100 ml-4' 
                                        : 'bg-gray-100 mr-4'
                                }\`
                            },
                                h('p', { className: 'text-sm whitespace-pre-wrap' }, msg.content)
                            )
                        ),
                        chatLoading && h('div', { className: 'text-center py-2' },
                            h('i', { className: 'fas fa-spinner fa-spin text-blue-600' })
                        )
                    ),
                    
                    // Chat input
                    h('div', { className: 'flex gap-2' },
                        h('input', {
                            type: 'text',
                            value: inputMessage,
                            onChange: (e) => setInputMessage(e.target.value),
                            onKeyPress: (e) => e.key === 'Enter' && sendMessage(),
                            placeholder: 'Escribe tu pregunta...',
                            className: 'flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500',
                            disabled: chatLoading
                        }),
                        h('button', {
                            onClick: sendMessage,
                            disabled: chatLoading || !inputMessage.trim(),
                            className: \`bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg \${
                                (chatLoading || !inputMessage.trim()) ? 'opacity-50 cursor-not-allowed' : ''
                            }\`
                        },
                            h('i', { className: 'fas fa-paper-plane' })
                        )
                    )
                )
            )
        )
    );
};

// Render
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(h(LoadProfileCalculator));
`;
};
