# 🐢 KAME - Sistema Financeiro Frontend

Frontend do sistema financeiro KAME desenvolvido em React com Tailwind CSS.

## 📋 Funcionalidades Impl### ⚙️ Configuração da API

A URL da API está configurada em `src/services/api.js`:

```javascript
const API_BASE_URL = 'http://localhost:3000/api';
```

Se o backend estiver rodando em outra porta ou domínio, altere esta constante.

### 🐛 Solução de Problemas

**Erro de CORS**  
Se encontrar erros de CORS, certifique-se de que o backend está configurado para aceitar requisições do frontend.

**Erro 401 (Não autorizado)**  
Verifique se o token JWT é válido e se o backend está rodando corretamente.

**Porta em uso**  
Se a porta 3000 estiver em uso, o React iniciará automaticamente na próxima porta disponível (3001, 3002, etc.).

**Backend não conecta**  
Verifique se o backend está rodando em `http://localhost:3000` e acessível.

### ✅ Páginas Principais
- **Dashboard**: Visão geral com indicadores financeiros, saldo, entradas, despesas
- **Clientes**: Listagem, cadastro e edição de clientes com filtros avançados
- **Fornecedores**: Gestão completa de fornecedores
- **Orçamentos**: Controle de orçamentos com status (pendente, aprovado, rejeitado)
- **Despesas**: Gerenciamento de contas a pagar com alertas de vencimento
- **Entradas**: Controle de contas a receber com situação de pagamento

### 🎨 Recursos
- Design moderno e responsivo
- Sidebar colapsável (desktop e mobile)
- Filtros avançados em todas as listagens
- Cards com indicadores financeiros
- Badges de status coloridos
- Alertas de vencimento
- Loading states
- Formatação de moeda e datas em PT-BR

## 🚀 Como Executar

### Pré-requisitos
- Node.js 16+ 
- Backend da API rodando em `http://localhost:3000`

### Instalação

1. Clone o repositório e entre na pasta do frontend:
```bash
cd Kame_frontend
```

2. Instale as dependências:
```bash
npm install
```

3. **(Opcional)** Se a API estiver em outra URL, edite o arquivo `src/services/api.js`:
```javascript
const API_BASE_URL = 'http://localhost:3000/api'; // Altere se necessário
```

4. Inicie o servidor de desenvolvimento:
```bash
npm start
```

O aplicativo estará disponível em `http://localhost:3001` (ou outra porta se 3000 estiver ocupada).

## 📁 Estrutura de Pastas

```
src/
├── components/          # Componentes reutilizáveis
│   ├── Sidebar.js      # Barra lateral de navegação
│   ├── Icon.js         # Componente de ícones
│   └── layout/
│       └── AdminLayout.js  # Layout principal do admin
├── pages/              # Páginas da aplicação
│   ├── login.js       # Página de login
│   └── admin/         # Páginas administrativas
│       ├── dashboard.js
│       ├── Clientes.js
│       ├── ClienteForm.js
│       ├── Fornecedores.js
│       ├── Orcamentos.js
│       ├── Despesas.js
│       └── Entradas.js
├── services/          # Serviços e APIs
│   └── api.js        # Configuração do Axios e endpoints
├── contexts/         # Contextos React
│   └── AuthContext.js # Contexto de autenticação
├── App.js           # Componente raiz com rotas
└── index.js         # Ponto de entrada
```

## 🔐 Autenticação

O sistema utiliza JWT Bearer Token com validade de 24 horas. O token é armazenado no localStorage e incluído automaticamente em todas as requisições.

## 📊 API Endpoints Utilizados

### Autenticação
- `POST /api/auth/login` - Login
- `GET /api/auth/profile` - Perfil do usuário

### Clientes
- `GET /api/clients` - Listar clientes (com filtros)
- `GET /api/clients/:id` - Buscar cliente
- `POST /api/clients` - Criar cliente
- `PATCH /api/clients/:id` - Atualizar cliente
- `DELETE /api/clients/:id` - Excluir cliente

### Fornecedores
- `GET /api/supplier` - Listar fornecedores
- `POST /api/supplier` - Criar fornecedor
- `PATCH /api/supplier/:id` - Atualizar fornecedor
- `DELETE /api/supplier/:id` - Excluir fornecedor

### Orçamentos
- `GET /api/budget` - Listar orçamentos
- `POST /api/budget` - Criar orçamento
- `PATCH /api/budget/:id` - Atualizar orçamento
- `DELETE /api/budget/:id` - Excluir orçamento

### Despesas
- `GET /api/expense` - Listar despesas
- `POST /api/expense` - Criar despesa
- `PATCH /api/expense/:id` - Atualizar despesa
- `DELETE /api/expense/:id` - Excluir despesa

### Entradas
- `GET /api/entries` - Listar entradas
- `POST /api/entries` - Criar entrada
- `PATCH /api/entries/:id` - Atualizar entrada
- `DELETE /api/entries/:id` - Excluir entrada

## 🎨 Tecnologias

- **React 18** - Framework JavaScript
- **React Router DOM** - Roteamento
- **Axios** - Cliente HTTP
- **Tailwind CSS** - Framework CSS
- **Lucide React** - Biblioteca de ícones
- **Context API** - Gerenciamento de estado

## 📝 Próximos Passos

### Formulários a Criar
- [ ] Formulário de Fornecedores
- [ ] Formulário de Orçamentos
- [ ] Formulário de Despesas
- [ ] Formulário de Entradas

### Funcionalidades Adicionais
- [ ] Relatórios financeiros
- [ ] Gráficos e dashboards avançados
- [ ] Exportação de dados (PDF/Excel)
- [ ] Notificações de vencimento
- [ ] Gestão de usuários e permissões
- [ ] Histórico de alterações
- [ ] Backup e restauração

## 🐛 Solução de Problemas

### Erro de CORS
Se encontrar erros de CORS, certifique-se de que o backend está configurado para aceitar requisições do frontend.

### Erro 401 (Não autorizado)
Verifique se o token JWT é válido e se o backend está rodando corretamente.

### Porta em uso
Se a porta 3000 estiver em uso, o React iniciará automaticamente na próxima porta disponível (3001, 3002, etc.).

## 📄 Licença

MIT © 2024 KAME Equipamentos Industriais LTDA

## 👥 Contato

- **Email**: contato@kame.com.br
- **Website**: https://kame.com.br
