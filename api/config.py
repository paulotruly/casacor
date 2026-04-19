from typing import List, Dict, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException
from auth import UserClassification


# essas são as 8 classes iniciais que todo usuário recebe ao se cadastrar
# cada classe tem um nome e uma cor hex associada
# o usuário pode mudar depois se quiser
default_classes: Dict[str, Dict[str, str]] = {
    "Music": {
        "name": "Roxo",
        "hex": "#9B59B6"
    },
    "Speech": {
        "name": "Amarelo",
        "hex": "#FFE135"
    },
    "Crying and baby": {
        "name": "Azul",
        "hex": "#3498DB"
    },
    "Doorbell": {
        "name": "Verde",
        "hex": "#2ECC71"
    },
    "Alarm": {
        "name": "Vermelho",
        "hex": "#E74C3C"
    },
    "Singing": {
        "name": "Rosa",
        "hex": "#E91E63"
    },
    "Musical instrument": {
        "name": "Laranja",
        "hex": "#F39C12"
    },
    "Silence": {
        "name": "Branco",
        "hex": "#FFFFFF"
    },
}

# ============================================================
# funções principais
# ============================================================

def get_user_classifications(db: Session, user_id: int) -> List[UserClassification]:
    """
    lista todas as classes configuradas de um usuário (ativas e inativas)

    parametros:
    - db: a conexão com o banco de dados (recebido automáticamente pela api)
    - user_id: o id do usuário logado

    retorno:
    - uma lista com objetos UserClassification (cada um = uma classe configurada)
    """
    return db.query(UserClassification).filter(
        UserClassification.user_id == user_id
    ).all()


def get_user_active_classes(db: Session, user_id: int) -> List[str]:
    """
    retorna só os nomes das classes ativas do usuário

    serve para a classificação de áudio: se a classe detectada
    não estiver na lista ativa, vamos pular para a próxima

    parametros:
    - db: a conexão com o banco de dados
    - user_id: o id do usuário logado

    retorno:
    - uma lista de strings com os nomes das classes ativas
    """
    configs = db.query(UserClassification).filter(
        UserClassification.user_id == user_id,
        UserClassification.is_active == True
    ).all()
    
    return [c.class_name for c in configs]


def get_user_color_for_class(db: Session, user_id: int, class_name: str) -> Optional[Dict[str, str]]:
    """
    obtém a cor de uma classe específica do usuário

    se o usuário não tiver configurado essa classe, retorna None
    A API vai tratar esse caso depois

    parametros:
    - db: a conexão com o banco de dados
    - user_id: o id do usuário logado
    - class_name: o nome da classe (ex: "Music", "Speech")

    retorno:
    - um dicionário {"name": "Roxo", "hex": "#9B59B6"} ou None
    """
    config = db.query(UserClassification).filter(
        UserClassification.user_id == user_id,
        UserClassification.class_name == class_name,
        UserClassification.is_active == True
    ).first()
    
    if config:
        return {"name": config.color_name, "hex": config.color_hex}
    return None


def create_user_classification(
    db: Session, 
    user_id: int, 
    class_name: str, 
    color_name: str, 
    color_hex: str
) -> UserClassification:
    """
    cria uma nova classificação para o usuário (ativa por padrão)

    quando o usuário adiciona uma nova classe pela API,
    essa função salva no banco

    parametros:
    - db: a conexão com o banco de dados
    - user_id: o id do usuário logado
    - class_name: o nome da classe de áudio
    - color_name: o nome da cor
    - color_hex: o código hex da cor

    retorno:
    - o objeto UserClassification criado
    """
    config = UserClassification(
        user_id=user_id,
        class_name=class_name,
        color_name=color_name,
        color_hex=color_hex,
        is_active=True
    )
    db.add(config)
    db.commit()
    db.refresh(config)
    return config

def update_user_classification(
    db: Session, 
    user_id: int, 
    class_name: str, 
    color_name: str = None, 
    color_hex: str = None, 
    is_active: bool = None
) -> bool:
    """
    atualiza cor ou status (ativar/desativar) de uma classificação

    parametros (somente os que você quer mudar passe, os outros são opcionais):
    - db: a conexão com o banco de dados
    - user_id: o id do usuário logado
    - class_name: o nome da classe
    - color_name: novo nome da cor (opicional)
    - color_hex: novo código hex (opicional)
    - is_active: True para ativar, False para desativar (opicional)

    retorno:
    - True se encontrou e atualizou, False se não encontrou
    """
    config = db.query(UserClassification).filter(
        UserClassification.user_id == user_id,
        UserClassification.class_name == class_name
    ).first()
    
    if not config:
        return False
    
    # só atualiza os campos que foram passados
    if color_name:
        config.color_name = color_name
    if color_hex:
        config.color_hex = color_hex
    if is_active is not None:
        config.is_active = is_active
    
    db.commit()
    return True


def delete_user_classification(db: Session, user_id: int, class_name: str) -> bool:
    """
    desativa uma classificação (soft delete)

    não apagamos do banco, só colocamos is_active = False
    assim o usuário pode reativar depois se quiser

    parametros:
    - db: a conexão com o banco
    - user_id: o id do usuário
    - class_name: o nome da classe

    retorno:
    - True se desativou, False se não encontrou
    """
    return update_user_classification(db, user_id, class_name, is_active=False)


def initialize_user_classes(db: Session, user_id: int):
    """
    cria as 8 classes padrão para um novo usuário

    parametros:
    - db: a conexão com o banco
    - user_id: o id do usuário recém-criado
    """
    for class_name, color in default_classes.items():
        create_user_classification(
            db, 
            user_id, 
            class_name,
            color["name"], 
            color["hex"]
        )