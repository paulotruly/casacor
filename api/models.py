"""
models.py - define os formatos dos dados que entram e saem da API
"""

from pydantic import BaseModel, EmailStr  # EmailStr valida se é email de verdade
from typing import Optional, List  # List = lista de itens, Optional = pode ser None

class UserCreate(BaseModel):
    email: EmailStr  # validação automática de email
    password: str    # qualquer string (senha em texto puro aqui, depois hash no auth.py)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str  
    refresh_token: str 
    token_type: str = "bearer"

class TokenRefresh(BaseModel):
    refresh_token: str

class ClassifyRequest(BaseModel):
    audio: str

class ClassifyResponse(BaseModel):
    detected_class: str 
    confidence: float 
    secondary_classes: List[tuple]
    applied_color: str 
    color_hex: str

class ColorConfig(BaseModel):
    class_name: str
    color_name: str
    color_hex: str 

class ColorConfigUpdate(BaseModel):
    color_name: str
    color_hex: str

class LampStatus(BaseModel):
    power: str  
    color: str 
    brightness: float

class LampColor(BaseModel):
    color: str
    brightness: float = 1.0

class LampPower(BaseModel):
    power: bool  # True = ligado, False = desligado

class UserClassificationIn(BaseModel):
    class_name: str
    color_name: str
    color_hex: str
    
class UserClassificationOut(BaseModel):
    class_name: str
    color_name: str
    color_hex: str
    is_active: bool

class UserClassificationUpdate(BaseModel):
    color_name: Optional[str] = None
    color_hex: Optional[str] = None
    is_active: Optional[bool] = None