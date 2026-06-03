# SONORA

Sistema de classificação de áudio em tempo real com controle inteligente de iluminação. O sistema escuta o ambiente pelo microfone, identifica o tipo de som usando IA (modelo AST da HuggingFace) e altera automaticamente a cor de uma lâmpada LIFX de acordo com o som detectado.

---

## Funcionalidades

- Classificação de áudio em tempo real (música, voz, alarme, instrumentos, etc.)
- Controle automático de lâmpada LIFX baseado no som detectado
- Modo simulado (funciona sem lâmpada física para desenvolvimento/testes)
- Configuração personalizada de cores por classe de som
- Autenticação JWT com refresh token
- Token LIFX criptografado por usuário
- Frontend web para gravação e configuração
- Suporte a 632 categorias de som (modelo AST)

---

## Tecnologias

| Tecnologia | Função |
|---|---|
| Python + FastAPI | Backend da API REST |
| MySQL + SQLAlchemy | Banco de dados |
| JWT (python-jose) | Autenticação |
| Argon2 (passlib) | Hashing de senhas |
| HuggingFace Transformers (AST) | Modelo de classificação de áudio |
| PyTorch | Framework de ML |
| LIFX Cloud API | Controle da lâmpada |
| Fernet (cryptography) | Criptografia do token LIFX |
| React 19 + TypeScript | Frontend |
| Vite 8 | Build tool |
| TanStack React Router | Roteamento |
| TailwindCSS 3.4 | Estilização |
| Axios | HTTP client |
| Sonner | Notificações |

---

## Estrutura do projeto

```
casacor/
├── api/                          # Backend Python/FastAPI
│   ├── main.py                   # Rotas da API (18 endpoints)
│   ├── auth.py                   # Autenticação JWT + ORM SQLAlchemy
│   ├── classify.py               # Modelo AST (Audio Spectrogram Transformer)
│   ├── config.py                 # Gerenciamento de classes/cores por usuário
│   ├── lifx_client.py            # Integração com API LIFX Cloud
│   ├── models.py                 # Schemas Pydantic
│   ├── requirements.txt          # Dependências Python
│   └── .env                      # Variáveis de ambiente
├── frontend/                     # Frontend React/TypeScript
│   ├── src/
│   │   ├── api/                  # Chamadas HTTP organizadas por domínio
│   │   ├── components/           # Componentes React
│   │   ├── context/              # Estado global de autenticação
│   │   ├── lib/                  # Axios config + cookies
│   │   ├── pages/                # Layouts de página
│   │   ├── types/                # Interfaces TypeScript
│   │   ├── router.ts             # Configuração de rotas
│   │   └── main.tsx              # Entry point
│   ├── package.json
│   └── vite.config.ts
├── database.sql                  # Schema v1 (2 tabelas)
├── database_v2.sql               # Schema v2 (4 tabelas + dados de exemplo + consultas SQL)
└── README.md
```

---

## Pré-requisitos

- Python 3.10+
- Node.js 18+
- MySQL instalado e rodando
- Conta na LIFX (opcional, para controle de lâmpada física)

---

## Instalação

### Backend

```bash
# 1. Clone o repositório
git clone https://github.com/seu-usuario/casacor.git
cd casacor

# 2. Crie e ative o ambiente virtual
python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate  # Linux/Mac

# 3. Instale as dependências
pip install -r api/requirements.txt

# 4. Configure as variáveis de ambiente
# Edite o arquivo api/.env:
#   SECRET_KEY=sua_chave_secreta
#   DATABASE_URL=mysql+pymysql://usuario:senha@localhost/sonora_db
#   LIFX_TOKEN=seu_token_lifx (opcional)

# 5. Crie o banco de dados MySQL
mysql -u root -p < database.sql

# 6. Rode a API
cd api
uvicorn main:app --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

---

## Acessos

- **API:** http://localhost:8000
- **Swagger UI:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc
- **Frontend:** http://localhost:5173

---

## Endpoints da API

### Autenticação

| Método | Rota | Descrição |
|---|---|---|
| `POST` | `/auth/register` | Cadastrar novo usuário (cria 8 classes padrão automaticamente) |
| `POST` | `/auth/login` | Login (retorna accessToken + refreshToken) |
| `POST` | `/auth/refresh` | Renovar tokens com refreshToken |
| `GET` | `/users/me` | Dados do usuário autenticado |

### Classificação

| Método | Rota | Descrição |
|---|---|---|
| `POST` | `/classify` | Envia arquivo WAV (UploadFile, max 10MB) para classificar som e alterar cor da lâmpada |

### Configuração de classes

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/config/user/classes` | Listar classes ativas do usuário |
| `GET` | `/config/user/classes/all` | Listar todas as classes (ativas e inativas) |
| `GET` | `/ai/classes/all` | Listar todas as 632 classes do modelo AST |
| `POST` | `/config/user/classes` | Adicionar nova classe |
| `PUT` | `/config/user/classes/{class_name}` | Editar cor ou status de uma classe |
| `DELETE` | `/config/user/classes/{class_name}` | Remover (desativar) uma classe |

### Controle da lâmpada

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/lamp/status` | Status atual da lâmpada |
| `POST` | `/lamp/power` | Ligar/desligar lâmpada |
| `POST` | `/lamp/color` | Mudar cor e brilho manualmente |

### Token LIFX

| Método | Rota | Descrição |
|---|---|---|
| `POST` | `/user/lifx-token` | Salvar token LIFX (criptografado no banco) |
| `GET` | `/user/lifx-token/status` | Verificar se token está configurado e válido |

### Gerais

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/` | Informações da API |
| `GET` | `/health` | Health check |

---

## Classes de som padrão

Ao se cadastrar, o usuário recebe automaticamente 8 classes:

| Classe | Cor | Hex |
|---|---|---|
| Music | Roxo | `#9B59B6` |
| Speech | Amarelo | `#FFE135` |
| Crying and baby | Azul | `#3498DB` |
| Doorbell | Verde | `#2ECC71` |
| Alarm | Vermelho | `#E74C3C` |
| Singing | Rosa | `#E91E63` |
| Musical instrument | Laranja | `#F39C12` |
| Silence | Branco | `#FFFFFF` |

---

## Modelo de classificação

O sistema usa o modelo **AST (Audio Spectrogram Transformer)** da HuggingFace:
- Modelo: `MIT/ast-finetuned-audioset-10-10-0.4593`
- Precisão: 45,93% no AudioSet
- Categorias: 632 tipos de sons
- Framework: PyTorch

O áudio é pré-processado (mono, 16kHz) antes da inferência.

---

## Autenticação

A API usa OAuth2 com JWT:

| Token | Validade | Uso |
|---|---|---|
| `accessToken` | 15 minutos | Endpoints protegidos |
| `refreshToken` | 7 dias | Renovar accessToken |

O frontend gerencia renovação automática via Axios interceptors.

---

## Modo simulado LIFX

Se nenhum token LIFX estiver configurado, o sistema opera em **modo simulado**: mantém estado interno da lâmpada (power, cor, brilho) em memória e retorna respostas simuladas. Isso permite desenvolvimento e testes sem lâmpada física.

---

## Segurança

- Senhas hasheadas com **Argon2** (estado da arte)
- Token LIFX criptografado com **Fernet** (derivado do SECRET_KEY) antes de armazenar no banco
- Autenticação via **JWT** com tokens de curta duração
- `.env` no `.gitignore` (não versionado)