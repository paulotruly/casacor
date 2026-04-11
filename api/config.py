from typing import Dict

# dicionário que mapeia: "nome_da_classe" -> {"nome": "Cor", "hex": "#RRGGBB"}
# estas são as cores iniciais que vem por padrão
# o usuário pode modificar depois pela API

# o Dict[str, Dict[str, str]] significa que é um dicionário onde a chave é uma string
# (o nome da classe) e o valor é outro dicionário com as chaves "name" e "hex",
# ambas strings (o nome da cor e o código hexadecimal da cor)

DEFAULT_COLORS: Dict[str, Dict[str, str]] = {
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

# faz uma cópia do dicionário de cores padrão para a configuração atual, que pode ser modificada pelo usuário
# ou seja, o usuário modifica a cópia, e o dicionário DEFAULT_COLORS permanece inalterado, para que a gente possa
# resetar as cores para o padrão quando quiser
colors_config: Dict[str, Dict[str, str]] = DEFAULT_COLORS.copy()

def get_color_for_class(class_name: str) -> Dict[str, str]:
    # se uma classe não estiver configurada, retorna a cor padrão (branco)
    return colors_config.get(class_name, {"name": "Branco", "hex": "#FFFFFF"})

def get_all_colors() -> Dict[str, Dict[str, str]]:
    # se o usuário quiser ver todas as cores configuradas, retorna o dicionário completo de cores
    return colors_config.copy()

def update_color(class_name: str, color_name: str, color_hex: str) -> bool:
    # usando essa função, o usuário pode atualizar a cor de uma classe,
    # passando o nome da classe, o nome da cor e o código hexadecimal da cor
    global colors_config
    
    if class_name not in colors_config:
        return False
    
    colors_config[class_name] = {
        "name": color_name,
        "hex": color_hex
    }
    
    return True


def add_color_config(class_name: str, color_name: str, color_hex: str) -> None:
    # adiciona uma nova configuração de cor para uma classe, mesmo que a classe não
    # exista no modelo, o usuário pode criar uma configuração de cor para ela,
    # e quando o modelo classificar um áudio como aquela classe, ele vai usar
    # a cor configurada, mesmo que a classe não exista no modelo, isso é útil para
    # o usuário criar configurações de cor para classes personalizadas que
    # ele queira usar no futuro
    global colors_config
    
    colors_config[class_name] = {
        "name": color_name,
        "hex": color_hex
    }

def reset_to_defaults() -> None:
    global colors_config
    colors_config = DEFAULT_COLORS.copy()