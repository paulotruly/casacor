"""
main.py - Rotas da API SONORA
"""

from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from models import (
    LoginResponse, UserCreate, UserLogin, Token, TokenRefresh,
    ClassifyRequest, ClassifyResponse,
    ColorConfig, ColorConfigUpdate,
    LampStatus, LampColor, LampPower,
    UserClassificationIn, UserClassificationOut, UserClassificationUpdate
)

from auth import (
    get_password_hash, verify_password,
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
    allow_origins=["*"], 
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
        refreshToken = refresh_token
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
def classify_audio_endpoint(
    request: ClassifyRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    rota para classificar áudio e alterar a cor da lâmpada
    """
    user_id = current_user["id"]
    classes_ativas = color_config.get_user_active_classes(db, user_id)
    resultado = audio_classifier.classify_audio(request.audio, classes_ativas)
    
    classe_detectada = resultado["detected_class"]
    confianca = resultado["confidence"]
    classes_secundarias = resultado["secondary_classes"]
    
    # obtém a cor configurada para ESSE usuário
    cor_info = color_config.get_user_color_for_class(db, user_id, classe_detectada)

    # se o usuário não tiver configurado essa classe, usa branco
    if cor_info is None:
        cor_info = {"name": "Branco", "hex": "#FFFFFF"}

    cor_nome = cor_info["name"]
    cor_hex = cor_info["hex"]
    
    # envia o comando para a lâmpada
    lifx_client.set_color(cor_hex, brightness=0.75)
    
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

# ============================================================
# ROTAS DA LÂMPADA
# ============================================================

@app.get("/lamp/status", response_model=LampStatus)
def get_lamp_status(current_user: dict = Depends(get_current_user)):
    """
    pbtém o status atual da lâmpada
    """
    status = lifx_client.get_status()
    return LampStatus(**status)


@app.post("/lamp/power")
def set_lamp_power(
    power: LampPower,
    current_user: dict = Depends(get_current_user)
):
    """
    liga ou desliga a lâmpada
    """
    resultado = lifx_client.set_power(power.power)
    return resultado


@app.post("/lamp/color")
def set_lamp_color(
    color: LampColor,
    current_user: dict = Depends(get_current_user)
):
    """
    define a cor e brilho da lâmpada
    """
    resultado = lifx_client.set_color(color.color, color.brightness)
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