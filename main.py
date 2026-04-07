from audio.capturar import gravar_audio
from audio.salvar import salvar_audio
# from audio.transcrever import transcrever_audio
from audio.detectar_musica import DetectorMusica

def main():
    print("Começando a gravar áudio...")
    audio = gravar_audio(duracao=5)

    detector = DetectorMusica()
    resultado = detector.detectar(audio)
    
    salvar_audio(audio)

    # texto = transcrever_audio()
    # print(texto)
    
    principal = resultado['principal']
    secundarias = resultado['secundarias']

    print(principal[0])
    print(secundarias[0][0])
    
    print("Fim!")

if __name__ == "__main__":
    main()