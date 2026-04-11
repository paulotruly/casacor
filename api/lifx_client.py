"""
lifx_client.py - cliente para controlar a lâmpada LIFX via API HTTP
"""

import requests  # biblioteca para fazer requisições HTTP
import os
from dotenv import load_dotenv
from typing import Optional

load_dotenv()
# o token é necessário para autenticar as requisições na API LIFX Cloud, e controlar a lâmpada
# os.getenv("LIFX_TOKEN", "") tenta pegar a variável de ambiente LIFX_TOKEN, e se não encontrar, retorna uma string vazia
LIFX_TOKEN = os.getenv("LIFX_TOKEN", "")

HEADERS = {
    "Authorization": f"Bearer {LIFX_TOKEN}"
}

BASE_URL = "https://api.lifx.com/v1"

# esses são os estados atuais da lâmpada, usados para simular o comportamento quando o token não está configurado
# ou seja, se o token não estiver configurado, as funções de ligar/desligar e mudar cor vão atualizar essas variáveis,
# e a função de status vai retornar o valor dessas variáveis, para simular o comportamento da lâmpada mesmo sem acesso à API LIFX
# depois que o token for configurado, essas variáveis serão atualizadas com o status real da lâmpada usando a API
# então a resposta será diretamente da API LIFX, e não mais simulada
_lamp_power: str = "on"
_lamp_color: str = "#FFFFFF"
_lamp_brightness: float = 1.0

def is_configured() -> bool:
    return bool(LIFX_TOKEN and LIFX_TOKEN != "")

def set_power(power: bool) -> dict:
    global _lamp_power
    
    # se o token da api não estiver configurado, atualiza o estado da lâmpada
    # e retorna uma resposta simulada, sem tentar acessar a API LIFX
    if not is_configured():
        _lamp_power = "on" if power else "off"
        return {"status": "ok", "message": "Token não configurado - simulado", "power": _lamp_power}
    
    # "on" se power for True, "off" se for False
    power_value = "on" if power else "off"
    
    try:
        # PUT /lights/all/power para ligar ou desligar a lâmpada, passando o valor "on" ou "off" no corpo da requisição
        response = requests.put(
            f"{BASE_URL}/lights/all/power",
            headers=HEADERS,
            data={"power": power_value}
        )
        if response.status_code == 207:
            _lamp_power = power_value
            return {"status": "ok", "power": power_value}
        else:
            return {"status": "error", "message": f"Erro {response.status_code}: {response.text}"}
    
    # se ocorrer um erro de conexão (ex: token inválido, sem internet, etc), atualiza o estado da lâmpada
    except requests.exceptions.RequestException as e:
        _lamp_power = power_value
        return {"status": "error", "message": f"Erro de conexão: {str(e)}", "simulated": True}


def set_color(color_hex: str, brightness: float = 1.0) -> dict:
    global _lamp_color, _lamp_brightness
    
    if not is_configured():
        _lamp_color = color_hex
        _lamp_brightness = brightness
        return {"status": "ok", "message": "Token não configurado - simulado", "color": color_hex}
    
    hsb = _hex_to_hsb(color_hex)
    brightness = max(0.0, min(1.0, brightness))
    
    try:
        # PUT /lights/all/state
        # para mudar a cor e o brilho da lâmpada, passando os valores no corpo da requisição, usando a string HSB que a API LIFX aceita
        response = requests.put(
            f"{BASE_URL}/lights/all/state",
            headers=HEADERS,
            data={
                "power": "on",
                "color": hsb,
                "brightness": brightness
            }
        )
        
        if response.status_code == 207:
            _lamp_color = color_hex
            _lamp_brightness = brightness
            return {"status": "ok", "color": color_hex, "brightness": brightness}
        else:
            return {"status": "error", "message": f"Erro {response.status_code}: {response.text}"}
    
    except requests.exceptions.RequestException as e:
        _lamp_color = color_hex
        _lamp_brightness = brightness
        return {"status": "error", "message": f"Erro de conexão: {str(e)}", "simulated": True}


def get_status() -> dict:
    global _lamp_power, _lamp_color, _lamp_brightness
    
    if not is_configured():
        return {
            "power": _lamp_power,
            "color": _lamp_color,
            "brightness": _lamp_brightness,
            "simulated": True,
            "message": "Token não configurado - modo simulado"
        }
    
    try:
        # GET /lights/all
        # aqui a gente pega o status de todas as lâmpadas, mas como só tem uma,
        # a gente pega a primeira da lista, e extrai o status dela (power, color e brightness)
        response = requests.get(
            f"{BASE_URL}/lights/all",
            headers=HEADERS
        )
        
        if response.status_code == 200:
            data = response.json()
            if data:
                light = data[0]
                _lamp_power = light.get("power", "off")
                _lamp_color = _hsb_to_hex(light.get("color", {}))
                _lamp_brightness = light.get("brightness", 1.0)
                
                return {
                    "power": _lamp_power,
                    "color": _lamp_color,
                    "brightness": _lamp_brightness
                }
        
        return {"status": "error", "message": f"Erro {response.status_code}"}
    
    except requests.exceptions.RequestException as e:
        return {"status": "error", "message": str(e), "simulated": True}


def _hex_to_hsb(hex_color: str) -> str:
    # aqui é só pra trasnformar o hex em hsb

    hex_color = hex_color.lstrip("#")
    r = int(hex_color[0:2], 16) / 255.0
    g = int(hex_color[2:4], 16) / 255.0
    b = int(hex_color[4:6], 16) / 255.0

    max_val = max(r, g, b)
    min_val = min(r, g, b)
    delta = max_val - min_val
    brightness = max_val

    if max_val == 0:
        saturation = 0
    else:
        saturation = delta / max_val
    
    if delta == 0:
        hue = 0
    elif max_val == r:
        hue = (g - b) / delta
        if g < b:
            hue += 6
    elif max_val == g:
        hue = 2 + (b - r) / delta
    else:
        hue = 4 + (r - g) / delta
    
    hue = (hue / 6) * 360
    saturation = saturation
    brightness = brightness
    
    return f"hue:{int(hue)} saturation:{saturation:.2f} brightness:{brightness:.2f}"


def _hsb_to_hex(color_dict: dict) -> str:
    # aqui faz o contrário
    try:
        hue = color_dict.get("hue", 0) / 360 * 6
        saturation = color_dict.get("saturation", 1.0)
        brightness = color_dict.get("brightness", 1.0)
        
        i = int(hue)
        f = hue - i
        p = brightness * (1 - saturation)
        q = brightness * (1 - saturation * f)
        t = brightness * (1 - saturation * (1 - f))
        
        if i % 6 == 0:
            r, g, b = brightness, t, p
        elif i % 6 == 1:
            r, g, b = q, brightness, p
        elif i % 6 == 2:
            r, g, b = p, brightness, t
        elif i % 6 == 3:
            r, g, b = p, q, brightness
        elif i % 6 == 4:
            r, g, b = t, p, brightness
        else:
            r, g, b = brightness, p, q
        
        r, g, b = int(r * 255), int(g * 255), int(b * 255)
        return f"#{r:02X}{g:02X}{b:02X}"
    
    except:
        return "#FFFFFF"
