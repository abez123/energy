# Configuración de Meilisearch - Productos Rockwell Automation

## Información Necesaria

Para conectar con tu Meilisearch, necesito:

1. **URL del servidor Meilisearch**
   - Ejemplo: https://meilisearch.tudominio.com
   - O: http://IP:7700

2. **API Key (Master Key o Search Key)**
   - Para búsquedas públicas usar Search Key
   - Para operaciones admin usar Master Key

3. **Nombre del índice**
   - Ejemplo: "rockwell_products" o "products"

4. **Estructura de los documentos**
   Ejemplo de campos esperados:
   - id
   - sku/part_number
   - name/description
   - price
   - inventory/stock
   - category
   - specifications
   - image_url

## Configuración Temporal para Desarrollo

Por ahora usaré valores de ejemplo. Reemplázalos con tus datos reales:

```env
MEILISEARCH_HOST=https://your-meilisearch-instance.com
MEILISEARCH_API_KEY=your-api-key-here
MEILISEARCH_INDEX=rockwell_products
```