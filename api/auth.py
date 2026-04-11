from datetime import datetime, timedelta
from typing import Optional 
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
import os

from dotenv import load_dotenv
load_dotenv()

# chave para assinatura dos tokens
SECRET_KEY = os.getenv("SECRET_KEY", "CHAVE_SECRETA_TROQUE_ISSO_EM_PRODUCAO")

ALGORITHM = "HS256"

ACCESS_TOKEN_EXPIRE_MINUTES = 15
REFRESH_TOKEN_EXPIRE_DAYS = 7

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

users_db = {}

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    # pega a data atual e adiciona o tempo de expiração
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))

    # token com a expiração e o tipo "access" que seria usado para validar o token depois
    to_encode.update({
        "exp": expire,
        "type": "access"
    })
    
    # retorna o token jwt assinado com a chave secreta e o algoritmo definido
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def create_refresh_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({
        "exp": expire,
        "type": "refresh"
    })
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def verify_token(token: str, expected_type: str = "access") -> Optional[dict]:
    # se o token for inválido ou expirado, a função lança um erro e retornará "None"
    # mas, se o token for válido, ele retorna o payload decodificado, com o email, a data de expiração e o tipo do token (access ou refresh)
    # acess -> token de acesso, usado para acessar rotas protegidas
    # refresh -> token de atualização, usado para obter um novo token de acesso sem precisar fazer
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        
        if payload.get("type") != expected_type:
            return None
        
        return payload
    
    except JWTError:
        return None

# esquema para que o token seja extraído e validado automaticamente nas rotas protegidas
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

# caso o usuario faça o login, a rota auth/login gera um token de acesso e
# um token de atualização, e o token de acesso é usado para acessar as rotas protegidas,
# enquanto o token de atualização é usado para obter um novo token de acesso quando
# o token de acesso expira

# caso ele seja válido, usando a função verify_token(token, "access")
# se o token for válido, a função retorna o email do usuário, que pode ser usado para identificar
# o usuário nas rotas protegidas, se não for, a função lança um erro 401, indicando que o token
# é inválido ou expirado

def get_current_user(token: str = Depends(oauth2_scheme)) -> dict:
    payload = verify_token(token, "access")
    
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido ou expirado!",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    email = payload.get("sub")
    
    if email is None:
        raise HTTPException(status_code=401, detail="Token sem e-mail!")
    
    if email not in users_db:
        raise HTTPException(status_code=401, detail="Usuário não encontrado!")
    
    return {"email": email}