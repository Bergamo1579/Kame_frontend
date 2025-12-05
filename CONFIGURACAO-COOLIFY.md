# 🚀 Configuração Rápida - Coolify

## ✅ Backend JÁ CONFIGURADO
- URL: `https://tgsocwgc4s0c4ck0s8wg4k84.72.60.4.3.sslip.io`

## 📦 Deploy do Frontend

### 1️⃣ No Coolify - Criar Aplicação

```
New Resource → Application → From Git
```

### 2️⃣ Configurações Básicas

| Campo | Valor |
|-------|-------|
| **Build Pack** | Docker |
| **Dockerfile** | `Dockerfile` |
| **Port** | `3001` |
| **Base Directory** | `.` (raiz) |

### 3️⃣ Build Arguments (IMPORTANTE!)

Adicione estas variáveis e marque como **Build Time Variables**:

```env
REACT_APP_API_URL=https://tgsocwgc4s0c4ck0s8wg4k84.72.60.4.3.sslip.io
REACT_APP_NAME=Kame Frontend
REACT_APP_VERSION=1.0.0
GENERATE_SOURCEMAP=false
NODE_ENV=production
```

### 4️⃣ Deploy

Clique em **"Deploy"** e aguarde!

---

## 🔧 Configuração do Backend (CORS)

Certifique-se que o backend NestJS aceita requisições do frontend.

No arquivo `main.ts` do backend:

```typescript
app.enableCors({
  origin: [
    'https://seu-frontend.coolify.io', // URL do Coolify
    'http://localhost:3001', // Dev local
  ],
  credentials: true,
});
```

---

## ✅ Checklist Pós-Deploy

- [ ] Frontend acessível via URL do Coolify
- [ ] Login funcionando
- [ ] Console sem erros de CORS
- [ ] Assets (CSS/JS) carregando
- [ ] Navegação entre páginas OK
- [ ] Health check verde no Coolify

---

## 🐛 Se Algo Der Errado

### Erro CORS
→ Configure CORS no backend para aceitar a URL do frontend

### Build Falha
→ Verifique logs no Coolify
→ Confirme que build args estão marcadas como **Build Time**

### Página em branco
→ Abra DevTools (F12) e veja console
→ Verifique se API URL está correta

---

## 📞 Teste Rápido

Após deploy, abra:
```
https://seu-frontend.coolify.io
```

E tente fazer login! 🎉

---

**Arquivos Atualizados:**
✅ `.env` - URL do backend configurada
✅ `.env.example` - Template atualizado  
✅ `docker-compose.yml` - Configuração corrigida
✅ `Dockerfile` - Já estava otimizado
✅ `.dockerignore` - Já estava correto

**Tudo pronto para deploy!** 🚀
