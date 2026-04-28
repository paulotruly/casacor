# API SONORA - Documentação Técnica

API REST completa para classificação de áudio em tempo real com controle de iluminação inteligente.

---

## Base URL

```
http://localhost:8000
```

---

## Autenticação

A API usa o padrão **OAuth2 com JWT** (JSON Web Tokens) para autenticação. Quando você faz login, recebe dois tokens:

| Token | Prazo | Para que serve |
|-------|-------|----------------|
| `accessToken` | 15 minutos | Autorização nos endpoints protegidos |
| `refreshToken` | 7 dias | Renovar o accessToken |

### Como usar tokens

Adicione o token no cabeçalho de todas as requisições protegidas:

```bash
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Autenticação

### Cadastrar novo usuário

Cria uma conta nova no sistema. Após o cadastro, o usuário recebe automaticamente 8 classes de sons com cores padrão configuradas.

```bash
POST http://localhost:8000/auth/register
Content-Type: application/json

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

**Código de resposta:**
- `200` - Usuário criado com sucesso
- `400` - Email já cadastrado no sistema

---

### Fazer login

Autentica o usuário e retorna tokens JWT para acessar os endpoints protegidos. O sistema verifica se o email e senha estão corretos, e se estiver tudo certo, gera os tokens de acesso.

```bash
POST http://localhost:8000/auth/login
Content-Type: application/x-www-form-urlencoded

username=usuario@email.com&password=minhasenha123
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

**Exemplo em JavaScript:**
```javascript
fetch('http://localhost:8000/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
  },
  body: 'username=usuario@email.com&password=minhasenha123'
})
.then(res => res.json())
.then(console.log);
```

**Saída:**
```json
{
  "id": 1,
  "email": "usuario@email.com",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "tokenType": "bearer"
}
```

**Código de resposta:**
- `200` - Login realizado com sucesso
- `401` - Email ou senha incorretos

---

### Renovar token

Quando o accessToken expira, use este endpoint para obter novos tokens sem precisar fazer login novamente. O refreshToken tem validade de 7 dias.

```bash
POST http://localhost:8000/auth/refresh
Content-Type: application/json

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

**Código de resposta:**
- `200` - Tokens renovados com sucesso
- `401` - Refresh token inválido ou expirado

---

### Obter dados do usuário atual

Retorna as informações do usuário que está logado. O sistema extrai o email do token JWT e busca os dados correspondentes no banco.

```bash
GET http://localhost:8000/users/me
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Resposta:**
```json
{
  "id": 1,
  "email": "usuario@email.com"
}
```

**Código de resposta:**
- `200` - Dados retornados com sucesso
- `401` - Token inválido ou expirado

---

## Classificação de áudio

### Classificar som e mudar cor da lâmpada

Envia um áudio codificado em base64 para ser classificado. O sistema usa um modelo de inteligência artificial para identificar o tipo de som e altera a cor da lâmpada LIFX de acordo com as configurações do usuário.

Se o usuário não tiver configurado uma cor para o som detectado, o sistema usa branco (#FFFFFF) como padrão.

```bash
POST http://localhost:8000/classify
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "audio": "base64_string_aqui_do_audio_em_bytes"
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
| `detected_class` | O tipo de som mais provável detectado (Music, Speech, Alarm, etc.) |
| `confidence` | Probabilidade de acerto do modelo, variando de 0 a 1. Quanto mais próximo de 1, maior a certeza |
| `secondary_classes` | Lista de outros sons possíveis no áudio, ordenada por probabilidade |
| `applied_color` | Nome da cor que foi aplicada na lâmpada baseado nas configurações do usuário |
| `color_hex` | Código hexadecimal da cor (ex: #FF0000 = vermelho) |

**Código de resposta:**
- `200` - Classificação realizada com sucesso
- `401` - Token inválido ou expirado

---

## Configuração de cores

Cada usuário pode configurar qual cor aparece na lâmpada para cada tipo de som. Quando se cadastra, o usuário recebe automaticamente 8 classes de sons com cores padrão.

### Listar classes ativas

Retorna todas as classes que estão ativadas para o usuário logado. Apenas classes ativas são usadas na classificação de áudio.

```bash
GET http://localhost:8000/config/user/classes
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

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

### Listar todas as classes

Retorna todas as classes do usuário, incluindo as que foram desativadas. Útil para ver todas as configurações e ativar classes que estavam inativas.

```bash
GET http://localhost:8000/config/user/classes/all
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

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
    "class_name": "Doorbell",
    "color_name": "Verde",
    "color_hex": "#2ECC71",
    "is_active": false
  }
]
```

---

### Adicionar nova classe

Cria uma nova configuração de cor para um tipo de som personalizado. O nome da classe pode ser qualquer string que represente o som que você quer configurar.

```bash
POST http://localhost:8000/config/user/classes
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

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

**Código de resposta:**
- `200` - Classe criada com sucesso
- `400` - Classe já existe para este usuário

---

### Editar cor ou status

Altera a cor de uma classe existente ou ativa/desativa ela. Todos os campos são opcionais - você pode alterar apenas o que precisa.

```bash
PUT http://localhost:8000/config/user/classes/{class_name}
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

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

**Código de resposta:**
- `200` - Classe atualizada com sucesso
- `404` - Classe não encontrada

---

### Remover classe

Desativa uma classe do usuário. A classe não é apagada do banco de dados, apenas fica inativa. Isso permite que o usuário possa reativar depois se quiser.

```bash
DELETE http://localhost:8000/config/user/classes/{class_name}
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Resposta:**
```json
{
  "message": "Classe removida",
  "class_name": "Doorbell"
}
```

**Código de resposta:**
- `200` - Classe removida com sucesso
- `404` - Classe não encontrada

---

## Lâmpada

### Ver status da lâmpada

Retorna o estado atual da lâmpada LIFX, incluindo se está ligada ou desligada, qual a cor atual e o nível de brilho.

```bash
GET http://localhost:8000/lamp/status
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Resposta:**
```json
{
  "power": "on",
  "color": "#FF0000",
  "brightness": 0.8
}
```

---

### Ligar ou desligar

Liga ou desliga a lâmpada manualmente. O comando é enviado diretamente para a lâmpada via API da LIFX.

```bash
POST http://localhost:8000/lamp/power
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

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

### Mudar cor manualmente

Altera a cor e brilho da lâmpada sem passar pelo sistema de classificação de áudio. Útil para testes ou configurações manuais.

```bash
POST http://localhost:8000/lamp/color
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

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

## Endpoints gerais

### Informações da API

Retorna informações gerais sobre a API, incluindo versão e links para documentação.

```bash
GET http://localhost:8000/
```

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

### Verificar status da API

Endpoint simples para verificar se a API está funcionando. Útil para monitoramentos e health checks.

```bash
GET http://localhost:8000/health
```

**Resposta:**
```json
{
  "status": "ok"
}
```

---

## Classes de sons padrão

Quando um usuário se cadastra, ele recebe automaticamente 8 classes de sons com cores padrão. Essas classes representam os tipos mais comuns de sons ambiente:

| Classe | Descrição | Cor padrão | Hex |
|--------|-----------|------------|-----|
| Music | Música tocando | Roxo | #9B59B6 |
| Speech | Voz humana / conversa | Amarelo | #FFE135 |
| Crying baby | Bebê chorando | Azul | #3498DB |
| Doorbell | Som de campainha | Verde | #2ECC71 |
| Alarm | Alarme de emergência | Vermelho | #E74C3C |
| Singing | Canto / performance musical | Rosa | #E91E63 |
| Musical instrument | Som de instrumentos | Laranja | #F39C12 |
| Silence | Silêncio / sons muito baixos | Branco | #FFFFFF |

---

## Códigos de erro

| Código | Significado | Causa comum |
|--------|-------------|-------------|
| 400 | Bad Request | Dados enviados no formato errado ou faltando campos |
| 401 | Unauthorized | Token inválido, expirado ou não fornecido |
| 404 | Not Found | Recurso solicitado não existe (ex: classe não encontrada) |
| 500 | Internal Server Error | Erro interno no servidor |

---

## Documentação interativa

A API possui documentação interativa gerada automaticamente pelo Swagger. Acesse http://localhost:8000/docs para testar todos os endpoints diretamente no navegador.

---

## Variáveis de ambiente

Configure estas variáveis no arquivo `api/.env`:

```bash
# Conexão com o banco de dados MySQL
DATABASE_URL=mysql+pymysql://usuario:senha@localhost/sonora_db

# Chave secreta para assinar tokens JWT
SECRET_KEY=sua_chave_secreta_aqui

# Token da API LIFX (opcional)
LIFX_TOKEN=seu_token_lifx
```