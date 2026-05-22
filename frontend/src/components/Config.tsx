import { useEffect, useState } from 'react'
import {
  createClass,
  deleteClass,
  getAllClasses,
  getClasses,
  updateClass,
} from '@/api'

import type { SoundClass } from '@/types'

function Config() {
  const [classes, setClasses] = useState<SoundClass[]>([])
  const [allClasses, setAllClasses] = useState<SoundClass[]>([])

  const [selectedClass, setSelectedClass] = useState('')
  const [selectedColor, setSelectedColor] = useState('#22c55e')
  const [selectedColorName, setSelectedColorName] = useState('')

  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)

  // controla se o modal de edição está aberto ou não
  const [isModalOpen, setIsModalOpen] = useState(false)

  // guarda a classe atualmente selecionada pra edição
  const [editingClass, setEditingClass] = useState<SoundClass | null>(null)

  // estados do formulário de edição
  const [editColor, setEditColor] = useState('#22c55e')
  const [editColorName, setEditColorName] = useState('')

  // controla o carregamento das ações dentro do modal
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
      setSelectedColor('#22c55e')
      setSelectedColorName('')
    } catch (error) {
      console.error(error)
    } finally {
      setCreating(false)
    }
  }

  // essa função abre o modal e preenche os campos com os dados atuais da classe
  function handleOpenModal(soundClass: SoundClass) {
    setEditingClass(soundClass)

    setEditColor(soundClass.color_hex)
    setEditColorName(soundClass.color_name)

    setIsModalOpen(true)
  }

  // essa função atualiza as configurações da classe selecionada
  async function handleUpdateClass() {
    if (!editingClass) return

    try {
      setUpdating(true)

      await updateClass(editingClass.class_name, {
        color_hex: editColor,
        color_name: editColorName,
      })

      // atualiza a lista localmente sem precisar recarregar tudo da API
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

  // essa função remove/desativa a classe do usuário
  async function handleDeleteClass() {
    if (!editingClass) return

    try {
      setDeleting(true)

      await deleteClass(editingClass.class_name)

      // remove a classe da lista local após deletar
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
  }, [])

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl">
        <h1 className="text-2xl font-bold text-white mb-6">
          Configurações
        </h1>

        <div className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">
            Classes configuradas
          </h2>

          <div className="flex flex-col gap-4">
            {loading ? (
              <div className="bg-zinc-800 rounded-2xl p-4">
                <p className="text-zinc-400">
                  Carregando classes...
                </p>
              </div>
            ) : classes.length === 0 ? (
              <div className="bg-zinc-800 rounded-2xl p-4">
                <p className="text-zinc-400">
                  Nenhuma classe configurada
                </p>
              </div>
            ) : (
              classes.map((soundClass) => (
                <button
                  key={soundClass.class_name}
                  onClick={() => handleOpenModal(soundClass)}
                  className="bg-zinc-800 border border-zinc-700 rounded-2xl p-4 flex items-center justify-between hover:border-green-500 transition-all"
                >
                  <div className="text-left">
                    <h3 className="text-white font-semibold text-lg">
                      {soundClass.class_name}
                    </h3>

                    <p className="text-zinc-400 text-sm mt-1">
                      {soundClass.color_name}
                    </p>
                  </div>

                  <div
                    className="w-10 h-10 rounded-full border-2 border-white"
                    style={{
                      backgroundColor: soundClass.color_hex,
                    }}
                  />
                </button>
              ))
            )}
          </div>
        </div>

        <div className="bg-zinc-800 border border-zinc-700 rounded-2xl p-5">
          <h2 className="text-lg font-semibold text-white mb-4">
            Adicionar nova classe
          </h2>

          <div className="flex flex-col gap-4">
            <select
              value={selectedClass}
              onChange={(event) => setSelectedClass(event.target.value)}
              className={`w-full border rounded-xl p-3 text-white outline-none transition-all ${
                !selectedClass
                  ? 'bg-zinc-900 border-red-500'
                  : 'bg-zinc-900 border-zinc-700 focus:border-green-500'
              }`}
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
              className={`w-full rounded-xl p-3 text-white outline-none transition-all ${
                !selectedColorName.trim()
                  ? 'bg-zinc-900 border border-red-500'
                  : 'bg-zinc-900 border border-zinc-700 focus:border-green-500'
              }`}
            />

            <div className="flex items-center gap-4">
              <input
                type="color"
                value={selectedColor}
                onChange={(event) => setSelectedColor(event.target.value)}
                className="w-16 h-16 bg-transparent border-none cursor-pointer"
              />

              <div>
                <p className="text-white font-medium">
                  Cor da lâmpada
                </p>

                <p className="text-zinc-400 text-sm">
                  Escolha a cor que será ativada quando essa classe for detectada
                </p>
              </div>
            </div>

            <button
              onClick={handleCreateClass}
              disabled={creating || isFormInvalid}
              className={`w-full py-3 rounded-2xl font-semibold transition-all ${
                creating || isFormInvalid
                  ? 'bg-zinc-700 text-zinc-400 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-500 text-white'
              }`}
            >
              {creating
                ? 'Adicionando...'
                : 'Adicionar nova classe'}
            </button>
          </div>
        </div>
      </div>

      {/* modal responsável por atualizar ou deletar uma classe existente */}
      {isModalOpen && editingClass && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-6 z-50">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl">
            <h2 className="text-2xl font-bold text-white mb-2">
              Editar classe
            </h2>

            <p className="text-zinc-400 mb-6">
              {editingClass.class_name}
            </p>

            <div className="flex flex-col gap-4">
              <input
                type="text"
                value={editColorName}
                onChange={(event) => setEditColorName(event.target.value)}
                placeholder="Nome da cor"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-white outline-none focus:border-green-500"
              />

              <div className="flex items-center gap-4">
                <input
                  type="color"
                  value={editColor}
                  onChange={(event) => setEditColor(event.target.value)}
                  className="w-16 h-16 bg-transparent border-none cursor-pointer"
                />

                <div>
                  <p className="text-white font-medium">
                    Cor da lâmpada
                  </p>

                  <p className="text-zinc-400 text-sm">
                    Atualize a cor vinculada à classe
                  </p>
                </div>
              </div>

              <div className="flex gap-3 mt-4">
                <button
                  onClick={handleUpdateClass}
                  disabled={updating}
                  className={`flex-1 py-3 rounded-2xl font-semibold transition-all ${
                    updating
                      ? 'bg-zinc-700 text-zinc-400 cursor-not-allowed'
                      : 'bg-green-600 hover:bg-green-500 text-white'
                  }`}
                >
                  {updating
                    ? 'Salvando...'
                    : 'Salvar'}
                </button>

                <button
                  onClick={handleDeleteClass}
                  disabled={deleting}
                  className={`flex-1 py-3 rounded-2xl font-semibold transition-all ${
                    deleting
                      ? 'bg-zinc-700 text-zinc-400 cursor-not-allowed'
                      : 'bg-red-600 hover:bg-red-500 text-white'
                  }`}
                >
                  {deleting
                    ? 'Removendo...'
                    : 'Desativar'}
                </button>
              </div>

              <button
                onClick={() => setIsModalOpen(false)}
                className="w-full py-3 rounded-2xl font-semibold bg-zinc-800 hover:bg-zinc-700 text-white transition-all"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Config