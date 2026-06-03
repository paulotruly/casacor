import { useEffect, useRef, useState } from 'react'
import { classifyAudio } from '@/api'
import { convertWebMToWAV } from '@/api/convertWebMToWAV'
import type { ClassifyAudioResponse } from '@/types'

function Interface() {
  const [isRecording, setIsRecording] = useState(false)
  const [time, setTime] = useState(0)
  const [result, setResult] = useState<ClassifyAudioResponse | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const intervalRef = useRef<number | null>(null)
  const chunksRef = useRef<Blob[]>([])

  const formatTime = (seconds: number) => {
    const mins = String(Math.floor(seconds / 60)).padStart(2, '0')
    const secs = String(seconds % 60).padStart(2, '0')
    return `${mins}:${secs}`
  }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      })

      streamRef.current = stream

      const mediaRecorder = new MediaRecorder(stream)

      mediaRecorderRef.current = mediaRecorder

      chunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        chunksRef.current.push(event.data)
      }

      mediaRecorder.onstop = async () => {
        const audioBlob = await convertWebMToWAV(chunksRef.current)

        try {
          const response = await classifyAudio({
            audio: audioBlob
          })
          setResult(response)
        } catch (error) {
          console.error(error)
        }
      }

      mediaRecorder.start()
      setIsRecording(true)
      setTime(0)
      setResult(null)
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

  function stopRecording() {
    setIsRecording(false)
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop()
    }

    if (streamRef.current) {
      streamRef.current
        .getTracks()
        .forEach((track) => track.stop())
    }
  }

  useEffect(() => {
    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  return (
    <div className="max-w-editorial mx-auto px-8 lg:px-16 py-12 lg:py-20">
      <div className="grid lg:grid-cols-5 gap-12 lg:gap-16">

        <div className="lg:col-span-3">
          <div className="mb-10">
            <div className="w-8 h-[1px] bg-casacor-gold mb-6" />
            <h1 className="text-heading-md text-casacor-black font-normal">
              Gravador de áudio
            </h1>
            <p className="text-body-lg text-casacor-gray-medium font-light mt-3">
              Pressione "Começar" para capturar o som ambiente. O sistema analisa e classifica o áudio em tempo real.
            </p>
          </div>

          <div className="card-premium p-8 lg:p-10 space-y-8">
            <div className="flex items-center justify-between">
              <span className="text-caption text-casacor-gray-dark uppercase tracking-widest">
                Status da gravação
              </span>
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full transition-colors duration-300 ${isRecording ? 'bg-casacor-gold' : 'bg-casacor-gray-medium'}`} />
                <span className={`text-caption uppercase tracking-wider ${isRecording ? 'text-casacor-gold' : 'text-casacor-gray-medium'}`}>
                  {isRecording ? 'Gravando' : 'Parado'}
                </span>
              </div>
            </div>

            <div className="divider-line" />

            <div className="py-8 flex items-center justify-center">
              <span className={`font-mono text-[4rem] lg:text-[5rem] font-light tracking-wider transition-colors duration-300 ${isRecording ? 'text-casacor-black' : 'text-casacor-gray-medium'}`}>
                {formatTime(time)}
              </span>
            </div>

            <div className="divider-line" />

            <div className="flex gap-4">
              <button
                onClick={startRecording}
                disabled={isRecording}
                className={`btn-primary flex-1 transition-all duration-200 ${
                  isRecording
                    ? 'opacity-40 cursor-not-allowed'
                    : 'hover:scale-[1.02] active:scale-[0.98]'
                }`}
              >
                {isRecording ? 'Gravando...' : 'Começar'}
              </button>

              <button
                onClick={stopRecording}
                disabled={!isRecording}
                className={`btn-outline flex-1 transition-all duration-200 ${
                  !isRecording
                    ? 'opacity-40 cursor-not-allowed border-casacor-gray-medium text-casacor-gray-medium'
                    : 'hover:scale-[1.02] active:scale-[0.98]'
                }`}
              >
                Parar
              </button>
            </div>
          </div>

          <div className="mt-8">
            <svg className="w-full h-6 opacity-15" viewBox="0 0 600 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M0 12 L30 4 L60 12 L90 6 L120 12 L150 8 L180 12 L210 3 L240 12 L270 7 L300 12 L330 5 L360 12 L390 9 L420 12 L450 2 L480 12 L510 10 L540 12 L570 1 L600 12" stroke="#4A4A4A" strokeWidth="0.4" />
              <line x1="0" y1="12" x2="600" y2="12" stroke="#4A4A4A" strokeWidth="0.2" strokeDasharray="3 6" />
            </svg>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="mb-10">
            <div className="w-8 h-[1px] bg-casacor-gold mb-6" />
            <h2 className="text-heading-sm text-casacor-black">
              Classificação
            </h2>
            <p className="text-body-sm text-casacor-gray-medium mt-2">
              Resultado da análise do áudio capturado
            </p>
          </div>

          <div className="card-premium p-8 min-h-[240px] flex flex-col">
            {result ? (
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-caption text-casacor-gray-dark uppercase tracking-widest">
                      Classe detectada
                    </span>
                    <span className="text-caption text-casacor-gold uppercase tracking-wider">
                      {(result.confidence * 100).toFixed(1)}%
                    </span>
                  </div>

                  <div className="flex items-center gap-4 mt-2">
                    <div
                      className="w-8 h-8 rounded-full border border-casacor-line"
                      style={{ backgroundColor: result.color_hex }}
                    />
                    <div>
                      <h3 className="text-heading-sm text-casacor-black">
                        {result.detected_class}
                      </h3>
                      <p className="text-body-sm text-casacor-gray-medium mt-0.5">
                        Cor aplicada: {result.applied_color}
                      </p>
                    </div>
                  </div>
                </div>

                {result.secondary_classes && result.secondary_classes.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-casacor-line">
                    <span className="text-caption text-casacor-gray-medium uppercase tracking-widest">
                      Classes secundárias
                    </span>
                    <div className="mt-3 space-y-2">
                      {result.secondary_classes.map(([cls, conf], i) => (
                        <div key={i} className="flex items-center justify-between">
                          <span className="text-body-sm text-casacor-gray-dark">{cls}</span>
                          <span className="text-caption text-casacor-gray-medium">{(conf * 100).toFixed(1)}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 rounded-full border border-casacor-line flex items-center justify-center mb-4">
                  <svg className="w-5 h-5 text-casacor-gray-medium" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 6.75a2.25 2.25 0 00-2.25 2.25v1.5a2.25 2.25 0 002.25 2.25m0-6a2.25 2.25 0 012.25 2.25v1.5a2.25 2.25 0 01-2.25 2.25" />
                  </svg>
                </div>
                <p className="text-body-sm text-casacor-gray-medium">
                  Grave um áudio para ver o resultado da classificação
                </p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}

export default Interface
