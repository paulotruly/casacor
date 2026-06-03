import { useEffect, useState } from 'react'
import {
  createClass,
  deleteClass,
  getAllClasses,
  getClasses,
  updateClass,
} from '@/api'
import type { SoundClass } from '@/types'
import LifxTokenModal from '@/components/LifxTokenModal'
import { getLifxTokenStatus } from '@/api/lifx'

function Config() {
  const [hasLifxToken, setHasLifxToken] = useState(false)
  const [isLifxModalOpen, setIsLifxModalOpen] = useState(false)
  const [loadingLifxStatus, setLoadingLifxStatus] = useState(true)

  async function fetchLifxTokenStatus() {
  try {
    const status = await getLifxTokenStatus()
    setHasLifxToken(status.has_token)
  } catch (error) {
    console.error(error)
  } finally {
    setLoadingLifxStatus(false)
  }
}

  const [classes, setClasses] = useState<SoundClass[]>([])
  const [allClasses, setAllClasses] = useState<SoundClass[]>([])

  const [selectedClass, setSelectedClass] = useState('')
  const [selectedColor, setSelectedColor] = useState('#B79B6C')
  const [selectedColorName, setSelectedColorName] = useState('')

  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)

  const [isModalOpen, setIsModalOpen] = useState(false)

  const [editingClass, setEditingClass] = useState<SoundClass | null>(null)

  const [editColor, setEditColor] = useState('#B79B6C')
  const [editColorName, setEditColorName] = useState('')

  const [updating, setUpdating] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const isFormInvalid =
    !selectedClass ||
    !selectedColorName.trim()

  async function fetchData() {
    try {
      const [userClasses, availableClasses] = await Promise.all([
        getClasses(),
        getAllClasses(),
      ])

      setClasses(userClasses)
      setAllClasses(availableClasses)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateClass() {
    if (isFormInvalid) return

    try {
      setCreating(true)

      const newClass = await createClass({
        class_name: selectedClass,
        color_hex: selectedColor,
        color_name: selectedColorName,
      })

      setClasses((prev) => [...prev, newClass])

      setSelectedClass('')
      setSelectedColor('#B79B6C')
      setSelectedColorName('')
    } catch (error) {
      console.error(error)
    } finally {
      setCreating(false)
    }
  }

  function handleOpenModal(soundClass: SoundClass) {
    setEditingClass(soundClass)

    setEditColor(soundClass.color_hex)
    setEditColorName(soundClass.color_name)

    setIsModalOpen(true)
  }

  async function handleUpdateClass() {
    if (!editingClass) return

    try {
      setUpdating(true)

      await updateClass(editingClass.class_name, {
        color_hex: editColor,
        color_name: editColorName,
      })

      setClasses((prev) =>
        prev.map((item) =>
          item.class_name === editingClass.class_name
            ? {
                ...item,
                color_hex: editColor,
                color_name: editColorName,
              }
            : item
        )
      )

      setIsModalOpen(false)
    } catch (error) {
      console.error(error)
    } finally {
      setUpdating(false)
    }
  }

  async function handleDeleteClass() {
    if (!editingClass) return

    try {
      setDeleting(true)

      await deleteClass(editingClass.class_name)

      setClasses((prev) =>
        prev.filter(
          (item) => item.class_name !== editingClass.class_name
        )
      )

      setIsModalOpen(false)
    } catch (error) {
      console.error(error)
    } finally {
      setDeleting(false)
    }
  }

  useEffect(() => {
    fetchData()
    fetchLifxTokenStatus()
  }, [])

  useEffect(() => {
  if (!isLifxModalOpen) {
    fetchLifxTokenStatus()
  }
}, [isLifxModalOpen])

  return (
    <div className="max-w-editorial mx-auto px-8 lg:px-16 py-12 lg:py-20">

      <div className="mb-12">
        <div className="w-8 h-[1px] bg-casacor-gold mb-6" />
        <h1 className="text-heading-md text-casacor-black font-light">
          Configurações
        </h1>
        <p className="text-body-lg text-casacor-gray-medium font-light mt-3">
          Gerencie as classes de som, cores e integração com a lâmpada LIFX.
        </p>
      </div>

      <div className="grid lg:grid-cols-5 gap-12 lg:gap-16">

        <div className="lg:col-span-3 space-y-10">

          <div className="card-premium p-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-heading-sm text-casacor-black">
                  Token LIFX
                </h2>
                <p className="font-light text-body-sm text-casacor-gray-medium mt-1">
                  {loadingLifxStatus
                    ? 'Verificando...'
                    : hasLifxToken
                      ? 'Token configurado e criptografado'
                      : 'Nenhum token configurado'}
                </p>
              </div>
              <button
                onClick={() => setIsLifxModalOpen(true)}
                className="btn-outline text-caption !px-5 !py-2 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              >
                {hasLifxToken ? 'Atualizar' : 'Configurar'}
              </button>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-heading-sm text-casacor-black">
                  Classes configuradas
                </h2>
                <p className="text-body-sm text-casacor-gray-medium mt-1">
                  {classes.length} classes ativas
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {loading ? (
                <div className="card-premium p-6">
                  <p className="text-body-sm text-casacor-gray-medium">
                    Carregando classes...
                  </p>
                </div>
              ) : classes.length === 0 ? (
                <div className="card-premium p-6">
                  <p className="text-body-sm text-casacor-gray-medium">
                    Nenhuma classe configurada
                  </p>
                </div>
              ) : (
                classes.map((soundClass) => (
                  <button
                    key={soundClass.class_name}
                    onClick={() => handleOpenModal(soundClass)}
                    className="card-premium w-full text-left p-5 flex items-center justify-between transition-all duration-200 hover:border-casacor-gold hover:shadow-sm hover:-translate-y-0.5 cursor-pointer"
                  >
                    <div>
                      <h3 className="text-body-lg text-casacor-black font-medium">
                        {soundClass.class_name}
                      </h3>
                      <p className="text-body-sm text-casacor-gray-medium mt-0.5">
                        {soundClass.color_name}
                      </p>
                    </div>

                    <div
                      className="w-8 h-8 rounded-full border border-casacor-line"
                      style={{
                        backgroundColor: soundClass.color_hex,
                      }}
                    />
                  </button>
                ))
              )}
            </div>
          </div>

        </div>

        <div className="lg:col-span-2">
          <div className="card-premium p-8">
            <h2 className="text-heading-sm text-casacor-black mb-1">
              Adicionar classe
            </h2>
            <p className="font-lighttext-body-sm text-casacor-gray-medium mb-6">
              Vincule um som a uma cor
            </p>

            <div className="space-y-5">
              <select
                value={selectedClass}
                onChange={(event) => setSelectedClass(event.target.value)}
                className="input-line"
              >
                <option value="">
                  Selecione uma categoria
                </option>

                {allClasses.map((soundClass) => (
                  <option
                    key={soundClass.class_name}
                    value={soundClass.class_name}
                  >
                    {soundClass.class_name}
                  </option>
                ))}
              </select>

              <input
                type="text"
                value={selectedColorName}
                onChange={(event) => setSelectedColorName(event.target.value)}
                placeholder="Nome da cor"
                className="input-line"
              />

              <div className="flex items-center gap-4 pt-2">
                <input
                  type="color"
                  value={selectedColor}
                  onChange={(event) => setSelectedColor(event.target.value)}
                  className="w-10 h-10 bg-transparent border-none cursor-pointer p-0"
                />
                <div>
                  <p className="text-body-sm text-casacor-black font-medium">
                    Cor da lâmpada
                  </p>
                  <p className="text-caption text-casacor-gray-medium">
                    Escolha a cor para esta classe
                  </p>
                </div>
              </div>

              <button
                onClick={handleCreateClass}
                disabled={creating || isFormInvalid}
                className={`btn-primary w-full mt-4 transition-all duration-200 ${
                  creating || isFormInvalid
                    ? 'opacity-40 cursor-not-allowed'
                    : 'hover:scale-[1.01] active:scale-[0.99]'
                }`}
              >
                {creating ? 'Adicionando...' : 'Adicionar'}
              </button>
            </div>
          </div>
        </div>

      </div>

      {isModalOpen && editingClass && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-6 z-50">
          <div className="card-premium-solid w-full max-w-md p-8">
            <h2 className="text-heading-sm text-casacor-black mb-1">
              Editar classe
            </h2>
            <p className="text-body-sm text-casacor-gray-medium mb-6">
              {editingClass.class_name}
            </p>

            <div className="space-y-5">
              <input
                type="text"
                value={editColorName}
                onChange={(event) => setEditColorName(event.target.value)}
                placeholder="Nome da cor"
                className="input-line"
              />

              <div className="flex items-center gap-4 pt-2">
                <input
                  type="color"
                  value={editColor}
                  onChange={(event) => setEditColor(event.target.value)}
                  className="w-10 h-10 bg-transparent border-none cursor-pointer p-0"
                />
                <div>
                  <p className="text-body-sm text-casacor-black font-medium">
                    Cor da lâmpada
                  </p>
                  <p className="text-caption text-casacor-gray-medium">
                    Atualize a cor vinculada à classe
                  </p>
                </div>
              </div>

              <div className="divider-line my-2" />

              <div className="flex gap-3">
                <button
                  onClick={handleUpdateClass}
                  disabled={updating}
                  className={`btn-primary flex-1 transition-all duration-200 ${updating ? 'opacity-40 cursor-not-allowed' : 'hover:scale-[1.02] active:scale-[0.98]'}`}
                >
                  {updating ? 'Salvando...' : 'Salvar'}
                </button>

                <button
                  onClick={handleDeleteClass}
                  disabled={deleting}
                  className="btn-outline flex-1 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                >
                  {deleting ? 'Removendo...' : 'Desativar'}
                </button>
              </div>

              <button
                onClick={() => setIsModalOpen(false)}
                className="text-caption text-casacor-gray-medium uppercase tracking-widest w-full py-3 bg-transparent border border-casacor-line transition-all duration-200 hover:text-casacor-black hover:border-casacor-black hover:scale-[1.01] active:scale-[0.99]"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

    <LifxTokenModal
      isOpen={isLifxModalOpen}
      onClose={() => setIsLifxModalOpen(false)}
      onTokenSaved={() => fetchLifxTokenStatus()}
      existingToken={hasLifxToken}
    />

    </div>
  )
}

export default Config
