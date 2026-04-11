from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm

from models import (
    UserCreate, UserLogin, Token, TokenRefresh,
    ClassifyRequest, ClassifyResponse,
    ColorConfig, ColorConfigUpdate,
    LampStatus, LampColor, LampPower
)

from auth import (
    users_db, get_password_hash, verify_password,
    create_access_token, create_refresh_token, verify_token,
    get_current_user
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

@app.post("/auth/register")
def register(user: UserCreate):
    if user.email in users_db:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email já cadastrado"
        )
    
    users_db[user.email] = {
        "email": user.email,
        "hashed_password": get_password_hash(user.password)
    }
    
    return {"message": "Usuário registrado!"}

@app.post("/auth/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user_email = form_data.username
    password = form_data.password
    
    if user_email not in users_db:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou senha incorretos"
        )
    
    user = users_db[user_email]
    if not verify_password(password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou senha incorretos"
        )
    
    access_token = create_access_token(data={"sub": user_email})
    refresh_token = create_refresh_token(data={"sub": user_email})
    
    return Token(access_token=access_token, refresh_token=refresh_token)

# esse endpoint é para o usuário obter um novo token de acesso usando o token de atualização, sem precisar fazer login novamente
@app.post("/auth/refresh", response_model=Token)
def refresh_token(token_data: TokenRefresh):
    # verifica se o refresh é válido e não expirou
    payload = verify_token(token_data.refresh_token, "refresh")
    
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token inválido ou expirado"
        )
    
    # caso seja válido, ele gera um novo token de acesso e um novo token de atualização,
    # e retorna para o usuário, usando o email do payload para identificar o usuário
    email = payload.get("sub")
    new_access_token = create_access_token(data={"sub": email})
    new_refresh_token = create_refresh_token(data={"sub": email})
    return Token(access_token=new_access_token, refresh_token=new_refresh_token)

@app.post("/classify", response_model=ClassifyResponse)
def classify_audio_endpoint(request: ClassifyRequest, current_user: dict = Depends(get_current_user)):
    resultado = audio_classifier.classify_audio(request.audio)
    
    classe_detectada = resultado["detected_class"]
    confianca = resultado["confidence"]
    classes_secundarias = resultado["secondary_classes"]
    
    cor_info = color_config.get_color_for_class(classe_detectada)
    cor_nome = cor_info["name"]
    cor_hex = cor_info["hex"]
    lifx_client.set_color(cor_hex, brightness=0.75)
    
    return ClassifyResponse(
        detected_class=classe_detectada,
        confidence=confianca,
        secondary_classes=classes_secundarias,
        applied_color=cor_nome,
        color_hex=cor_hex
    )

# por que o current_user is not accessed? 
# por que o Depends(get_current_user)?

# aqui ele retorna uma lista de dicionários com a classe e a cor configurada
@app.get("/config/colors", response_model=list[ColorConfig])
def get_all_colors(current_user: dict = Depends(get_current_user)):
    colors = color_config.get_all_colors()
    
    return [
        ColorConfig(class_name=classe, **info)
        for classe, info in colors.items()
    ]

# aqui ele retorna a cor configurada para uma classe específica, ou branco se a classe não tiver configuração
@app.get("/config/colors/{class_name}", response_model=ColorConfig)
def get_color_for_class(class_name: str, current_user: dict = Depends(get_current_user)):
    cor_info = color_config.get_color_for_class(class_name)
    
    if class_name not in color_config.colors_config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Classe '{class_name}' não encontrada. Use GET /config/colors para ver as disponíveis."
        )
    
    return ColorConfig(class_name=class_name, **cor_info)

# por que o current_user is not accessed? 
# por que o Depends(get_current_user)?

@app.put("/config/colors/{class_name}")
def update_color(class_name: str, update: ColorConfigUpdate, current_user: dict = Depends(get_current_user)):
    # aqui ele chama a função update_color passando o nome da classe,
    # o nome da cor e o código hexadecimal da cor, e a função retorna
    # True se a atualização foi bem-sucedida, ou False se a classe não foi encontrada
    sucesso = color_config.update_color(
        class_name=class_name,
        color_name=update.color_name,
        color_hex=update.color_hex
    )
    
    if not sucesso:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Classe '{class_name}' não encontrada"
        )
    
    return {"message": "Cor atualizada", "class_name": class_name, **update.dict()}

@app.post("/config/colors")
def add_color(
    color: ColorConfig,
    current_user: dict = Depends(get_current_user)
):
    # 'go to definition' pra entender o que ela faz
    color_config.add_color_config(
        class_name=color.class_name,
        color_name=color.color_name,
        color_hex=color.color_hex
    )
    
    return {"message": "Cor adicionada", **color.dict()}


@app.get("/lamp/status", response_model=LampStatus)
def get_lamp_status(current_user: dict = Depends(get_current_user)):
    status = lifx_client.get_status()
    return LampStatus(**status)

@app.post("/lamp/power")
def set_lamp_power(
    power: LampPower,
    current_user: dict = Depends(get_current_user)
):
    resultado = lifx_client.set_power(power.power)
    return resultado

@app.post("/lamp/color")
def set_lamp_color(
    color: LampColor,
    current_user: dict = Depends(get_current_user)
):
    resultado = lifx_client.set_color(color.color, color.brightness)
    return resultado

@app.get("/")
def root():
    """Rota inicial da API."""
    return {
        "message": "SONORA API",
        "version": "1.0.0",
        "docs": "/docs",
        "lifx_configured": lifx_client.is_configured()
    }

@app.get("/health")
def health_check():
    """Verifica se a API está rodando."""
    return {"status": "ok"}