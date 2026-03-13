#!/bin/bash

# Ultima Parole Deployment Script
echo "🚀 Iniciando despliegue de Ultima Parole..."

# Verificar si Docker está corriendo
if ! sudo docker info > /dev/null 2>&1; then
    echo "❌ Error: Docker no parece estar corriendo o no tienes permisos."
    exit 1
fi

# Construir y levantar
echo "📦 Construyendo y levantando contenedores..."
sudo docker compose up -d --build

echo "✅ Despliegue completado con éxito."
echo "🌐 Accede en: http://$(hostname -I | awk '{print $1}'):3020"
