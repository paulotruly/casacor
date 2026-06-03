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
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-6 z-50">
      <div className="card-premium-solid w-full max-w-md p-8">
        <h2 className="text-heading-sm text-casacor-black mb-1">
          {existingToken ? 'Atualizar Token LIFX' : 'Configurar Token LIFX'}
        </h2>
        <p className="text-body-sm text-casacor-gray-medium mb-6">
          {existingToken
            ? 'Atualize seu token de autenticação da lâmpada LIFX'
            : 'Cole seu token de autenticação para controlar sua lâmpada LIFX'
          }
        </p>
        <div className="space-y-5">
          <textarea
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Cole seu token LIFX aqui..."
            className="input-line resize-none h-24"
          />
          {error && (
            <div className="border border-red-300 bg-red-50/50 rounded p-3">
              <p className="text-body-sm text-red-600">{error}</p>
            </div>
          )}
          {success && (
            <div className="border border-casacor-gold/30 bg-casacor-gold/5 rounded p-3">
              <p className="text-body-sm text-casacor-gold">Token salvo com sucesso!</p>
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSaveToken}
              disabled={loading || isTokenInvalid || success}
              className={`btn-primary flex-1 transition-all duration-200 ${
                loading || isTokenInvalid || success
                  ? 'opacity-40 cursor-not-allowed'
                  : 'hover:scale-[1.02] active:scale-[0.98]'
              }`}
            >
              {loading ? 'Salvando...' : 'Salvar Token'}
            </button>
            <button
              onClick={onClose}
              disabled={loading}
              className="btn-outline flex-1 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            >
              Cancelar
            </button>
          </div>
          <p className="text-caption text-casacor-gray-medium text-center pt-2">
            Seu token é criptografado e nunca será compartilhado
          </p>
        </div>
      </div>
    </div>
  )
}
export default LifxTokenModal
