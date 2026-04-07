# CASACOR 

Sistema de classificação de áudio em tempo real com controle de iluminação smart.

## Ideia do projeto

Este projeto visa criar um sistema inteligente que:

1. **Captura áudio** do ambiente através do microfone
2. **Classifica o som** detectado em tempo real (música, fala, som ambiente, etc.)
3. **Dispara efeitos visuais** em uma lâmpada Bluetooth com base na classificação do áudio

## Tecnologias

| Tecnologia | Uso |
|------------|-----|
| **Python** | Linguagem principal |
| **SoundDevice** | Captura de áudio do microfone |
| **NumPy** | Processamento de sinais de áudio |
| **Noisereduce** | Redução de ruído |
| **Whisper (OpenAI)** | Transcrição de fala para texto |
| **AST (HuggingFace)** | Classificação de áudio em 527 categorias |
| **PyTorch** | Framework de deep learning |

## Estrutura do Projeto

```
CASACOR/
├── audio/
│   ├── capturar.py      # Gravação de áudio do microfone
│   ├── salvar.py       # Salvar áudio em formato WAV
│   ├── transcrever.py  # Transcrever áudio em texto (Whisper)
│   └── detectar_musica.py  # Classificar áudio (AST)
├── devices/
│   └── (futuro) controle da lâmpada Bluetooth
├── main.py             # Arquivo principal
├── requirements.txt    # Dependências do projeto
└── gravacao.wav        # Último áudio gravado
```

## O que foi feito (até agora)

1. Estrutura inicial do repositório e configuração básica do projeto
2. Implementação inicial do detector de música
3. Utilização do modelo `MTUCI/MusicDetection`
4. Migrado para modelo **AST (Audio Spectrogram Transformer)** do MIT
5. Classificação em **527 categorias** do AudioSet e retorno da categoria principal e secundárias detectadas

## Modelo AST

O modelo **Audio Spectrogram Transformer (AST)** foi desenvolvido pelo MIT e treinado no AudioSet.

| Característica | Detalhe |
|----------------|---------|
| **Modelo** | `MIT/ast-finetuned-audioset-10-10-0.4593` |
| **Classes** | 527 categorias |
| **Precisão** | State-of-the-art em classificação de áudio |
| **Tamanho** | ~87MB |

### Categorias que detecta:

- **Música:** Music, Pop music, Rock music, Jazz, Classical music, etc.
- **Voz:** Speech, Singing, Human voice, Rapping, etc.
- **Instrumentos:** Guitar, Piano, Drum, Bass, Synthesizer, etc.
- **Sons ambiente:** Rain, Thunder, Car, Bird, Dog, etc.