// Componente UI para mostrar productos Rockwell
export const getProductsUI = () => `
<div id="products-section" class="mt-6 hidden">
    <div class="bg-white rounded-lg shadow-lg p-6">
        <h2 class="text-xl font-bold mb-4 text-gray-800">
            <i class="fas fa-shopping-cart mr-2"></i>
            Productos Rockwell Automation Recomendados
        </h2>
        
        <div class="mb-4 bg-blue-50 border-l-4 border-blue-500 p-3">
            <p class="text-sm text-blue-800">
                <i class="fas fa-info-circle mr-2"></i>
                Basado en tu configuración, estos productos Rockwell te darán los mejores resultados
            </p>
        </div>

        <div id="products-loading" class="text-center py-8 hidden">
            <div class="loader mx-auto mb-2"></div>
            <p class="text-gray-600">Buscando productos recomendados...</p>
        </div>

        <div id="products-list" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <!-- Los productos se cargarán aquí dinámicamente -->
        </div>

        <div id="package-summary" class="mt-6 bg-gray-50 rounded-lg p-4 hidden">
            <h3 class="font-bold text-lg mb-3">
                <i class="fas fa-box mr-2"></i>
                Resumen del Paquete Completo
            </h3>
            <div id="package-items" class="space-y-2 mb-4">
                <!-- Items del paquete -->
            </div>
            <div class="border-t pt-3">
                <div class="flex justify-between items-center">
                    <span class="text-lg font-semibold">Total del Paquete:</span>
                    <span id="package-total" class="text-2xl font-bold text-green-600">$0</span>
                </div>
                <p class="text-xs text-gray-500 mt-1">
                    * Precios sujetos a disponibilidad. Contacta a tu distribuidor autorizado Rockwell.
                </p>
            </div>
        </div>
    </div>
</div>

<script>
async function loadProductRecommendations(motors, hpPerMotor) {
    const productsSection = document.getElementById('products-section');
    const productsList = document.getElementById('products-list');
    const loadingDiv = document.getElementById('products-loading');
    const packageSummary = document.getElementById('package-summary');
    
    // Mostrar sección y loading
    productsSection.classList.remove('hidden');
    loadingDiv.classList.remove('hidden');
    productsList.innerHTML = '';
    
    try {
        // Obtener recomendaciones
        const response = await fetch('/api/products/recommendations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ motors, hpPerMotor })
        });
        
        const data = await response.json();
        const recommendations = data.recommendations || [];
        
        if (recommendations.length === 0) {
            productsList.innerHTML = '<p class="col-span-3 text-center text-gray-500">No se encontraron productos para esta configuración</p>';
            loadingDiv.classList.add('hidden');
            return;
        }
        
        // Mostrar productos
        const skus = [];
        recommendations.forEach(rec => {
            const product = rec.product;
            skus.push(product.sku);
            
            const productCard = document.createElement('div');
            productCard.className = 'bg-white border rounded-lg p-4 hover:shadow-lg transition';
            productCard.innerHTML = \`
                <div class="mb-2">
                    <span class="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                        \${product.category}
                    </span>
                    \${product.inStock ? 
                        '<span class="inline-block px-2 py-1 text-xs bg-green-100 text-green-800 rounded ml-1">En Stock</span>' : 
                        '<span class="inline-block px-2 py-1 text-xs bg-red-100 text-red-800 rounded ml-1">Agotado</span>'
                    }
                </div>
                <h4 class="font-bold text-sm mb-1">\${product.name}</h4>
                <p class="text-xs text-gray-600 mb-2">SKU: \${product.sku}</p>
                <p class="text-xs text-gray-700 mb-3">\${product.description}</p>
                
                \${product.specifications ? \`
                <div class="text-xs bg-gray-50 rounded p-2 mb-3">
                    \${product.specifications.power ? \`<div>⚡ \${product.specifications.power}</div>\` : ''}
                    \${product.specifications.voltage ? \`<div>🔌 \${product.specifications.voltage}</div>\` : ''}
                    \${product.specifications.current ? \`<div>🔋 \${product.specifications.current}</div>\` : ''}
                </div>
                \` : ''}
                
                <div class="flex justify-between items-center">
                    <span class="text-lg font-bold text-green-600">
                        $\${product.price.toLocaleString()} \${product.currency}
                    </span>
                    \${product.inventory ? \`
                        <span class="text-xs text-gray-500">
                            Stock: \${product.inventory}
                        </span>
                    \` : ''}
                </div>
                
                <div class="mt-2 pt-2 border-t">
                    <p class="text-xs text-blue-600">
                        <i class="fas fa-check-circle mr-1"></i>
                        \${rec.reason}
                    </p>
                    \${rec.savings ? \`
                        <p class="text-xs text-green-600 mt-1">
                            <i class="fas fa-dollar-sign mr-1"></i>
                            Ahorro estimado: $\${rec.savings.toFixed(0)}/año
                        </p>
                    \` : ''}
                </div>
            \`;
            
            productsList.appendChild(productCard);
        });
        
        // Calcular precio del paquete
        const packageResponse = await fetch('/api/products/package-price', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ skus })
        });
        
        const packageData = await packageResponse.json();
        
        // Mostrar resumen del paquete
        if (packageData.total > 0) {
            const packageItems = document.getElementById('package-items');
            packageItems.innerHTML = packageData.items.map(item => \`
                <div class="flex justify-between text-sm">
                    <span>\${item.name}</span>
                    <span class="font-semibold">$\${item.price.toLocaleString()}</span>
                </div>
            \`).join('');
            
            document.getElementById('package-total').textContent = \`$\${packageData.total.toLocaleString()} \${packageData.currency}\`;
            packageSummary.classList.remove('hidden');
            
            // Actualizar el input de costo del paquete si existe
            const packageInput = document.querySelector('input[data-field="packageCostPerMotor"]');
            if (packageInput) {
                packageInput.value = Math.round(packageData.total / motors);
                // Disparar evento de cambio
                packageInput.dispatchEvent(new Event('input', { bubbles: true }));
            }
        }
        
    } catch (error) {
        console.error('Error loading products:', error);
        productsList.innerHTML = '<p class="col-span-3 text-center text-red-500">Error al cargar productos. Usando valores estimados.</p>';
    } finally {
        loadingDiv.classList.add('hidden');
    }
}

// Exponer función globalmente
window.loadProductRecommendations = loadProductRecommendations;
</script>
`;

export const getProductSearchBar = () => `
<div class="bg-white rounded-lg shadow-lg p-4 mb-4">
    <div class="flex gap-2">
        <input 
            id="product-search-input"
            type="text" 
            placeholder="Buscar productos Rockwell (ej: PowerFlex, guardamotor, reactor...)"
            class="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button 
            onclick="searchRockwellProducts()"
            class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
            <i class="fas fa-search mr-2"></i>
            Buscar
        </button>
    </div>
    <div id="search-results" class="mt-4 hidden">
        <!-- Resultados de búsqueda -->
    </div>
</div>

<script>
async function searchRockwellProducts() {
    const query = document.getElementById('product-search-input').value;
    if (!query) return;
    
    const resultsDiv = document.getElementById('search-results');
    resultsDiv.innerHTML = '<div class="text-center py-4"><div class="loader mx-auto"></div></div>';
    resultsDiv.classList.remove('hidden');
    
    try {
        const response = await fetch(\`/api/products/search?q=\${encodeURIComponent(query)}&limit=10\`);
        const data = await response.json();
        
        if (data.products.length === 0) {
            resultsDiv.innerHTML = '<p class="text-gray-500 text-center py-4">No se encontraron productos</p>';
            return;
        }
        
        resultsDiv.innerHTML = \`
            <h3 class="font-bold mb-3">Resultados (\${data.totalHits} productos encontrados):</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                \${data.products.map(product => \`
                    <div class="border rounded-lg p-3 hover:shadow-md transition">
                        <div class="flex justify-between items-start mb-2">
                            <div>
                                <h4 class="font-semibold text-sm">\${product.name}</h4>
                                <p class="text-xs text-gray-600">SKU: \${product.sku}</p>
                            </div>
                            <span class="text-lg font-bold text-green-600">$\${product.price}</span>
                        </div>
                        <p class="text-xs text-gray-700 mb-2">\${product.description}</p>
                        <div class="flex justify-between items-center">
                            <span class="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
                                \${product.category}
                            </span>
                            \${product.inStock ? 
                                '<span class="text-xs text-green-600"><i class="fas fa-check-circle"></i> En stock</span>' :
                                '<span class="text-xs text-red-600"><i class="fas fa-times-circle"></i> Agotado</span>'
                            }
                        </div>
                    </div>
                \`).join('')}
            </div>
        \`;
    } catch (error) {
        console.error('Error searching products:', error);
        resultsDiv.innerHTML = '<p class="text-red-500 text-center py-4">Error al buscar productos</p>';
    }
}

// Buscar al presionar Enter
document.getElementById('product-search-input')?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') searchRockwellProducts();
});
</script>
`;