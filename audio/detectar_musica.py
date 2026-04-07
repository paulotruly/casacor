import torch
from transformers import AutoFeatureExtractor, ASTForAudioClassification
import numpy as np

class DetectorMusica:
    def __init__(self):
        self.model_name = "MIT/ast-finetuned-audioset-10-10-0.4593"
        self.feature_extractor = AutoFeatureExtractor.from_pretrained(self.model_name) # transforma som em imagem (espectrograma)
        self.model = ASTForAudioClassification.from_pretrained(self.model_name)
        self.model.eval()
    
    def detectar(self, audio, taxa_amostragem=16000, top_n=3):
        inputs = self.feature_extractor(
            audio, 
            sampling_rate=taxa_amostragem,
            return_tensors="pt"
        )
        
        # modelo dá a nota para cada categoria de áudio (ex: se for música, a nota de "Music" deve ser alta)
        with torch.no_grad(): # aqui serve pra ele aprender nada, apenas usar o que já aprendeu
            outputs = self.model(**inputs)
            logits = outputs.logits[0]
        
        # transforma notas em porcentagens (ex: 0.95 = 95% de chance de ser música)
        probs = torch.sigmoid(logits)
        
        # pega o nome das categorias, transforma numa lista, e junta com as porcentagens
        id2label = self.model.config.id2label
        todas_classes = []
        for idx, prob in enumerate(probs):
            label = id2label[idx]  # nome da categoria (ex: "Music")
            prob_val = prob.item()  # porcentagem (ex: 0.95 = 95%)
            todas_classes.append((label, prob_val))
        
        # ordena da maior para a menor porcentagem
        todas_classes.sort(key=lambda x: x[1], reverse=True)
        
        principal = todas_classes[0] 
        secundarias = todas_classes[1:top_n+1]
        return {
            "principal": principal,
            "secundarias": secundarias,
        }
