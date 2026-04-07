from audio.capturar import gravar_audio
from audio.salvar import salvar_audio
from audio.transcrever import transcrever_audio
from audio.detectar_musica import DetectorMusica

def main():
    print("Começando a gravar áudio...")
    audio = gravar_audio(duracao=5)
    detector = DetectorMusica()
    resultado = detector.detectar_musica(audio)
    salvar_audio(audio)

    texto = transcrever_audio()
    print(texto)
    print(f"Tipo: {resultado['tipo']}, Confiança: {resultado['confianca']:.2f}")
    print("Fim!")

if __name__ == "__main__":
    main()