import whisper

def transcrever_audio(caminho_arquivo="gravacao.wav"):
    model = whisper.load_model("small")

    resultado = model.transcribe(caminho_arquivo, language="pt")

    return resultado["text"]