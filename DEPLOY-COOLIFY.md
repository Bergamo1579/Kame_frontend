# Guia de Deploy no Coolify - Kame Frontend

## 📋 Configuração do Backend
- **Backend URL**: `https://tgsocwgc4s0c4ck0s8wg4k84.72.60.4.3.sslip.io`

## 🚀 Passos para Deploy no Coolify

### 1. Criar Novo Application

1. Acesse o Coolify
2. Clique em **"New Resource"** → **"Application"**
3. Conecte seu repositório Git do frontend

### 2. Configurar Build

- **Build Pack**: Docker
- **Dockerfile Location**: `Dockerfile`
- **Port**: `3001`
- **Build Args**: Serão configurados via variáveis de ambiente

### 3. Configurar Variáveis de Ambiente

No painel do Coolify, adicione as seguintes variáveis de **BUILD**:

```env
REACT_APP_API_URL=https://tgsocwgc4s0c4ck0s8wg4k84.72.60.4.3.sslip.io
REACT_APP_NAME=Kame Frontend
REACT_APP_VERSION=1.0.0
GENERATE_SOURCEMAP=false
NODE_ENV=production
```

⚠️ **IMPORTANTE**: Marque essas variáveis como **Build Time Variables** no Coolify!

### 4. Configurar Porta

- **Port Mapping**: `3001:3001`
- O container serve na porta `3001` internamente

### 5. Health Check (Automático)

O Dockerfile já inclui health check:
- **Path**: `/` (index.html)
- **Interval**: 30s
- **Timeout**: 10s

### 6. Deploy

1. Clique em **"Deploy"**
2. Aguarde o build completar (pode levar alguns minutos)
3. Acesse a URL fornecida pelo Coolify

## 🔧 Comandos para Teste Local

### Build e Run Local
```bash
# Buildar imagem
docker build \
  --build-arg REACT_APP_API_URL=https://tgsocwgc4s0c4ck0s8wg4k84.72.60.4.3.sslip.io \
  --build-arg REACT_APP_NAME="Kame Frontend" \
  --build-arg REACT_APP_VERSION="1.0.0" \
  --build-arg GENERATE_SOURCEMAP=false \
  -t kame-frontend .

# Rodar container
docker run -p 3001:3001 kame-frontend
```

### Usando Docker Compose
```bash
docker-compose up --build
```

## 📊 Verificações Pós-Deploy

### 1. Verificar Conexão com Backend
Após deploy, abra o DevTools do navegador e verifique:
- ✅ Requisições vão para `https://tgsocwgc4s0c4ck0s8wg4k84.72.60.4.3.sslip.io`
- ✅ CORS está configurado no backend
- ✅ SSL funciona corretamente

### 2. Testar Login
- Tente fazer login
- Verifique se o token JWT é retornado
- Confirme navegação entre páginas

### 3. Verificar Assets
- CSS carregando corretamente
- Imagens aparecendo
- Sem erros 404 no console

## ⚙️ Configurações Adicionais do Backend

Certifique-se de que o backend NestJS tem CORS configurado para aceitar requisições do frontend:

```typescript
// main.ts no backend
app.enableCors({
  origin: [
    'https://seu-frontend-url.coolify.io',
    'http://localhost:3001', // Para desenvolvimento
  ],
  credentials: true,
});
```

## 🐛 Troubleshooting

### Frontend não conecta com backend
- ✅ Verifique se `REACT_APP_API_URL` está correto
- ✅ Teste a URL do backend diretamente no navegador
- ✅ Verifique CORS no backend
- ✅ Confirme que backend está rodando

### Build falha
- ✅ Verifique logs no Coolify
- ✅ Confirme que todas as build args estão configuradas
- ✅ Teste build local primeiro

### Página em branco após deploy
- ✅ Verifique console do navegador (F12)
- ✅ Confirme que `build/` foi gerado corretamente
- ✅ Verifique se porta 3001 está exposta

### Erro CORS
Configure no backend NestJS:
```typescript
app.enableCors({
  origin: true, // Ou especifique o domínio do frontend
  credentials: true,
});
```

## 📝 Checklist de Deploy

- [ ] Backend rodando em `https://tgsocwgc4s0c4ck0s8wg4k84.72.60.4.3.sslip.io`
- [ ] Variáveis de ambiente configuradas no Coolify
- [ ] Build args marcados como **Build Time**
- [ ] Porta 3001 exposta
- [ ] CORS configurado no backend
- [ ] SSL funcionando (HTTPS)
- [ ] Health check passando
- [ ] Login funcionando

## 🎯 URLs Importantes

- **Backend API**: `https://tgsocwgc4s0c4ck0s8wg4k84.72.60.4.3.sslip.io`
- **Frontend**: URL fornecida pelo Coolify após deploy
- **Health Check**: `https://seu-frontend.coolify.io/`

## 📞 Próximos Passos

1. Deploy do frontend no Coolify
2. Configurar domínio customizado (opcional)
3. Configurar SSL automático (Coolify faz isso)
4. Testar todas as funcionalidades
5. Monitorar logs e métricas

Pronto para deploy! 🚀
