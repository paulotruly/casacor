from scipy.io.wavfile import write

def salvar_audio(audio, taxa_amostragem = 16000, nome_arquivo = "gravacao.wav"):
    write(nome_arquivo, taxa_amostragem, audio)