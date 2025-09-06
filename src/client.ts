export const getClientHtml = () => {
  return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Calculadora de Ahorro Energético - GrupoABSA</title>
    <meta name="description" content="Calculadora profesional de ahorro energético con análisis de ROI para drives, reactores y guardamotores">
    <link rel="icon" type="image/x-icon" href="https://grupoabsacdn-1521b.kxcdn.com/web/image/website/1/favicon/">
    <link rel="shortcut icon" type="image/x-icon" href="https://grupoabsacdn-1521b.kxcdn.com/web/image/website/1/favicon/">
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
    <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
    <style>
        .gradient-bg { background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); }
        .metric-card { transition: transform 0.3s ease; }
        .metric-card:hover { transform: translateY(-5px); }
        .chat-container { height: 400px; overflow-y: auto; }
        .loader { border: 3px solid #f3f3f3; border-top: 3px solid #3b82f6; border-radius: 50%; width: 20px; height: 20px; animation: spin 1s linear infinite; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        .logo-container { display: flex; align-items: center; gap: 1rem; }
        .logo-img { max-height: 60px; width: auto; filter: brightness(0) invert(1); }
    </style>
</head>
<body class="bg-gray-50">
    <div id="root"></div>
    <script src="/app.js"></script>
</body>
</html>`;
};