"""
main.py - Rotas da API SONORA
"""

from fastapi.middleware.cors import CORSMiddleware

from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from models import (
    LoginResponse, UserCreate, UserLogin, Token, TokenRefresh,
    ClassifyRequest, ClassifyResponse,
    ColorConfig, ColorConfigUpdate,
    LampStatus, LampColor, LampPower,
    UserClassificationIn, UserClassificationOut, UserClassificationUpdate, LifxTokenUpdate
)

from auth import (
    encrypt_lifx_token, decrypt_lifx_token, get_password_hash, verify_password,
    create_access_token, create_refresh_token, verify_token,
    get_current_user, get_db, get_user_by_email, create_user, User
)

import config as color_config
import classify as audio_classifier
import lifx_client


app = FastAPI(
    title="SONORA API",
    description="API para controlar lâmpada LIFX com base em classificação de áudio",
    version="1.0.0"
)

# CORS: permite que o front-end (em outra porta) faça requisições
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================
# ROTAS DE AUTENTICAÇÃO
# ============================================================

@app.get("/users/me")
def get_current_user_info(current_user: dict = Depends(get_current_user)):
    """retorna dados do usuário atual"""
    return {"id": current_user["id"], "email": current_user["email"]}

@app.post("/auth/register")
def register(user: UserCreate, db: Session = Depends(get_db)):
    """
    rota para registrar um novo usuário
    """
    # verifica se o email já existe
    db_user = get_user_by_email(db, user.email)
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email já cadastrado"
        )
    
    # cria o usuário no banco
    hashed = get_password_hash(user.password)
    create_user(db, user.email, hashed)

    # pega o usuário criado pra pegar o id e cria as classes padrão
    db_user = get_user_by_email(db, user.email)
    color_config.initialize_user_classes(db, db_user.id)
    return {"message": "Usuário registrado!"}

@app.post("/auth/login", response_model=LoginResponse)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """
    rota para fazer login e obter tokens JWT
    """
    user_email = form_data.username
    password = form_data.password
    
    # busca o usuário no banco
    user = get_user_by_email(db, user_email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciais inválidas"
        )
    
    # verifica a senha
    if not verify_password(password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciais inválidas"
        )
    
    # cria os tokens
    access_token = create_access_token(data={"sub": user_email})
    refresh_token = create_refresh_token(data={"sub": user_email})
    
    return LoginResponse(
        id = user.id,
        email = user_email,
        accessToken = access_token,
        refreshToken = refresh_token,
        tokenType="Bearer"
    )


@app.post("/auth/refresh", response_model=Token)
def refresh_token(token_data: TokenRefresh):
    """
    rota para obter um novo token de acesso usando o token de refresh
    """
    payload = verify_token(token_data.refresh_token, "refresh")
    
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token inválido ou expirado"
        )
    
    email = payload.get("sub")
    new_access_token = create_access_token(data={"sub": email})
    new_refresh_token = create_refresh_token(data={"sub": email})
    
    return Token(access_token=new_access_token, refresh_token=new_refresh_token)

# ============================================================
# ROTAS DE CLASSIFICAÇÃO DE ÁUDIO
# ============================================================

@app.post("/classify", response_model=ClassifyResponse)
async def classify_audio_endpoint(
    audio: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    rota para classificar áudio e alterar a cor da lâmpada
    """
    user_id = current_user["id"]
    user = db.query(User).filter(User.id == user_id).first() # busca o usuário no banco de dados usando o ID do token JWT
    
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuário não encontrado")

    # lê o arquivo de áudio
    content = await audio.read()
    
    # validar se arquivo está vazio
    if len(content) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Arquivo de áudio vazio"
        )
    
    # validar tamanho do arquivo (máximo 10MB)
    max_size = 10 * 1024 * 1024  # 10MB
    if len(content) > max_size:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="Arquivo muito grande (máximo 10MB)"
        )
    
    # tentar classificar o áudio
    try:
        resultado = audio_classifier.classify_audio(content)
    except ValueError as e:
        # erro relacionado ao formato ou leitura do arquivo
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        # erro inesperado
        print(f"Erro inesperado ao classificar áudio: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao processar o áudio. Verifique se é um arquivo WAV válido."
        )
    
    classe_detectada = resultado["detected_class"]
    confianca = resultado["confidence"]
    classes_secundarias = resultado["secondary_classes"]
    cor_info = color_config.get_user_color_for_class(db, user_id, classe_detectada) # obtém a cor configurada para ESSE usuário
    # se o usuário não tiver configurado essa classe, usa branco
    if cor_info is None:
        cor_info = {"name": "Branco", "hex": "#FFFFFF"}
    cor_nome = cor_info["name"]
    cor_hex = cor_info["hex"]

    # descriptografa o token LIFX do usuário
    token = None
    if user.liftx_token:
        try:
            token = decrypt_lifx_token(user.liftx_token)
        except Exception as e:
            print("Erro ao descriptografar token:", e)
            token = None
    # tenta mudar a cor da lâmpada se o token estiver configurado
    if token:
        try:
            lifx_client.set_color(
                cor_hex,
                brightness=0.75,
                token=token
            )
        except Exception as e:
            print("Erro LIFX:", e)

    return ClassifyResponse(
        detected_class=classe_detectada,
        confidence=confianca,
        secondary_classes=classes_secundarias,
        applied_color=cor_nome,
        color_hex=cor_hex
    )

# ============================================================
# ROTAS DE CONFIGURAÇÃO DE CORES
# ============================================================

@app.get("/config/user/classes", response_model=list[UserClassificationOut])
def get_user_active_classes(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """lista todas as classes ativas do usuário logado"""
    user_id = current_user["id"]
    configs = color_config.get_user_classifications(db, user_id)
    
    # filtra só as ativas
    ativas = [c for c in configs if c.is_active]
    
    return [
        UserClassificationOut(
            class_name=c.class_name,
            color_name=c.color_name,
            color_hex=c.color_hex,
            is_active=c.is_active
        )
        for c in ativas
    ]

@app.get("/config/user/classes/all", response_model=list[UserClassificationOut])
def get_all_user_classes(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """lista todas as classes do usuário (ativas e inativas)"""
    user_id = current_user["id"]
    configs = color_config.get_user_classifications(db, user_id)
    
    return [
        UserClassificationOut(
            class_name=c.class_name,
            color_name=c.color_name,
            color_hex=c.color_hex,
            is_active=c.is_active
        )
        for c in configs
    ]

# essa função é usada para retornar todas as classes
# de áudio que o modelo AST consegue classificar
# com isso, dá pra exibir uma lista de opções pro usuário configurar suas classes e adicionar novas com a função add_user_class
# passando o nome da classe (ex: "Music") e a cor que ele quer associar (ex: "Azul", "#0000FF", etc)
@app.get("/ai/classes/all")
def get_all_ai_classes():
    model, _ = audio_classifier._get_model()

    return sorted(
        [
            {"id": idx, "class_name": label}
            for idx, label in model.config.id2label.items()
        ],
        key=lambda x: x["class_name"]
    )

@app.put("/config/user/classes/{class_name}")
def update_user_class(
    class_name: str,
    update: UserClassificationUpdate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """atualiza cor ou ativa/desativa uma classe"""
    user_id = current_user["id"]
    
    sucesso = color_config.update_user_classification(
        db,
        user_id,
        class_name,
        color_name=update.color_name,
        color_hex=update.color_hex,
        is_active=update.is_active
    )
    
    if not sucesso:
        raise HTTPException(
            status_code=404,
            detail=f"Classe '{class_name}' não encontrada"
        )
    
    return {"message": "Classe atualizada", "class_name": class_name}

@app.post("/config/user/classes", response_model=UserClassificationOut)
def add_user_class(
    classification: UserClassificationIn,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """adiciona uma nova classe para o usuário"""
    user_id = current_user["id"]
    
    # verifica se já existe
    existente = color_config.get_user_color_for_class(
        db, user_id, classification.class_name
    )
    if existente:
        raise HTTPException(
            status_code=400,
            detail=f"Classe '{classification.class_name}' já existe!"
        )
    
    # cria a nova classificação
    nova = color_config.create_user_classification(
        db,
        user_id,
        classification.class_name,
        classification.color_name,
        classification.color_hex
    )
    
    return UserClassificationOut(
        class_name=nova.class_name,
        color_name=nova.color_name,
        color_hex=nova.color_hex,
        is_active=nova.is_active
    )

@app.delete("/config/user/classes/{class_name}")
def delete_user_class(
    class_name: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """desativa uma classe do usuário"""
    user_id = current_user["id"]
    
    sucesso = color_config.delete_user_classification(db, user_id, class_name)
    
    if not sucesso:
        raise HTTPException(
            status_code=404,
            detail=f"Classe '{class_name}' não encontrada"
        )
    
    return {"message": "Classe removida", "class_name": class_name}

@app.post("/user/lifx-token")
def save_lifx_token(
    token_data: LifxTokenUpdate, # recebe o token da requisição
    current_user: dict = Depends(get_current_user), # obtém o usuário atual a partir do token JWT (criamos a função get_current_user justamente pra isso)
    db: Session = Depends(get_db) # dependência para acessar o banco de dados
):
    user = db.query(User).filter(User.id == current_user["id"]).first() # busca o usuário no banco usando o ID do token JWT
    user.lifx_token = encrypt_lifx_token(token_data.token) if token_data.token else None # atualiza o campo lifx_token
    # do usuário com o token recebido (ou None se for vazio) e criptografado usando a função encrypt_lifx_token que criamos no auth.py
    db.commit() # salva a alteração no banco de dados
    return {"message": "Token LIFX atualizado com sucesso!"}

@app.get("/user/lifx-token/status")
def get_lifx_token_status(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == current_user["id"]).first()
    has_token = bool(user.lifx_token)
    return {"has_token": has_token}

# ============================================================
# ROTAS DA LÂMPADA
# ============================================================

@app.get("/lamp/status", response_model=LampStatus)
def get_lamp_status(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    obtém o status atual da lâmpada e atualiza o estado interno do lifx_client com os dados reais da API LIFX, se o token estiver configurado
    """
    user = db.query(User).filter(User.id == current_user["id"]).first()
    token = decrypt_lifx_token(user.lifx_token)
    status = lifx_client.get_status(token=token)
    return LampStatus(**status)

@app.post("/lamp/power")
def set_lamp_power(
    power: LampPower,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    liga ou desliga a lâmpada
    """
    user = db.query(User).filter(User.id == current_user["id"]).first()
    token = decrypt_lifx_token(user.lifx_token)
    resultado = lifx_client.set_power(power.power, token=token)
    return resultado


@app.post("/lamp/color")
def set_lamp_color(
    color: LampColor,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    define a cor e brilho da lâmpada
    """
    user = db.query(User).filter(User.id == current_user["id"]).first()
    token = decrypt_lifx_token(user.lifx_token)
    resultado = lifx_client.set_color(color.color, brightness=color.brightness, token=token)
    return resultado


# ============================================================
# ROTAS GERAIS
# ============================================================

@app.get("/")
def root():
    """rota inicial da API"""
    return {
        "message": "SONORA API",
        "version": "1.0.0",
        "docs": "/docs",
        "lifx_configured": lifx_client.is_configured()
    }


@app.get("/health")
def health_check():
    """verifica se a API está rodando"""
    return {"status": "ok"}