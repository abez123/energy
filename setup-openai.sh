#!/bin/bash

echo "========================================="
echo "  Configuración de OpenAI API Key"
echo "  para Cloudflare Workers"
echo "========================================="
echo ""
echo "Este script te ayudará a configurar tu API key de OpenAI"
echo "en tu aplicación desplegada en Cloudflare."
echo ""
echo "Necesitarás tu API key de OpenAI."
echo "Si no tienes una, obtén una en: https://platform.openai.com/api-keys"
echo ""
echo "¿Qué deseas configurar?"
echo "1) Cloudflare Workers (energy-calculator.hola-245.workers.dev)"
echo "2) Cloudflare Pages (energy-calculator-absa.pages.dev)"
echo "3) Ambos"
echo ""
read -p "Selecciona una opción (1-3): " option

case $option in
  1)
    echo ""
    echo "Configurando para Cloudflare Workers..."
    npx wrangler secret put OPENAI_API_KEY --name energy-calculator
    echo "✅ API key configurada para Workers!"
    echo "URL: https://energy-calculator.hola-245.workers.dev"
    ;;
  2)
    echo ""
    echo "Configurando para Cloudflare Pages..."
    npx wrangler secret put OPENAI_API_KEY --project-name energy-calculator-absa
    echo "✅ API key configurada para Pages!"
    echo "URL: https://energy-calculator-absa.pages.dev"
    ;;
  3)
    echo ""
    echo "Configurando para ambos servicios..."
    echo "Primero para Workers:"
    npx wrangler secret put OPENAI_API_KEY --name energy-calculator
    echo ""
    echo "Ahora para Pages:"
    npx wrangler secret put OPENAI_API_KEY --project-name energy-calculator-absa
    echo "✅ API key configurada para ambos servicios!"
    ;;
  *)
    echo "Opción inválida"
    exit 1
    ;;
esac

echo ""
echo "========================================="
echo "  ¡Configuración completada!"
echo "========================================="
echo ""
echo "Tu chatbot con IA ahora está activo en:"
echo "• https://energy-calculator.hola-245.workers.dev"
echo "• https://energy-calculator-absa.pages.dev"
echo ""
echo "Prueba el chatbot preguntando sobre:"
echo "- Cálculos de ROI"
echo "- Eficiencia energética"
echo "- Recomendaciones para tu industria"
echo ""