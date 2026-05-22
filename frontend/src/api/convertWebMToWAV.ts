export async function convertWebMToWAV(chunks: Blob[]): Promise<Blob> {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
  const webmBlob = new Blob(chunks, { type: 'audio/webm' })
  const arrayBuffer = await webmBlob.arrayBuffer()
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)
  
  // Converter AudioBuffer para WAV
  const numberOfChannels = audioBuffer.numberOfChannels
  const sampleRate = audioBuffer.sampleRate
  const format = 1 // PCM
  const bitDepth = 16
  
  const bytesPerSample = bitDepth / 8
  const frameLength = audioBuffer.length
  const dataLength = numberOfChannels * frameLength * bytesPerSample
  const bufferLength = 36 + dataLength
  
  const arrayView = new Uint8Array(44 + dataLength)
  
  const view = new DataView(arrayView.buffer)
  
  // WAV header
  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i))
    }
  }
  
  writeString(0, 'RIFF')
  view.setUint32(4, bufferLength, true)
  writeString(8, 'WAVE')
  writeString(12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, format, true)
  view.setUint16(22, numberOfChannels, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * numberOfChannels * bytesPerSample, true)
  view.setUint16(32, numberOfChannels * bytesPerSample, true)
  view.setUint16(34, bitDepth, true)
  writeString(36, 'data')
  view.setUint32(40, dataLength, true)
  
  // Write PCM samples
  const channels: Float32Array[] = []
  for (let i = 0; i < numberOfChannels; i++) {
    channels.push(audioBuffer.getChannelData(i))
  }
  
  let offset = 44
  const amp = Math.pow(2, bitDepth - 1) - 1
  for (let i = 0; i < frameLength; i++) {
    for (let channel = 0; channel < numberOfChannels; channel++) {
      let s = Math.max(-1, Math.min(1, channels[channel][i]))
      s = s < 0 ? s * 0x8000 : s * 0x7FFF
      view.setInt16(offset, s, true)
      offset += 2
    }
  }
  
  return new Blob([arrayView], { type: 'audio/wav' })
}