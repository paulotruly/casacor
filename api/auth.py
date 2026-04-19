"""
auth.py - Gerencia autenticação de usuários e conexão com o banco de dados
"""

from datetime import datetime, timedelta
from typing import Optional

# JWT e senhas
from jose import JWTError, jwt
from passlib.context import CryptContext

# FastAPI
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

# SQLAlchemy (banco de dados)
from sqlalchemy import create_engine, Column, Integer, String, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import sessionmaker, declarative_base, Session

# Variáveis de ambiente
import os
from dotenv import load_dotenv
load_dotenv()

# ============================================================
# CONFIGURAÇÕES DO BANCO DE DADOS
# ============================================================

DATABASE_URL = os.getenv("DATABASE_URL")
# cria a engine (conexão) com o banco - não abre ainda, só prepara
engine = create_engine(DATABASE_URL)
# cria a fábrica de sessões para fazer queries no banco
SessionLocal = sessionmaker(autocommit=False, bind=engine)
# base para criar os modelos (tabelas) do banco
Base = declarative_base()

# ============================================================
# MODELO DA TABELA
# ============================================================

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class UserClassification(Base):
    __tablename__ = "user_classifications"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    class_name = Column(String(255), nullable=False)
    color_name = Column(String(50), nullable=False)
    color_hex = Column(String(7), nullable=False)
    is_active = Column(Boolean, default=True)

# ============================================================
# FUNÇÕES DE BANCO DE DADOS
# ============================================================

def get_db():
    """
    dependency do FastAPI para obter uma sessão do banco
    cria a sessão -> entrega para a rota -> fecha automaticamente
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_user_by_email(db: Session, email: str) -> Optional[User]:
    """
    busca um usuário no banco pelo email
    retorna o objeto User ou None se não encontrar
    """
    return db.query(User).filter(User.email == email).first()

def create_user(db: Session, email: str, hashed_password: str) -> User:
    """
    cria um novo usuário no banco de dados
    """
    db_user = User(
        email=email,
        hashed_password=hashed_password
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

# ============================================================
# CONFIGURAÇÕES DE JWT
# ============================================================

SECRET_KEY = os.getenv("SECRET_KEY", "CHAVE_SECRETA_TROQUE_ISSO_EM_PRODUCAO")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 15
REFRESH_TOKEN_EXPIRE_DAYS = 7

# ============================================================
# FUNÇÕES DE SENHA (HASH)
# ============================================================

# contexto para fazer hash de senhas usando argon2
pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifica se a senha em texto puro bate com o hash armazenado"""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Gera o hash de uma senha"""
    return pwd_context.hash(password)

# ============================================================
# FUNÇÕES DE TOKEN JWT
# ============================================================

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    cria um token de acesso JWT
    - data: dicionário com os dados a incluir no token (ex: {"sub": email})
    - expires_delta: tempo adicional de expiração (opcional)
    """
    to_encode = data.copy()
    
    # calcula o tempo de expiração
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    
    # adiciona a expiração e o tipo do token
    to_encode.update({
        "exp": expire,
        "type": "access"
    })
    
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def create_refresh_token(data: dict) -> str:
    """
    cria um token de refresh JWT
    usado para obter um novo access token sem fazer login novamente
    """
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    
    to_encode.update({
        "exp": expire,
        "type": "refresh"
    })
    
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def verify_token(token: str, expected_type: str = "access") -> Optional[dict]:
    """
    verifica se um token JWT é válido
    - token: o token JWT a verificar
    - expected_type: "access" ou "refresh"
    retorna o payload decodificado ou None se inválido.
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        
        # verifica se o tipo do token é o esperado
        if payload.get("type") != expected_type:
            return None
        
        return payload
    
    except JWTError:
        return None


# ============================================================
# FASTAPI SECURITY
# ============================================================

# Schema OAuth2 para extrair o token automaticamente das requisições
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

# ============================================================
# FUNÇÃO PARA OBTER USUÁRIO ATUAL
# ============================================================

def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> dict:
    """
    dependency que obtém o usuário atual a partir do token JWT
    usada em rotas protegidas com: current_user: dict = Depends(get_current_user)
    
    retorna um dict com email e id do usuário
    """
    # verifica se o token é válido
    payload = verify_token(token, "access")
    
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido ou expirado!",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    # extrai o email do payload
    email = payload.get("sub")
    
    if email is None:
        raise HTTPException(status_code=401, detail="Token sem e-mail!")
    
    # Busca o usuário no banco de dados
    user = get_user_by_email(db, email)
    
    if user is None:
        raise HTTPException(status_code=401, detail="Usuário não encontrado!")
    
    # Retorna os dados do usuário (email e id)
    return {"email": user.email, "id": user.id}
