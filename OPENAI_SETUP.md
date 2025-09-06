# 🤖 Configuración de OpenAI API Key para el Chatbot

## 🎯 Pasos Rápidos para https://energy-calculator.hola-245.workers.dev

### Paso 1: Obtén tu API Key
1. Ve a: https://platform.openai.com/api-keys
2. Haz clic en "Create new secret key"
3. Copia la key (empieza con `sk-...`)

### Paso 2: Configura la API Key en Cloudflare

#### Opción A: Usar el script automático (MÁS FÁCIL)
```bash
cd /home/user/webapp
./setup-openai.sh
# Selecciona opción 1 para Workers
# Pega tu API key cuando se solicite
```

#### Opción B: Comando directo
```bash
cd /home/user/webapp
npx wrangler secret put OPENAI_API_KEY --name energy-calculator
```
Cuando te pida, pega tu API key y presiona Enter.

### Paso 3: Verifica que funciona
1. Abre: https://energy-calculator.hola-245.workers.dev
2. Ve al chatbot en la parte inferior derecha
3. Pregunta algo como: "¿Cómo puedo mejorar la eficiencia energética?"
4. ¡Deberías recibir una respuesta personalizada!

---

## 📋 Información Importante

### ¿Dónde se guarda la API Key?
- Se almacena de forma **segura** en Cloudflare como un "secret"
- **NO** está visible en el código
- **NO** está expuesta públicamente
- Solo tu Worker tiene acceso a ella

### ¿Qué puedo preguntar al chatbot?
- Cálculos de ROI y payback
- Recomendaciones de ahorro energético
- Comparación de tecnologías
- Mejores prácticas industriales
- Análisis de tus cálculos actuales

### Verificar que la API key está configurada:
```bash
npx wrangler secret list --name energy-calculator
```

### Actualizar la API key (si necesitas cambiarla):
```bash
npx wrangler secret delete OPENAI_API_KEY --name energy-calculator
npx wrangler secret put OPENAI_API_KEY --name energy-calculator
```

---

## 🚨 Solución de Problemas

### El chatbot dice "El asistente de IA no está configurado"
- La API key no está configurada
- Ejecuta los comandos del Paso 2

### El chatbot da error al enviar mensajes
- Verifica que tu API key sea válida
- Asegúrate de tener créditos en OpenAI
- Revisa los logs: `npx wrangler tail energy-calculator`

### Límites de la API
- OpenAI cobra por uso (~$0.002 por consulta)
- Configura límites en: https://platform.openai.com/usage

---

## 💡 Tips

1. **Seguridad**: Nunca compartas tu API key públicamente
2. **Costos**: Monitorea tu uso en el dashboard de OpenAI
3. **Rendimiento**: El chatbot usa GPT-4-mini (rápido y económico)

---

## 🎉 ¡Listo!

Una vez configurada, tu chatbot estará activo en:
- https://energy-calculator.hola-245.workers.dev
- https://energy-calculator-absa.pages.dev

¡Disfruta de tu asistente IA experto en eficiencia energética!