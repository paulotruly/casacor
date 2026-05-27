import { useState } from 'react'
import { saveLifxToken } from '@/api/lifx'

interface LifxTokenModalProps {
  isOpen: boolean
  onClose: () => void
  onTokenSaved: () => void
  existingToken?: boolean
}

function LifxTokenModal({ isOpen, onClose, onTokenSaved, existingToken = false }: LifxTokenModalProps) {
  const [token, setToken] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const isTokenInvalid = !token.trim()

  async function handleSaveToken() {
    if (isTokenInvalid) return
    try {
      setLoading(true)
      setError('')
      setSuccess(false)
      await saveLifxToken(token)
      setSuccess(true)
      setToken('')
      setTimeout(() => {
        onTokenSaved()
        onClose()
      }, 1500)
    } catch (error: any) {
      const errorMessage = error.message || 'Erro ao salvar token. Verifique se é válido.'
      setError(errorMessage)
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-6 z-50">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl">
        <h2 className="text-2xl font-bold text-white mb-2">
          {existingToken ? 'Atualizar Token LIFX' : 'Configurar Token LIFX'}
        </h2>
        <p className="text-zinc-400 mb-6 text-sm">
          {existingToken 
            ? 'Atualize seu token de autenticação da lâmpada LIFX'
            : 'Cole seu token de autenticação para controlar sua lâmpada LIFX'
          }
        </p>
        <div className="flex flex-col gap-4">
          <textarea
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Cole seu token LIFX aqui..."
            className={`w-full bg-zinc-800 border rounded-xl p-3 text-white outline-none resize-none h-24 transition-all ${
              error
                ? 'border-red-500 focus:border-red-500'
                : 'border-zinc-700 focus:border-green-500'
            }`}
          />
          {error && (
            <div className="bg-red-500/10 border border-red-500 rounded-xl p-3">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}
          {success && (
            <div className="bg-green-500/10 border border-green-500 rounded-xl p-3">
              <p className="text-green-400 text-sm">✓ Token salvo com sucesso!</p>
            </div>
          )}
          <div className="flex gap-3">
            <button
              onClick={handleSaveToken}
              disabled={loading || isTokenInvalid || success}
              className={`flex-1 py-3 rounded-2xl font-semibold transition-all ${
                loading || isTokenInvalid || success
                  ? 'bg-zinc-700 text-zinc-400 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-500 text-white'
              }`}
            >
              {loading ? 'Salvando...' : 'Salvar Token'}
            </button>
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-3 rounded-2xl font-semibold bg-zinc-800 hover:bg-zinc-700 text-white transition-all disabled:opacity-50"
            >
              Cancelar
            </button>
          </div>
          <p className="text-zinc-500 text-xs text-center mt-2">
            Seu token é criptografado e nunca será compartilhado
          </p>
        </div>
      </div>
    </div>
  )
}
export default LifxTokenModal