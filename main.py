from audio.capturar import gravar_audio
from audio.salvar import salvar_audio
from audio.transcrever import transcrever_audio

def main():
    print("Começando a gravar áudio...")
    audio = gravar_audio()
    salvar_audio(audio)

    texto = transcrever_audio()
    print(texto)
    print("Fim!")

if __name__ == "__main__":
    main()