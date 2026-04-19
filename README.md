# SONORA

Sistema de classificação de áudio em tempo real com controle de iluminação inteligente.

## O que esse projeto faz

1. Captura o áudio do ambiente usando o microfone
2. Classifica o som que está tocando (música, voz, alarme, etc)
3. Muda a cor de uma lâmpada LIFX de acordo com o som detectado

## Tecnologias utilizadas

| Tecnologia | Uso |
|------------|-------|
| Python | Linguagem principal da API |
| FastAPI | Backend REST API |
| MySQL | Banco de dados |
| JWT | Autenticação |
| AST (HuggingFace) | Modelo que classifica áudio |
| LIFX API | Controle da lâmpada smart |

## Como rodar

```bash
# 1. Instalar as dependências
pip install -r requirements.txt

# 2. Configurar o ambiente
cp api/.env.example api/.env
# Edite o .env com as suas configs

# 3. Criar o banco de dados MySQL
# Execute o script que está em database.sql

# 4. Rodar a API
cd api
uvicorn main:app --reload
```

## Estrutura do projeto

```
casacor/
├── api/
│   ├── main.py        # Rotas da API
│   ├── auth.py       # Autenticação
│   ├── config.py     # Configurações do usuário
│   ├── classify.py # Classificação de áudio
│   └── lifx_client.py
├── database.sql      # Schema do banco
├── requirements.txt
└── API.md           # Documentação completa
```

## Funcionalidades implementadas

- API com autenticação JWT
- Classificação de áudio com AST
- Integração com lâmpadas LIFX
- Banco MySQL
- Configurações por usuário