import torch
from transformers import AutoFeatureExtractor, ASTForAudioClassification
import numpy as np

class DetectorMusica:
    LABELS_MUSICA = {
        'Music', 'Musical instrument', 'Guitar', 'Piano', 'Drum',
        'Singing', 'Song', 'Choir', 'Orchestra', 'Synthesizer',
        'Electronic music', 'Pop music', 'Rock music', 'Jazz', 'Classical music',
        'Hip hop music', 'Reggae', 'Rhythm and blues', 'Country music',
        'Dance music', 'Folk music', 'Blues', 'Soul music',
        'Vocal music', 'A cappella', 'Rapping', 'Beatboxing',
        'Drum machine', 'Bass', 'Electric guitar', 'Acoustic guitar',
        'String instrument', 'Wind instrument', 'Brass instrument'
    }
    
    def __init__(self, threshold=0.3):
        self.model_name = "MIT/ast-finetuned-audioset-10-10-0.4593"
        self.feature_extractor = AutoFeatureExtractor.from_pretrained(self.model_name)
        self.model = ASTForAudioClassification.from_pretrained(self.model_name)
        self.model.eval()
        self.threshold = threshold
    
    def detectar_musica(self, audio, taxa_amostragem=16000):
        inputs = self.feature_extractor(
            audio, 
            sampling_rate=taxa_amostragem, 
            return_tensors="pt"
        )
        
        with torch.no_grad():
            outputs = self.model(**inputs)
            logits = outputs.logits[0]
        
        probs = torch.sigmoid(logits)
        id2label = self.model.config.id2label
        prob_musica = 0
        
        for idx, prob in enumerate(probs):
            label = id2label[idx].lower() 
            
            for musica_label in self.LABELS_MUSICA:
                if musica_label.lower() in label:
                    prob_musica += prob.item()
                    break
        
        prob_musica = min(prob_musica, 1.0)
        
        if prob_musica > self.threshold:
            return {"tipo": "MÚSICA", "confianca": prob_musica}
        else:
            return {"tipo": "NÃO MÚSICA", "confianca": 1 - prob_musica}
