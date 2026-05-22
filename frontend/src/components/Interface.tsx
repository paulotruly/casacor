import { useEffect, useRef, useState } from 'react'
import { classifyAudio } from '@/api'
import { convertWebMToWAV } from '@/api/convertWebMToWAV'

function Interface() {
  const [isRecording, setIsRecording] = useState(false)
  const [time, setTime] = useState(0)
  const [result, setResult] = useState("")

  const mediaRecorderRef = useRef<MediaRecorder | null>(null) // serve pra manter a referência do MediaRecorder, que é o objeto responsável por controlar a gravação do áudio. ele é inicializado como null e atualizado quando a gravação começa
  const streamRef = useRef<MediaStream | null>(null) // serve pra manter a referência do MediaStream, que é o objeto que representa o fluxo de áudio capturado pelo microfone. ele também é inicializado como null e atualizado quando a gravação começa
  const intervalRef = useRef<number | null>(null) // serve pra manter a referência do intervalo que atualiza o tempo de gravação. ele é inicializado como null e atualizado quando a gravação começa, e limpo quando a gravação para ou quando o componente é desmontado
  const chunksRef = useRef<Blob[]>([]) // serve pra manter a referência dos chunks de áudio gravados. ele é inicializado como um array vazio e atualizado toda vez que o MediaRecorder emite um evento de dataavailable, que indica que um novo chunk de áudio está disponível. os chunks são armazenados nesse array pra que possam ser processados ou enviados para a API depois que a gravação for finalizada 

  // essa função formata o tempo de gravação em minutos e segundos, usando a função padStart pra garantir que os números tenham sempre dois dígitos
  // é mais pro lado estético, pra mostrar o tempo de gravação de uma forma mais amigável pro usuário
  const formatTime = (seconds: number) => {
    const mins = String(Math.floor(seconds / 60)).padStart(2, '0')
    const secs = String(seconds % 60).padStart(2, '0')
    return `${mins}:${secs}`
  }

  // essa função é responsável por iniciar a gravação do áudio
  // ela usa a API de MediaDevices pra solicitar acesso ao microfone do usuário,
  // e se o acesso for concedido, ela cria um novo MediaRecorder com o fluxo de áudio capturado.
  // depois, ela inicia a gravação, atualiza o estado pra indicar que a gravação está em andamento,
  // e configura um intervalo que atualiza o tempo de gravação a cada segundo.
  // se o tempo atingir 10 segundos, a gravação é parada automaticamente
  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ // solicita acesso ao microfone do usuário, e se o acesso for concedido, retorna um objeto MediaStream que representa o fluxo de áudio capturado
        audio: true,
      })

      streamRef.current = stream // armazena o fluxo de áudio capturado na referência streamRef, pra que ele possa ser acessado posteriormente, por exemplo, pra parar a gravação ou liberar os recursos do microfone
      
      const mediaRecorder = new MediaRecorder(stream) // cria um novo MediaRecorder, passando o fluxo de áudio capturado como argumento. o MediaRecorder é o objeto que vai controlar a gravação do áudio, permitindo iniciar, pausar, parar e acessar os dados gravados
      
      mediaRecorderRef.current = mediaRecorder // armazena a referência do MediaRecorder na referência mediaRecorderRef, pra que ele possa ser acessado posteriormente, por exemplo, pra parar a gravação ou acessar os dados gravados
      
      // ??
      chunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        chunksRef.current.push(event.data)
      }

      // quando parar de gravar, processa o áudio
      mediaRecorder.onstop = async () => {
        const audioBlob = await convertWebMToWAV(chunksRef.current)

        try {
          const response = await classifyAudio({
            audio: audioBlob
          })
          console.log(response.detected_class)
          setResult(response.detected_class)
        } catch (error) {
          console.error(error)
        }
      }

      mediaRecorder.start() // inicia a gravação do áudio usando o método start do MediaRecorder. a partir desse momento, o áudio capturado pelo microfone começa a ser gravado
      setIsRecording(true)
      setTime(0)
      // configura um intervalo que atualiza o tempo de gravação a cada segundo usando a função setInterval. a cada segundo, o tempo é incrementado em 1, e se o tempo atingir 10 segundos, a gravação é parada automaticamente chamando a função stopRecording
      intervalRef.current = window.setInterval(() => {
        setTime((prev) => {
          if (prev >= 9) {
            stopRecording()
            return 10
          }
          return prev + 1
        })
      }, 1000)
    } catch (error) {
      console.error(error)
    }
  }

  // essa função é responsável por parar a gravação do áudio
  function stopRecording() {
    setIsRecording(false)
    if (intervalRef.current !== null) { // isso garante que o intervalo seja interrompido e não continue atualizando o tempo após a gravação ser parada
      clearInterval(intervalRef.current) 
      intervalRef.current = null
    }

    if (mediaRecorderRef.current) { // isso garante que a gravação seja parada usando o método stop do MediaRecorder, o que finaliza a gravação e torna os dados gravados disponíveis para serem processados ou salvos
      mediaRecorderRef.current.stop()
    }

    if (streamRef.current) { // isso garante que os recursos do microfone sejam liberados, parando todas as faixas de áudio do fluxo usando o método getTracks do MediaStream e o método stop de cada faixa. isso é importante pra evitar que o microfone continue capturando áudio ou consumindo recursos do sistema após a gravação ser parada
      streamRef.current
        .getTracks()
        .forEach((track) => track.stop())
    }
  }

  // esse efeito é usado pra limpar o intervalo de atualização do tempo quando o componente é desmontado,
  // garantindo que não haja vazamento de memória ou comportamento inesperado caso o usuário navegue para
  // outra página ou feche a aplicação enquanto a gravação está em andamento
  useEffect(() => {
    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl">
        <h1 className="text-2xl font-bold text-white mb-6">
          Gravar áudio
        </h1>

        <div className="flex flex-col gap-4">
          <div className="bg-zinc-800 rounded-2xl p-4 flex items-center justify-center">
            <span className="text-green-400 font-mono text-xl">
              {formatTime(time)}
            </span>
          </div>

          <button
            onClick={startRecording}
            disabled={isRecording}
            className={`w-full py-3 rounded-2xl font-semibold transition-all ${
              isRecording
                ? 'bg-zinc-700 text-zinc-400 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-500 text-white'
            }`}
          >
            {isRecording
              ? 'Gravando...'
              : 'Começar'}
          </button>

          <button
            onClick={stopRecording}
            disabled={!isRecording}
            className={`w-full py-3 rounded-2xl font-semibold transition-all ${
              !isRecording
                ? 'bg-zinc-700 text-zinc-400 cursor-not-allowed'
                : 'bg-red-600 hover:bg-red-500 text-white'
            }`}
          >
            Parar
          </button>
        </div>
        
        {result && (
        <div className="mt-8 bg-zinc-800 border border-zinc-700 rounded-2xl p-5">
          <p className="text-zinc-400 text-sm mb-2">
            Resultado da classificação
          </p>

          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-white text-xl font-bold">
                {result || 'Aguardando...'}
              </h2>

              <p className="text-zinc-400 text-sm mt-1">
                {result ? 'Áudio analisado com sucesso' : 'Grave um áudio para classificar'}
              </p>
            </div>

            <div className={`px-4 py-2 rounded-xl font-semibold ${
              result ? 'bg-green-600/20 text-green-400' : 'bg-zinc-700/20 text-zinc-400'
            }`}>
              {result ? '✓' : '-'}
            </div>
          </div>
        </div>
        )}

      </div>
    </div>
  )
}

export default Interface