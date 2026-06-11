# Guia de Deploy - DigitalOcean Droplet ($4/mês)

## 1. Criar o Droplet

### Configuração Recomendada:
- **Plano**: Basic ($4/mês)
- **Região**: São Paulo ou mais próxima
- **Sistema**: Ubuntu 22.04 LTS
- **Plano**: 1 CPU, 1 GB RAM, 25 GB SSD
- **Authentication**: SSH Key (recomendado)

## 2. Configurar o Servidor

### Conectar via SSH:
```bash
ssh root@SEU_IP_DO_DROPLET
```

### Atualizar sistema:
```bash
apt update && apt upgrade -y
```

### Instalar Node.js 18:
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt-get install -y nodejs
```

### Instalar Nginx:
```bash
apt install nginx -y
```

### Instalar PM2 (Process Manager):
```bash
npm install -g pm2
```

## 3. Configurar o Projeto

### Clonar repositório:
```bash
cd /var/www
git clone SEU_REPOSITORIO_GIT wargame-web
cd wargame-web
```

### Instalar dependências:
```bash
npm install
```

### Configurar variáveis de ambiente:
```bash
cp .env.example .env.local
nano .env.local
```

Adicionar:
```
NEXT_PUBLIC_API_BASE_URL=http://SEU_IP_DO_DROPLET:4000
NODE_ENV=production
```

### Build do projeto:
```bash
npm run build
```

## 4. Configurar a API

### Instalar dependências da API:
```bash
cd /var/www
git clone SEU_REPOSITORIO_DA_API wargame-api
cd wargame-api
npm install
```

### Configurar ambiente da API:
```bash
cp .env.example .env
nano .env
```

### Iniciar API com PM2:
```bash
pm2 start server.js --name "wargame-api"
pm2 save
pm2 startup
```

## 5. Configurar Nginx

### Criar configuração:
```bash
nano /etc/nginx/sites-available/wargame-web
```

Adicionar:
```nginx
server {
    listen 80;
    server_name SEU_IP_DO_DROPLET;

    # Frontend (Next.js)
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # API
    location /api/ {
        proxy_pass http://localhost:4000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Ativar site:
```bash
ln -s /etc/nginx/sites-available/wargame-web /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

## 6. Iniciar Frontend com PM2

### Criar script de start:
```bash
cd /var/www/wargame-web
nano ecosystem.config.js
```

Adicionar:
```javascript
module.exports = {
  apps: [{
    name: 'wargame-web',
    script: 'npm',
    args: 'start',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production'
    }
  }]
};
```

### Iniciar:
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## 7. Configurar Firewall

```bash
ufw allow ssh
ufw allow 'Nginx Full'
ufw enable
```

## 8. Opcional - Configurar Domínio e SSL

### Instalar Certbot:
```bash
apt install certbot python3-certbot-nginx -y
```

### Obter certificado SSL:
```bash
certbot --nginx -d SEU_DOMINIO.COM
```

## 9. Comandos Úteis

### Verificar status dos serviços:
```bash
pm2 status
systemctl status nginx
```

### Verificar logs:
```bash
pm2 logs wargame-web
pm2 logs wargame-api
tail -f /var/log/nginx/error.log
```

### Reiniciar serviços:
```bash
pm2 restart wargame-web
pm2 restart wargame-api
systemctl restart nginx
```

### Atualizar projeto:
```bash
cd /var/www/wargame-web
git pull
npm install
npm run build
pm2 restart wargame-web
```

## Custo Mensal Estimado:
- **Droplet**: $4.00
- **Domínio**: ~$1.00/mês (opcional)
- **Total**: ~$5.00/mês

## URLs Finais:
- **Frontend**: http://SEU_IP_DO_DROPLET
- **API**: http://SEU_IP_DO_DROPLET/api/
- **Com domínio**: https://SEU_DOMINIO.COM
