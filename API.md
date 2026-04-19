# API Sonora

API REST para classificação de áudio em tempo real com controle de lâmpada LIFX.

## Base URL

```
http://localhost:8000
```

## Autenticação

A API usa tokens JWT no header:
```
Authorization: Bearer <access_token>
```

| Token | Duração |
|-------|---------|
| Access | 15 minutos |
| Refresh | 7 dias |

---

## Endpoints

### Autenticação

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | /auth/register | Cadastrar novo usuário |
| POST | /auth/login | Fazer login |
| POST | /auth/refresh | Renovar token |

---

### Classificação de áudio

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | /classify | classifica áudio e altera cor da lâmpada |

**Corpo da requisição:**
```json
{
  "audio": "base64_string"
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

---

### Classes do usuário

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | /config/user/classes | Lista classes ativas |
| GET | /config/user/classes/all | Lista todas as classes |
| POST | /config/user/classes | Adiciona nova classe |
| PUT | /config/user/classes/{class_name} | Edita cor ou status |
| DELETE | /config/user/classes/{class_name} | Remove classe |

**GET /config/user/classes:**
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

**POST /config/user/classes:**
```json
{
  "class_name": "Dog barking",
  "color_name": "Vermelho",
  "color_hex": "#E74C3C"
}
```

**PUT /config/user/classes/{class_name}:**
```json
{
  "color_name": "Azul",
  "color_hex": "#3498DB",
  "is_active": false
}
```

---

### Lâmpada

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | /lamp/status | Ver status atual |
| POST | /lamp/power | Ligar ou desligar |
| POST | /lamp/color | Mudar cor manualmente |

**POST /lamp/power:**
```json
{
  "power": true
}
```

**POST /lamp/color:**
```json
{
  "color": "#FF0000",
  "brightness": 0.8
}
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

### Geral

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | / | Informações da API |
| GET | /health | Verificar se a API está no ar |

---

## Fluxo de uso

### Passo 1: Registrar usuário
```
POST /auth/register
{
  "email": "usuario@email.com",
  "password": "senha123"
}
```

### Passo 2: Fazer login
```
POST /auth/login
(usar form-data com username e password)
```

**retorna:**
```json
{
  "access_token": "eyJ...",
  "refresh_token": "eyJ...",
  "token_type": "bearer"
}
```

### Passo 3: Usar endpoints protegidos
```
GET /config/user/classes
Authorization: Bearer <access_token>
```

### Passo 4: Classificar áudio
```
POST /classify
Authorization: Bearer <access_token>
{
  "audio": "base64_string"
}
```

A API retorna a cor baseada nas configurações do usuário logado.

---

## Cores padrão

Quando um usuário se cadastra, ele recebe automaticamente 8 classes com cores padrão:

| Classe | Cor | Hex |
|--------|-----|-----|
| Music | Roxo | #9B59B6 |
| Speech | Amarelo | #FFE135 |
| Crying baby | Azul | #3498DB |
| Doorbell | Verde | #2ECC71 |
| Alarm | Vermelho | #E74C3C |
| Singing | Rosa | #E91E63 |
| Musical instrument | Laranja | #F39C12 |
| Silence | Branco | #FFFFFF |

---

## Modelo de áudio

- **Modelo:** AST (Audio Spectrogram Transformer)
- **Fonte:** MIT/ast-finetuned-audioset-10-10-0.4593
- **Classes:** 632 categorias de áudio
- **Detecta:** música, voz, instrumentos, sons ambiente, alertas, entre outros

---

## Documentação interativa

Acessa http://localhost:8000/docs pra usar o Swagger.

---

## Erros comuns

| Código | Descrição |
|--------|-----------|
| 401 | Token inválido ou expirado |
| 400 | Email já cadastrado ou classe já existe |
| 404 | Classe não encontrada |

---

## Variáveis de ambiente

Crie um arquivo .env em api/ com o seguinte conteúdo:

```
DATABASE_URL=mysql+pymysql://root:senha@localhost/sonora_db
SECRET_KEY=sua_chave_secreta
LIFX_TOKEN=token_lifx_opcional
```