import { MeiliSearch } from 'meilisearch';

// Tipos para productos Rockwell
export interface RockwellProduct {
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
  imageUrl?: string;
  datasheet?: string;
  relatedProducts?: string[];
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
      this.indexName = indexName || 'rockwell_products';
    }
  }

  // Buscar productos por consulta
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
      const searchResult = await index.search(query, {
        limit: options?.limit || 20,
        offset: options?.offset || 0,
        filter: options?.filter,
        sort: options?.sort,
        attributesToHighlight: ['name', 'description'],
      });

      return {
        products: searchResult.hits as RockwellProduct[],
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
      const index = this.client.index(this.indexName);
      const document = await index.getDocument(sku);
      return document as RockwellProduct;
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
    
    // Buscar drives apropiados
    const driveQuery = `PowerFlex ${params.hpPerMotor}HP drive VFD`;
    const driveResults = await this.searchProducts(driveQuery, { limit: 5 });
    
    driveResults.products.forEach(product => {
      recommendations.push({
        product,
        reason: `Drive recomendado para motor de ${params.hpPerMotor} HP`,
        compatibility: 'perfect',
        savings: params.hpPerMotor * 746 * 0.3 * 2500 * 0.1, // Estimación de ahorro
      });
    });

    // Buscar guardamotores
    const protectionQuery = `guardamotor circuit breaker ${params.hpPerMotor}HP`;
    const protectionResults = await this.searchProducts(protectionQuery, { limit: 3 });
    
    protectionResults.products.forEach(product => {
      recommendations.push({
        product,
        reason: 'Protección esencial para el motor',
        compatibility: 'perfect',
      });
    });

    // Buscar reactores
    const reactorQuery = `line reactor ${params.hpPerMotor}HP harmonic filter`;
    const reactorResults = await this.searchProducts(reactorQuery, { limit: 3 });
    
    reactorResults.products.forEach(product => {
      recommendations.push({
        product,
        reason: 'Reduce armónicos y mejora la eficiencia',
        compatibility: 'good',
      });
    });

    return recommendations;
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