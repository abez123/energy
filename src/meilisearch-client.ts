import { MeiliSearch } from 'meilisearch';

// Palabras clave para productos de ahorro energético
const ENERGY_SAVING_KEYWORDS = {
  drives: ['PowerFlex', '525', '753', '755', 'variador', 'drive', 'VFD', 'inverter', 'AC drive'],
  protection: ['guardamotor', '140M', 'circuit breaker', 'protection', 'motor protection'],
  reactors: ['reactor', '1321', 'line reactor', 'impedance', 'harmonic', 'filter'],
  brands: ['Allen Bradley', 'Rockwell', 'AB'],
  categories: ['Variadores', 'Power', 'Automatización', 'Control Industrial']
};

// Tipos para productos Rockwell - Estructura real de Meilisearch
export interface RockwellProduct {
  // Campos originales de Meilisearch
  id_item: number;
  item_proveedor: string;
  nombre: string;
  descripcion: string;
  marca?: string;
  proveedor?: string;
  publicado_website: boolean;
  items_absa?: string;
  unidad_inventario?: string;
  website_description?: string;
  marca_tematica?: string;
  categorias_website?: string[];
  guadalajara?: number;
  leon?: number;
  chihuahua?: number;
  hermosillo?: number;
  juarez?: number;
  sale_price_usd?: string;
  url_aol?: string;
  
  // Campos mapeados para compatibilidad con la UI
  id: string;
  sku: string;
  name: string;
  description: string;
  category: string;
  price: number;
  currency: string;
  inventory: number;
  inStock: boolean;
  manufacturer: string;
  specifications?: {
    power?: string;
    voltage?: string;
    current?: string;
    frequency?: string;
    [key: string]: any;
  };
}

export interface ProductSearchResult {
  products: RockwellProduct[];
  totalHits: number;
  processingTime: number;
  query: string;
}

export interface ProductRecommendation {
  product: RockwellProduct;
  reason: string;
  savings?: number;
  compatibility: 'perfect' | 'good' | 'compatible';
}

// Cliente de Meilisearch
export class RockwellProductSearch {
  private client: MeiliSearch | null = null;
  private indexName: string;

  constructor(host?: string, apiKey?: string, indexName?: string) {
    if (host && apiKey) {
      this.client = new MeiliSearch({
        host,
        apiKey,
      });
      this.indexName = indexName || 'products';
    }
  }

  // Extraer HP de texto
  private extractHP(text: string): number {
    const hpMatch = text.match(/(\d+(?:\.\d+)?)\s*HP/i);
    return hpMatch ? parseFloat(hpMatch[1]) : 0;
  }

  // Extraer amperaje de texto
  private extractAmps(text: string): number {
    const ampMatch = text.match(/(\d+(?:\.\d+)?)\s*A(?:MP|MPER)?/i);
    return ampMatch ? parseFloat(ampMatch[1]) : 0;
  }

  // Mapear producto de Meilisearch a nuestro formato
  private mapProduct(hit: any): RockwellProduct {
    // Calcular inventario total
    const totalInventory = (hit.guadalajara || 0) + (hit.leon || 0) + 
                          (hit.chihuahua || 0) + (hit.hermosillo || 0) + 
                          (hit.juarez || 0);
    
    // Extraer especificaciones del nombre/descripción
    const specs: any = {};
    const nameUpper = (hit.nombre || '').toUpperCase();
    const descUpper = (hit.descripcion || '').toUpperCase();
    
    // Buscar HP en el nombre o descripción
    const hpMatch = (nameUpper + ' ' + descUpper).match(/(\d+(?:\.\d+)?)\s*HP/);
    if (hpMatch) specs.power = hpMatch[1] + ' HP';
    
    // Buscar voltaje
    const voltMatch = (nameUpper + ' ' + descUpper).match(/(\d+)\s*V(?:AC|DC)?/);
    if (voltMatch) specs.voltage = voltMatch[1] + 'V AC';
    
    // Buscar amperaje
    const ampMatch = (nameUpper + ' ' + descUpper).match(/(\d+(?:\.\d+)?)\s*A(?:MP)?/);
    if (ampMatch) specs.current = ampMatch[1] + ' A';

    return {
      // Campos originales
      id_item: hit.id_item,
      item_proveedor: hit.item_proveedor || '',
      nombre: hit.nombre || '',
      descripcion: hit.descripcion || '',
      marca: hit.marca,
      proveedor: hit.proveedor,
      publicado_website: hit.publicado_website || false,
      items_absa: hit.items_absa,
      unidad_inventario: hit.unidad_inventario,
      website_description: hit.website_description,
      marca_tematica: hit.marca_tematica,
      categorias_website: hit.categorias_website || [],
      guadalajara: hit.guadalajara,
      leon: hit.leon,
      chihuahua: hit.chihuahua,
      hermosillo: hit.hermosillo,
      juarez: hit.juarez,
      sale_price_usd: hit.sale_price_usd,
      url_aol: hit.url_aol,
      
      // Campos mapeados para la UI
      id: String(hit.id_item),
      sku: hit.item_proveedor || hit.items_absa || String(hit.id_item),
      name: hit.nombre || 'Producto sin nombre',
      description: hit.descripcion || hit.website_description || '',
      category: hit.categorias_website?.[0] || 'General',
      price: parseFloat(hit.sale_price_usd || '0'),
      currency: 'USD',
      inventory: totalInventory,
      inStock: totalInventory > 0 || hit.publicado_website,
      manufacturer: hit.marca || hit.marca_tematica || 'Rockwell Automation',
      specifications: Object.keys(specs).length > 0 ? specs : undefined
    };
  }

  // Buscar productos por consulta - Enfocado en productos de ahorro energético
  async searchProducts(query: string, options?: {
    limit?: number;
    offset?: number;
    filter?: string[];
    sort?: string[];
  }): Promise<ProductSearchResult> {
    if (!this.client) {
      return this.getMockProducts(query);
    }

    try {
      const index = this.client.index(this.indexName);
      
      // Mejorar la búsqueda agregando términos relevantes para ahorro energético
      let enhancedQuery = query;
      
      // Si buscan términos genéricos, agregar marcas/modelos específicos
      if (query.toLowerCase().includes('drive') || query.toLowerCase().includes('variador')) {
        enhancedQuery = `${query} PowerFlex Allen Bradley 525 753 755`;
      } else if (query.toLowerCase().includes('guardamotor')) {
        enhancedQuery = `${query} 140M protection circuit breaker`;
      } else if (query.toLowerCase().includes('reactor')) {
        enhancedQuery = `${query} 1321 line impedance harmonic`;
      }
      
      const searchResult = await index.search(enhancedQuery, {
        limit: options?.limit || 20,
        offset: options?.offset || 0,
        filter: options?.filter,
        sort: options?.sort,
        attributesToHighlight: ['nombre', 'descripcion'],
      });

      // Mapear los resultados al formato esperado
      let mappedProducts = searchResult.hits.map(hit => this.mapProduct(hit));
      
      // Filtrar y priorizar productos relevantes para ahorro energético
      mappedProducts = mappedProducts.sort((a, b) => {
        // Priorizar productos con precio
        if (a.price > 0 && b.price === 0) return -1;
        if (a.price === 0 && b.price > 0) return 1;
        
        // Priorizar productos publicados en website
        if (a.publicado_website && !b.publicado_website) return -1;
        if (!a.publicado_website && b.publicado_website) return 1;
        
        // Priorizar productos con URL de tienda
        if (a.url_aol && !b.url_aol) return -1;
        if (!a.url_aol && b.url_aol) return 1;
        
        // Priorizar productos con inventario
        if (a.inventory > 0 && b.inventory === 0) return -1;
        if (a.inventory === 0 && b.inventory > 0) return 1;
        
        return 0;
      });

      return {
        products: mappedProducts,
        totalHits: searchResult.estimatedTotalHits || 0,
        processingTime: searchResult.processingTimeMs || 0,
        query: searchResult.query || query,
      };
    } catch (error) {
      console.error('Meilisearch error:', error);
      return this.getMockProducts(query);
    }
  }

  // Obtener producto por SKU
  async getProductBySku(sku: string): Promise<RockwellProduct | null> {
    if (!this.client) {
      return this.getMockProductBySku(sku);
    }

    try {
      // Buscar por item_proveedor o items_absa
      const index = this.client.index(this.indexName);
      const searchResult = await index.search(sku, {
        limit: 1,
        filter: [`item_proveedor = "${sku}" OR items_absa = "${sku}"`]
      });
      
      if (searchResult.hits.length > 0) {
        return this.mapProduct(searchResult.hits[0]);
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching product:', error);
      return this.getMockProductBySku(sku);
    }
  }

  // Recomendar productos basados en el cálculo
  async getRecommendations(params: {
    motors: number;
    hpPerMotor: number;
    applicationType?: string;
  }): Promise<ProductRecommendation[]> {
    const recommendations: ProductRecommendation[] = [];
    
    // 1. DRIVES/VARIADORES - Búsquedas específicas para ahorro energético
    // Primero buscar PowerFlex específico para el HP requerido
    let driveQuery = `PowerFlex ${params.hpPerMotor}HP`;
    let driveResults = await this.searchProducts(driveQuery, { limit: 3 });
    
    // Si no hay resultados específicos, buscar PowerFlex general y filtrar
    if (driveResults.products.length === 0) {
      driveQuery = 'PowerFlex 525 753 755 variador drive';
      driveResults = await this.searchProducts(driveQuery, { limit: 10 });
      
      // Filtrar por HP más cercano
      driveResults.products = driveResults.products.filter(p => {
        const productHP = this.extractHP(p.name + ' ' + p.description);
        return productHP > 0 && Math.abs(productHP - params.hpPerMotor) <= 5;
      }).slice(0, 3);
    }
    
    driveResults.products.forEach(product => {
      const productHP = this.extractHP(product.name + ' ' + product.description);
      recommendations.push({
        product,
        reason: `Variador PowerFlex para motor ${params.hpPerMotor}HP - Ahorro energético del 30%`,
        compatibility: productHP === params.hpPerMotor ? 'perfect' : 'good',
        savings: params.hpPerMotor * 746 * 0.3 * 2500 * 0.1, // Estimación de ahorro
      });
    });

    // 2. GUARDAMOTORES - Protección y eficiencia
    // Calcular amperaje aproximado basado en HP (HP * 1.5 para 480V)
    const estimatedAmps = Math.ceil(params.hpPerMotor * 1.5);
    
    let protectionQuery = `guardamotor ${estimatedAmps}A 140M`;
    let protectionResults = await this.searchProducts(protectionQuery, { limit: 2 });
    
    if (protectionResults.products.length === 0) {
      protectionQuery = 'guardamotor motor protection circuit breaker 140M';
      protectionResults = await this.searchProducts(protectionQuery, { limit: 5 });
      
      // Filtrar por amperaje cercano
      protectionResults.products = protectionResults.products.filter(p => {
        const productAmps = this.extractAmps(p.name + ' ' + p.description);
        return productAmps > 0 && productAmps >= estimatedAmps * 0.8 && productAmps <= estimatedAmps * 1.5;
      }).slice(0, 2);
    }
    
    protectionResults.products.forEach(product => {
      recommendations.push({
        product,
        reason: `Guardamotor para protección integral - Reduce paros no programados`,
        compatibility: 'perfect',
      });
    });

    // 3. REACTORES DE LÍNEA - Calidad de energía
    let reactorQuery = `reactor línea line 1321 ${estimatedAmps}A`;
    let reactorResults = await this.searchProducts(reactorQuery, { limit: 2 });
    
    if (reactorResults.products.length === 0) {
      reactorQuery = 'reactor 1321 line impedance harmonic';
      reactorResults = await this.searchProducts(reactorQuery, { limit: 5 });
      
      // Filtrar por amperaje apropiado
      reactorResults.products = reactorResults.products.filter(p => {
        const productAmps = this.extractAmps(p.name + ' ' + p.description);
        return productAmps > 0 && productAmps >= estimatedAmps;
      }).slice(0, 2);
    }
    
    reactorResults.products.forEach(product => {
      recommendations.push({
        product,
        reason: `Reactor de línea - Mejora calidad de energía y prolonga vida del equipo`,
        compatibility: 'good',
      });
    });

    // Si no hay suficientes productos, buscar más genéricos
    if (recommendations.length < 3) {
      const genericQuery = 'Allen Bradley Rockwell automation drive motor control';
      const genericResults = await this.searchProducts(genericQuery, { limit: 5 });
      
      genericResults.products.forEach(product => {
        // Solo agregar si es relevante para ahorro energético
        if (product.category?.toLowerCase().includes('variador') || 
            product.category?.toLowerCase().includes('power') ||
            product.name?.toLowerCase().includes('powerflex') ||
            product.name?.toLowerCase().includes('drive')) {
          recommendations.push({
            product,
            reason: 'Producto complementario para sistema de ahorro energético',
            compatibility: 'compatible',
          });
        }
      });
    }

    return recommendations.slice(0, 10); // Máximo 10 recomendaciones
  }

  // Calcular precio total del paquete
  async calculatePackagePrice(skus: string[]): Promise<{
    total: number;
    items: Array<{ sku: string; price: number; name: string }>;
    currency: string;
  }> {
    const items = [];
    let total = 0;
    
    for (const sku of skus) {
      const product = await this.getProductBySku(sku);
      if (product) {
        items.push({
          sku: product.sku,
          price: product.price,
          name: product.name,
        });
        total += product.price;
      }
    }

    return {
      total,
      items,
      currency: 'USD',
    };
  }

  // Datos mock para desarrollo/demo
  private getMockProducts(query: string): ProductSearchResult {
    // Todos los productos mock disponibles
    const allMockProducts: RockwellProduct[] = [
      {
        id: '25B-D4P0N104',
        sku: '25B-D4P0N104',
        name: 'PowerFlex 525 AC Drive',
        description: 'Variador de frecuencia 2HP, 480V, IP20',
        category: 'Drives',
        price: 850,
        currency: 'USD',
        inventory: 15,
        inStock: true,
        manufacturer: 'Allen-Bradley',
        specifications: {
          power: '2 HP / 1.5 kW',
          voltage: '380-480V AC',
          current: '4.0 A',
          frequency: '0-400 Hz',
        },
        imageUrl: 'https://www.rockwellautomation.com/products/powerflex-525.jpg',
      },
      {
        id: '25B-D6P0N104',
        sku: '25B-D6P0N104',
        name: 'PowerFlex 525 AC Drive',
        description: 'Variador de frecuencia 3HP, 480V, IP20',
        category: 'Drives',
        price: 1150,
        currency: 'USD',
        inventory: 8,
        inStock: true,
        manufacturer: 'Allen-Bradley',
        specifications: {
          power: '3 HP / 2.2 kW',
          voltage: '380-480V AC',
          current: '6.0 A',
          frequency: '0-400 Hz',
        },
      },
      {
        id: '25B-D010N104',
        sku: '25B-D010N104',
        name: 'PowerFlex 525 AC Drive',
        description: 'Variador de frecuencia 5HP, 480V, IP20',
        category: 'Drives',
        price: 1580,
        currency: 'USD',
        inventory: 12,
        inStock: true,
        manufacturer: 'Allen-Bradley',
        specifications: {
          power: '5 HP / 4 kW',
          voltage: '380-480V AC',
          current: '10.5 A',
          frequency: '0-400 Hz',
        },
      },
      {
        id: '25B-D013N104',
        sku: '25B-D013N104',
        name: 'PowerFlex 525 AC Drive',
        description: 'Variador de frecuencia 7.5HP, 480V, IP20',
        category: 'Drives',
        price: 2100,
        currency: 'USD',
        inventory: 5,
        inStock: true,
        manufacturer: 'Allen-Bradley',
        specifications: {
          power: '7.5 HP / 5.5 kW',
          voltage: '380-480V AC',
          current: '13 A',
          frequency: '0-400 Hz',
        },
      },
      {
        id: '25B-D017N104',
        sku: '25B-D017N104',
        name: 'PowerFlex 525 AC Drive',
        description: 'Variador de frecuencia 10HP, 480V, IP20',
        category: 'Drives',
        price: 2400,
        currency: 'USD',
        inventory: 10,
        inStock: true,
        manufacturer: 'Allen-Bradley',
        specifications: {
          power: '10 HP / 7.5 kW',
          voltage: '380-480V AC',
          current: '17 A',
          frequency: '0-400 Hz',
        },
      },
      {
        id: '140M-C2E-B10',
        sku: '140M-C2E-B10',
        name: 'Motor Protection Circuit Breaker',
        description: 'Guardamotor 6.3-10A, 480V',
        category: 'Protection',
        price: 385,
        currency: 'USD',
        inventory: 25,
        inStock: true,
        manufacturer: 'Allen-Bradley',
        specifications: {
          currentRange: '6.3-10 A',
          voltage: '480V AC',
          breakingCapacity: '100 kA',
        },
      },
      {
        id: '1321-3R8-B',
        sku: '1321-3R8-B',
        name: 'Line Reactor',
        description: 'Reactor de línea 8A, 3%, 480V',
        category: 'Power Quality',
        price: 295,
        currency: 'USD',
        inventory: 18,
        inStock: true,
        manufacturer: 'Allen-Bradley',
        specifications: {
          current: '8 A',
          impedance: '3%',
          voltage: '480V AC',
        },
      },
      {
        id: '1321-3R12-B',
        sku: '1321-3R12-B',
        name: 'Line Reactor',
        description: 'Reactor de línea 12A, 3%, 480V',
        category: 'Power Quality',
        price: 345,
        currency: 'USD',
        inventory: 15,
        inStock: true,
        manufacturer: 'Allen-Bradley',
        specifications: {
          current: '12 A',
          impedance: '3%',
          voltage: '480V AC',
        },
      },
    ];

    // Filtrar por query - búsqueda más flexible
    const queryLower = query.toLowerCase();
    const filtered = allMockProducts.filter(p => {
      // Buscar en múltiples campos
      const searchText = `${p.name} ${p.description} ${p.category} ${p.sku} ${p.manufacturer}`.toLowerCase();
      
      // Si el query contiene HP, buscar por potencia específica
      const hpMatch = query.match(/(\d+)\s*HP/i);
      if (hpMatch) {
        const requestedHP = parseInt(hpMatch[1]);
        const productHP = p.specifications?.power ? 
          parseInt(p.specifications.power.match(/(\d+)\s*HP/i)?.[1] || '0') : 0;
        
        // Para drives, buscar el más cercano en potencia
        if (p.category === 'Drives' && Math.abs(productHP - requestedHP) <= 2) {
          return true;
        }
      }
      
      // Búsqueda general por palabras clave
      const keywords = queryLower.split(' ');
      return keywords.some(keyword => searchText.includes(keyword));
    });

    return {
      products: filtered.slice(0, 5),
      totalHits: filtered.length,
      processingTime: 10,
      query,
    };
  }

  private getMockProductBySku(sku: string): RockwellProduct | null {
    const result = this.getMockProducts(sku);
    return result.products.find(p => p.sku === sku) || null;
  }
}

// Exportar instancia singleton
export const productSearch = new RockwellProductSearch(
  process.env.MEILISEARCH_HOST,
  process.env.MEILISEARCH_API_KEY,
  process.env.MEILISEARCH_INDEX
);