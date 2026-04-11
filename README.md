# CASACOR 

Sistema de classificação de áudio em tempo real com controle de iluminação smart.

## Ideia do projeto

Este projeto visa criar um sistema inteligente que:

1. **Captura áudio** do ambiente através do microfone
2. **Classifica o som** detectado em tempo real (música, fala, som ambiente, etc.)
3. **Dispara efeitos visuais** em uma lâmpada LIFX com base na classificação do áudio

## Arquitetura

```
[Front-end React] ←→ [API FastAPI] ←→ [Lâmpada LIFX]
                          ↓
                   [Modelo AST]
```

## Tecnologias

| Tecnologia | Uso |
|------------|-----|
| **Python** | Linguagem principal da API |
| **FastAPI** | Backend REST API |
| **JWT** | Autenticação (access + refresh tokens) |
| **PyTorch** | Modelo de deep learning |
| **Transformers (HuggingFace)** | Classificação de áudio (AST) |
| **LIFX API** | Controle da lâmpada smart |

## Estrutura do Projeto

```
CASACOR/
├── api/                    # Backend FastAPI
│   ├── main.py            # Endpoints da API
│   ├── auth.py            # Autenticação JWT
│   ├── models.py          # Schemas Pydantic
│   ├── config.py          # Configuração de cores
│   ├── classify.py        # Classificação com AST
│   ├── lifx_client.py     # Cliente LIFX
│   ├── .env               # Variáveis de ambiente
│   └── .env.example       # Template
├── audio/                  # (Legacy) Scripts de áudio
├── devices/                # (Legacy) Controle de dispositivos
├── requirements.txt        # Dependências Python
└── README.md
```

## API Endpoints

### Autenticação
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/auth/register` | Cadastrar usuário |
| POST | `/auth/login` | Fazer login |
| POST | `/auth/refresh` | Renovar access token |

### Classificação
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/classify` | Classifica áudio e aplica cor |

### Configuração
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/config/colors` | Ver todas as cores |
| GET | `/config/colors/{classe}` | Ver cor de uma classe |
| PUT | `/config/colors/{classe}` | Alterar cor |
| POST | `/config/colors` | Adicionar nova cor |

### Lâmpada
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/lamp/status` | Status da lâmpada |
| POST | `/lamp/power` | Ligar/Desligar |
| POST | `/lamp/color` | Mudar cor manual |

## Cores Padrão

| Classe | Cor | Hex |
|--------|-----|-----|
| Music | Roxo | #9B59B6 |
| Speech | Amarelo | #FFE135 |
| Crying and baby | Azul | #3498DB |
| Doorbell | Verde | #2ECC71 |
| Alarm | Vermelho | #E74C3C |
| Singing | Rosa | #E91E63 |
| Musical instrument | Laranja | #F39C12 |
| Silence | Branco | #FFFFFF |

## Como Rodar

### 1. Instalar dependências

```bash
pip install -r requirements.txt
```

### 2. Configurar variáveis de ambiente

```bash
cp api/.env.example api/.env
```

Edite `api/.env`:
```
SECRET_KEY=sua_chave_secreta
LIFX_TOKEN=seu_token_lifx
```

### 3. Rodar a API

```bash
cd api
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 4. Acessar documentação

```
http://localhost:8000/docs
```

## Modelo AST

O modelo **Audio Spectrogram Transformer (AST)** foi desenvolvido pelo MIT e treinado no AudioSet.

| Característica | Detalhe |
|----------------|---------|
| **Modelo** | `MIT/ast-finetuned-audioset-10-10-0.4593` |
| **Classes** | 632 categorias |
| **Precisão** | State-of-the-art em classificação de áudio |
| **Tamanho** | ~87MB |

### Categorias que detecta:

- **Música:** Music, Pop music, Rock music, Jazz, Classical music, etc.
- **Voz:** Speech, Singing, Rapping, etc.
- **Instrumentos:** Guitar, Piano, Drum, etc.
- **Sons ambiente:** Rain, Thunder, Car, Bird, Dog, etc.
- **Alertas:** Doorbell, Alarm, Siren, etc.
- **Humanos:** Crying, Baby, Coughing, etc.

## Autenticação

### JWT Tokens

- **Access Token**: Dura 15 minutos
- **Refresh Token**: Dura 7 dias

### Fluxo:

```
1. POST /auth/register → Recebe tokens
2. POST /auth/login → Recebe tokens
3. Usa access_token no header: Authorization: Bearer <token>
4. Quando expira → POST /auth/refresh
```

## Configuração LIFX

Para controlar a lâmpada LIFX:

1. Crie uma conta em https://cloud.lifx.com
2. Gere um token em Settings
3. Adicione no `.env`:
   ```
   LIFX_TOKEN=seu_token_aqui
   ```

**Sem token**: A API funciona em modo simulado (não conecta na lâmpada real).

## Status do Projeto

- [x] Backend FastAPI com autenticação JWT
- [x] Classificação de áudio com AST
- [x] Integração com LIFX (modo cloud)
- [x] Configuração de cores por classe
- [x] Documentação automática Swagger
- [ ] Frontend React
- [ ] Banco de dados PostgreSQL
- [ ] Modo local LIFX (sem internet)
