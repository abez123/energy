# INSTRUCCIONES PARA CONFIGURAR TU API KEY

## 🎯 EJECUTA ESTE COMANDO EN ESTA TERMINAL:

### Para https://energy-calculator.hola-245.workers.dev (WORKERS):
```bash
cd /home/user/webapp && npx wrangler secret put OPENAI_API_KEY --compatibility-date=2024-01-01 --name energy-calculator
```

### Para https://energy-calculator-absa.pages.dev (PAGES):
```bash
cd /home/user/webapp && npx wrangler pages secret put OPENAI_API_KEY --project-name energy-calculator-absa
```

## 📝 QUÉ HACER:

1. **COPIA** uno de los comandos de arriba
2. **PÉGALO** en esta terminal (abajo)
3. **CUANDO TE PIDA** "Enter a secret value:"
4. **PEGA** tu API key de OpenAI (sk-...)
5. **PRESIONA** Enter

## ⚠️ IMPORTANTE:
- La API key NO se verá cuando la pegues (por seguridad)
- Solo pégala y presiona Enter
- Verás un mensaje de confirmación cuando esté lista