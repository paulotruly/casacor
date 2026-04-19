import torch
import base64
import io
import numpy as np
from transformers import AutoFeatureExtractor, ASTForAudioClassification
from typing import Dict, List, Tuple
import soundfile as sf
import librosa

_model = None
_feature_extractor = None

def _get_model():
    global _model, _feature_extractor
    if _model is None:
        print("Carregando modelo AST (isso pode levar uns minutos na primeira vez)...")
        model_name = "MIT/ast-finetuned-audioset-10-10-0.4593"
        _feature_extractor = AutoFeatureExtractor.from_pretrained(model_name)
        _model = ASTForAudioClassification.from_pretrained(model_name)
        _model.eval()
        print("Modelo carregado!")
    return _model, _feature_extractor

def classify_audio(audio_base64: str) -> Dict:
    model, feature_extractor = _get_model()
    
    # pega o áudio em base64, decodifica para bytes, e depois lê como um array numpy usando soundfile
    audio_bytes = base64.b64decode(audio_base64)
    audio_array, sample_rate = sf.read(io.BytesIO(audio_bytes))
    
    # serve pra caso o áudio tenha mais de um canal (ex: estéreo), ele pega apenas um canal (ex: o esquerdo)
    # porque o modelo AST foi treinado com áudio mono (1 canal), então se tiver mais de um canal, ele pode confundir o modelo
    if len(audio_array.shape) > 1:
        audio_array = audio_array[:, 0]
    
    # se a taxa de amostragem for diferente de 16000, resample
    # porque o modelo AST foi treinado com áudio a 16000 Hz, então se o áudio
    # tiver uma taxa de amostragem diferente, ele pode confundir o modelo
    if sample_rate != 16000:
        audio_array = _resample(audio_array, sample_rate, 16000)
    
    # transforma o áudio em imagem (espectrograma) e normaliza os valores, e coloca em um tensor do PyTorch
    inputs = feature_extractor(
        audio_array,
        sampling_rate=16000,
        return_tensors="pt"
    )
    
    # classifica o áudio usando o modelo AST, e pega os "logits" (notas para cada categoria de áudio)
    with torch.no_grad():
        outputs = model(**inputs) # dá a nota para cada categoria de áudio (ex: se for música, a nota de "Music" deve ser alta)
        logits = outputs.logits[0] # logits é um tensor com a nota para cada categoria de áudio, onde cada posição
        # corresponde a uma categoria de áudio (ex: "Music"... "Speech"... "Dog barking"... etc)
        # usamos isso pra calcular a probabilidade de cada categoria usando a função sigmoid,
        # que transforma os logits em valores entre 0 e 1 (probabilidades)
    probs = torch.sigmoid(logits)
    
    # pega o nome das categorias, transforma numa lista, e junta com as porcentagens
    id2label = model.config.id2label
    
    # lista todas as classes com sua confiança
    # formato: [("Music", 0.95), ("Speech", 0.10), ("Dog barking", 0.05), ...]
    todas_classes: List[Tuple[str, float]] = []

    # percorre cada categoria de áudio, pega o nome da categoria (usando id2label)
    # e a probabilidade (confiança) de que o áudio seja daquela categoria, e adiciona na lista todas_classes
    for idx, prob in enumerate(probs):
        label = id2label[idx] # exemplo: posição 0 = "Music", posição 1 = "Speech", etc
        prob_val = prob.item() # exemplo: 0.95 = 95% de chance de ser música
        todas_classes.append((label, prob_val))
    
    # ordena a lista todas_classes da maior para a menor confiança, ou seja,
    # a categoria mais provável fica no início da lista
    todas_classes.sort(key=lambda x: x[1], reverse=True)
    
    # classe principal (maior confiança)
    principal = todas_classes[0]
    
    # classes secundárias (as próximas mais prováveis, do índice 1 até 3)
    secundarias = todas_classes[1:3]
    
    return {
        "detected_class": principal[0],
        "confidence": principal[1],
        "secondary_classes": secundarias,
        "all_classes": todas_classes  # Todas as classes (pode usar depois)
    }

# essa função é uusada para mudar a taxa de amostragem do áudio, caso o áudio enviado tenha uma
# taxa de amostragem diferente de 16000 Hz, que é a taxa de amostragem que o modelo AST foi treinado,
# então ele pode confundir o modelo, e a função _resample usa a biblioteca librosa para fazer essa
# conversão de forma eficiente e com boa qualidade.

def _resample(audio: np.ndarray, orig_sr: int, target_sr: int) -> np.ndarray:
    return librosa.resample(audio, orig_sr=orig_sr, target_sr=target_sr)