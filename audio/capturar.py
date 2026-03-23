import sounddevice as sd
import numpy as np
import noisereduce as nr

sd.default.device = 1 # dispositivo de entrada (microfone)

def compressao_ruido(audio, limiar = 0.02, relacao_compressao = 4):  
    compressao = np.copy(audio) # recebendo o áudio original para aplicar a compressão
    mascara = np.abs(audio) > limiar # criando uma máscara para identificar os valores que estão acima do limiar
    # aplicando a compressão apenas para os valores acima do limiar, ou seja, os valores que são considerados ruído
    compressao[mascara] = np.sign(audio[mascara]) * (limiar + (np.abs(audio[mascara]) - limiar) / relacao_compressao)
    return compressao

def gravar_audio(duracao = 10, taxa_amostragem = 16000):
    audio = sd.rec(
        int(duracao * taxa_amostragem), # quantidade de amostras a serem gravadas
        samplerate = taxa_amostragem, # taxa de amostragem
        channels = 1 # número de canais
    )
    sd.wait()

    audio = audio.flatten() # transformando o array de 2 dimensões em um array unidimensional, isso é necessário porque o scipy.io.wavfile.write espera um array unidimensional
    audio = compressao_ruido(audio)
    audio = audio * 4
    audio = np.clip(audio, -1, 1) # limitando o áudio para evitar distorção

    return audio
