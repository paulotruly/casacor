# SONORA API

API REST para classificação de áudio em tempo real com controle de iluminação inteligente. O sistema detecta sons ambiente (música, voz, alarme, etc.) e altera a cor de uma lâmpada LIFX automaticamente.

---

## O que esse projeto faz

Imagine que você está em uma sala e está tocando música. A lâmpada automaticamente muda para roxo. Alguém começa a falar, a cor muda para amarelo. Um alarme dispara, a lâmpada fica vermelha. Isso é o que o SONORA faz!

O sistema é composto por:

1. **Captura de áudio** - Usa o microfone do computador para ouvir o ambiente
2. **Classificação** - Um modelo de inteligência artificial (AST) identifica o tipo de som
3. **Controle da lâmpada** - Uma lâmpada LIFX smart muda de cor baseada no som detectado

---

## Tecnologias utilizadas

| Tecnologia | Função |
|------------|---------------|
| Python + FastAPI | Backend da API REST |
| MySQL | Banco de dados para salvar usuários e configurações |
| JWT | Sistema de autenticação (tokens de acesso) |
| AST (HuggingFace) | Modelo de machine learning que classifica áudio |
| LIFX API | Controla a lâmpada smart pela internet |

---

## Como começar

### Pré-requisitos

- Python 3.10+
- MySQL instalado e rodando
- Uma conta na LIFX (opcional, para controle da lâmpada)

### Instalação

```bash
# 1. Clone o repositório
git clone https://github.com/seu-usuario/casacor.git
cd casacor

# 2. Crie um ambiente virtual (recomendado)
python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate  # Linux/Mac

# 3. Instale as dependências
pip install -r requirements.txt

# 4. Configure as variáveis de ambiente
# Copie o arquivo de exemplo e preencha com suas configurações
cp api/.env.example api/.env

# 5. Crie o banco de dados MySQL
# Execute o script database.sql no MySQL
mysql -u root -p < database.sql

# 6. Rode a API
cd api
uvicorn main:app --reload
```

### Configuração do ambiente

Edite o arquivo `api/.env`:

```
# Conexão com o banco de dados MySQL
DATABASE_URL=mysql+pymysql://usuario:senha@localhost/sonora_db

# Chave secreta para gerar tokens JWT (mude para algo seguro!)
SECRET_KEY=sua_chave_secreta

# Token da API LIFX (opcional, apenas se quiser controlar lâmpada)
LIFX_TOKEN=seu_token_lifx_aqui
```

### Rodando a API

```bash
cd api
uvicorn main:app --reload
```

A API estará disponível em:
- **API:** http://localhost:8000
- **Swagger UI (documentação interativa):** http://localhost:8000/docs
- **ReDoc (documentação alternativa):** http://localhost:8000/redoc

---

## Fluxo de autenticação

A API usa o padrão OAuth2 com JWT (JSON Web Tokens). Quando você faz login, recebe dois tokens:

| Token | Prazo de validade | Para que serve |
|-------|-------------------|---------------|
| `accessToken` | 15 minutos | Usar nos endpoints protegidos |
| `refreshToken` | 7 dias | Renovar o accessToken quando expirar |

### Passo a passo para usar a API

#### 1. Cadastre um novo usuário

```bash
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "usuario@email.com", "password": "minhasenha123"}'
```

Resposta:
```json
{
  "message": "Usuário registrado!"
}
```

#### 2. Faça login

```bash
curl -X POST http://localhost:8000/auth/login \
  -d "username=usuario@email.com&password=minhasenha123"
```

Resposta:
```json
{
  "id": 1,
  "email": "usuario@email.com",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "tokenType": "bearer"
}
```

#### 3. Use o token nos endpoints protegidos

```bash
curl -X GET http://localhost:8000/config/user/classes \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## Endpoints

### Autenticação

#### POST /auth/register - Cadastrar novo usuário

Cria uma nova conta de usuário no sistema. Após o cadastro, o usuário recebe automaticamente 8 classes de sons com cores padrão.

**Requisição:**
```json
{
  "email": "usuario@email.com",
  "password": "minhasenha123"
}
```

**Resposta:**
```json
{
  "message": "Usuário registrado!"
}
```

**Códigos de resposta:**
- `200` - Usuário criado com sucesso
- `400` - Email já está cadastrado

---

#### POST /auth/login - Fazer login

Autentica o usuário e retorna tokens JWT para acessar os endpoints protegidos.

**Requisição (form-data):**
```
username: usuario@email.com
password: minhasenha123
```

**Resposta:**
```json
{
  "id": 1,
  "email": "usuario@email.com",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "tokenType": "bearer"
}
```

**Exemplo completo em JavaScript:**
```javascript
fetch('http://localhost:8000/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
  },
  body: 'username=usuario@email.com&password=minhasenha123'
})
.then(res => res.json())
.then(data => {
  // Salva o token para usar depois
  localStorage.setItem('accessToken', data.accessToken);
  console.log('Login realizado!', data);
});
```

**Códigos de resposta:**
- `200` - Login realizado com sucesso
- `401` - Email ou senha incorretos

---

#### POST /auth/refresh - Renovar token de acesso

Quando o accessToken expira, use o refreshToken para obter um novo par de tokens sem precisar fazer login novamente.

**Requisição:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Resposta:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "tokenType": "bearer"
}
```

---

#### GET /users/me - Dados do usuário atual

Retorna as informações do usuário que está logado (baseado no token de acesso).

**Requisição:**
```bash
curl -X GET http://localhost:8000/users/me \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Resposta:**
```json
{
  "id": 1,
  "email": "usuario@email.com"
}
```

---

### Classificação de áudio

#### POST /classify - Classificar som e mudar cor da lâmpada

Envia um áudio codificado em base64 para ser classificado. O sistema detecta o tipo de som e altera a cor da lâmpada LIFX de acordo com as configurações do usuário.

**Requisição:**
```json
{
  "audio": "base64_string_aqui..."
}
```

**Resposta:**
```json
{
  "detected_class": "Music",
  "confidence": 0.95,
  "secondary_classes": [["Speech", 0.10], ["Alarm", 0.05]],
  "applied_color": "Roxo",
  "color_hex": "#9B59B6"
}
```

**Explicação dos campos:**

| Campo | Descrição |
|-------|-----------|
| `detected_class` | O tipo de som detectado (Music, Speech, Alarm, etc.) |
| `confidence` | Probabilidade de acerto do modelo (0 a 1) |
| `secondary_classes` | Outros sons possíveis no áudio |
| `applied_color` | Nome da cor aplicada na lâmpada |
| `color_hex` | Código hexadecimal da cor |

---

### Configuração de cores

Cada usuário pode configurar qual cor aparece para cada tipo de som. Quando se cadastra, recebe 8 classes padrão.

#### GET /config/user/classes - Listar classes ativas

Retorna todas as classes que estão ativas para o usuário logado.

**Resposta:**
```json
[
  {
    "class_name": "Music",
    "color_name": "Roxo",
    "color_hex": "#9B59B6",
    "is_active": true
  },
  {
    "class_name": "Speech",
    "color_name": "Amarelo",
    "color_hex": "#FFE135",
    "is_active": true
  }
]
```

---

#### GET /config/user/classes/all - Listar todas as classes

Retorna todas as classes do usuário, incluindo as desativadas.

**Resposta:**
```json
[
  {
    "class_name": "Music",
    "color_name": "Roxo",
    "color_hex": "#9B59B6",
    "is_active": true
  },
  {
    "class_name": "Speech",
    "color_name": "Amarelo",
    "color_hex": "#FFE135",
    "is_active": true
  },
  {
    "class_name": "Doorbell",
    "color_name": "Verde",
    "color_hex": "#2ECC71",
    "is_active": false
  }
]
```

---

#### POST /config/user/classes - Adicionar nova classe

Cria uma nova configuração de cor para um tipo de som.

**Requisição:**
```json
{
  "class_name": "Dog barking",
  "color_name": "Vermelho",
  "color_hex": "#E74C3C"
}
```

**Resposta:**
```json
{
  "class_name": "Dog barking",
  "color_name": "Vermelho",
  "color_hex": "#E74C3C",
  "is_active": true
}
```

---

#### PUT /config/user/classes/{class_name} - Editar cor ou status

Altera a cor de uma classe ou ativa/desativa ela.

**Requisição:**
```json
{
  "color_name": "Azul",
  "color_hex": "#3498DB",
  "is_active": true
}
```

**Resposta:**
```json
{
  "message": "Classe atualizada",
  "class_name": "Music"
}
```

---

#### DELETE /config/user/classes/{class_name} - Remover classe

Desativa uma classe. A classe não é apagada do banco, apenas fica inativa.

**Resposta:**
```json
{
  "message": "Classe removida",
  "class_name": "Doorbell"
}
```

---

### Lâmpada

#### GET /lamp/status - Ver status da lâmpada

Retorna o estado atual da lâmpada LIFX (ligada/desligada, cor, brilho).

**Resposta:**
```json
{
  "power": "on",
  "color": "#FF0000",
  "brightness": 0.8
}
```

---

#### POST /lamp/power - Ligar ou desligar

Liga ou desliga a lâmpada manualmente.

**Requisição:**
```json
{
  "power": true
}
```

**Resposta:**
```json
{
  "power": "on"
}
```

---

#### POST /lamp/color - Mudar cor manualmente

Altera a cor e brilho da lâmpada sem fazer classificação de áudio.

**Requisição:**
```json
{
  "color": "#FF5500",
  "brightness": 0.6
}
```

**Resposta:**
```json
{
  "color": "#FF5500",
  "brightness": 0.6
}
```

---

### Endpoints gerais

#### GET / - Informações da API

Retorna informações gerais sobre a API.

**Resposta:**
```json
{
  "message": "SONORA API",
  "version": "1.0.0",
  "docs": "/docs",
  "lifx_configured": true
}
```

---

#### GET /health - Verificar status

Endpoint simples para verificar se a API está funcionando.

**Resposta:**
```json
{
  "status": "ok"
}
```

---

## Classes de sons disponíveis

Quando um usuário se cadastra, ele recebe automaticamente 8 classes com cores padrão. Essas classes representam os tipos mais comuns de sons:

| Classe | Cor padrão | Hex |
|--------|------------|-----|
| Music (música) | Roxo | #9B59B6 |
| Speech (voz/fala) | Amarelo | #FFE135 |
| Crying baby (bebê chorando) | Azul | #3498DB |
| Doorbell (campainha) | Verde | #2ECC71 |
| Alarm (alarme) | Vermelho | #E74C3C |
| Singing (canto) | Rosa | #E91E63 |
| Musical instrument (instrumento) | Laranja | #F39C12 |
| Silence (silêncio) | Branco | #FFFFFF |

O usuário pode adicionar mais classes, mudar cores ou desativar classes que não quer usar.

---

## Modelo de classificação

O sistema usa o modelo **AST (Audio Spectrogram Transformer)** da HuggingFace para classificar áudio. Este modelo é capaz de identificar mais de 600 categorias diferentes de sons.

**Detalhes técnicos:**
- Modelo: MIT/ast-finetuned-audioset-10-10-0.4593
- Base: Audio Spectrogram Transformer (AST)
- Precisão: 45.93% no AudioSet
- Categorias: 632 tipos de sons

O modelo detecta coisas como:
- Música e gêneros musicais
- Voz humana e fala
- Instrumentos musicais
- Sons de animais (latido, miado, etc.)
- Alertas e alarmes
- Sons de natureza
- Sons urbanos
- E muito mais!

---

## Códigos de erro

| Código | Significado | O que fazer |
|--------|-------------|-------------|
| 400 | Bad Request - Dados inválidos | Verifique o formato do corpo da requisição |
| 401 | Unauthorized - Token inválido | Faça login novamente ou renove o token |
| 404 | Not Found - Recurso não existe | Verifique se o recurso existe |
| 500 | Internal Server Error - Erro no servidor | Tente novamente ou contate o desenvolvedor |

---

## Estrutura do projeto

```
casacor/
├── api/
│   ├── main.py           # Rotas da API (endpoints)
│   ├── auth.py           # Lógica de autenticação (JWT, hashing)
│   ├── config.py         # Gerenciamento de classes do usuário
│   ├── classify.py       # Integração com modelo de ML
│   ├── lifx_client.py    # Comunicação com API da LIFX
│   ├── models.py         # Modelos Pydantic (validação de dados)
│   └── .env.example      # Exemplo de variáveis de ambiente
├── src/                  # Frontend React (próximas versões)
├── database.sql          # Script SQL para criar banco
├── requirements.txt      # Dependências Python
├── README.md             # Este arquivo
└── API.md               # Documentação da API
```

---