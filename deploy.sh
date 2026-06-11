#!/bin/bash

# Script de Deploy Automático - DigitalOcean Droplet
# Uso: ./deploy.sh SEU_IP_DO_DROPLET

if [ -z "$1" ]; then
    echo "Uso: ./deploy.sh SEU_IP_DO_DROPLET"
    exit 1
fi

DROPLET_IP=$1
PROJECT_NAME="wargame-web"
API_NAME="wargame-api"

echo "🚀 Iniciando deploy para $DROPLET_IP..."

# Build do projeto
echo "📦 Build do frontend..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Erro no build. Abortando."
    exit 1
fi

# Criar arquivo de deploy remoto
cat > remote-deploy.sh << 'EOF'
#!/bin/bash

# Atualizar sistema
echo "🔄 Atualizando sistema..."
apt update && apt upgrade -y

# Instalar Node.js
echo "📥 Instalando Node.js..."
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# Instalar Nginx
echo "🌐 Instalando Nginx..."
apt install nginx -y

# Instalar PM2
echo "⚡ Instalando PM2..."
npm install -g pm2

# Criar diretório do projeto
mkdir -p /var/www
cd /var/www

# Parar serviços existentes
pm2 stop wargame-web wargame-api 2>/dev/null || true
pm2 delete wargame-web wargame-api 2>/dev/null || true

# Configurar firewall
ufw allow ssh
ufw allow 'Nginx Full'
ufw --force enable

echo "✅ Setup básico concluído!"
EOF

# Enviar script para o servidor
echo "📤 Enviando script de setup..."
scp -o StrictHostKeyChecking=no remote-deploy.sh root@$DROPLET_IP:/tmp/

# Executar setup no servidor
echo "🔧 Executando setup no servidor..."
ssh -o StrictHostKeyChecking=no root@$DROPLET_IP "chmod +x /tmp/remote-deploy.sh && /tmp/remote-deploy.sh"

# Copiar arquivos do frontend
echo "📤 Enviando frontend..."
scp -o StrictHostKeyChecking=no -r .next out package.json package-lock.json .env.local root@$DROPLET_IP:/var/www/$PROJECT_NAME/

# Copiar arquivos da API (se existirem)
if [ -d "../wargame-api" ]; then
    echo "📤 Enviando API..."
    scp -o StrictHostKeyChecking=no -r ../wargame-api/* root@$DROPLET_IP:/var/www/$API_NAME/
fi

# Configurar e iniciar serviços
ssh -o StrictHostKeyChecking=no root@$DROPLET_IP << EOF
cd /var/www/$PROJECT_NAME

# Instalar dependências
echo "📦 Instalando dependências do frontend..."
npm ci --production

# Iniciar API (se existir)
if [ -d "/var/www/$API_NAME" ]; then
    cd /var/www/$API_NAME
    echo "📦 Instalando dependências da API..."
    npm ci --production
    pm2 start server.js --name "wargame-api"
fi

# Configurar Nginx
cat > /etc/nginx/sites-available/wargame-web << 'NGINX'
server {
    listen 80;
    server_name _;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    # API
    location /api/ {
        proxy_pass http://localhost:4000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
NGINX

ln -sf /etc/nginx/sites-available/wargame-web /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl restart nginx

# Iniciar frontend
cd /var/www/$PROJECT_NAME
pm2 start npm --name "wargame-web" -- start
pm2 save
pm2 startup

echo "🎉 Deploy concluído!"
echo "🌐 Frontend: http://$DROPLET_IP"
echo "🔌 API: http://$DROPLET_IP/api/"
EOF

# Limpar arquivos temporários
rm remote-deploy.sh

echo "✅ Deploy concluído com sucesso!"
echo "🌐 Acesse: http://$DROPLET_IP"
echo "📊 Status dos serviços: ssh root@$DROPLET_IP 'pm2 status'"
