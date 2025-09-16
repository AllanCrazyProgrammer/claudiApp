import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash2, X, Settings } from 'lucide-react';
import { useAppStore } from '@/stores/useAppStore';

interface TiposProductosModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TiposProductosModal({ isOpen, onClose }: TiposProductosModalProps) {
  const { tiposProductos, agregarTipoProducto, eliminarTipoProducto, actualizarTipoProducto } = useAppStore();
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [editando, setEditando] = useState<string | null>(null);
  const [formulario, setFormulario] = useState({
    nombre: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formulario.nombre.trim()) {
      alert('Por favor, ingresa el nombre del tipo');
      return;
    }

    // Verificar que el nombre no exista ya
    const nombreExiste = tiposProductos.some(tipo => 
      tipo.nombre.toLowerCase() === formulario.nombre.toLowerCase() && tipo.id !== editando
    );
    
    if (nombreExiste) {
      alert('Ya existe un tipo de producto con ese nombre');
      return;
    }

    if (editando) {
      actualizarTipoProducto(editando, formulario.nombre);
    } else {
      agregarTipoProducto(formulario.nombre);
    }

    resetFormulario();
  };

  const resetFormulario = () => {
    setFormulario({ nombre: '' });
    setMostrarFormulario(false);
    setEditando(null);
  };

  const iniciarEdicion = (tipo: { id: string; nombre: string }) => {
    setFormulario({ nombre: tipo.nombre });
    setEditando(tipo.id);
    setMostrarFormulario(true);
  };

  const confirmarEliminacion = (id: string, nombre: string) => {
    if (window.confirm(`¿Estás seguro de que deseas eliminar el tipo "${nombre}"?`)) {
      eliminarTipoProducto(id);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <Card className="border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Gestión de Tipos de Productos
              </CardTitle>
              <CardDescription>
                Administra los tipos de productos disponibles en tu catálogo
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Botón para agregar nuevo tipo */}
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Tipos Disponibles</h3>
              <Button
                onClick={() => setMostrarFormulario(true)}
                size="sm"
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Nuevo Tipo
              </Button>
            </div>

            {/* Formulario para agregar/editar tipo */}
            {mostrarFormulario && (
              <Card className="bg-gray-50">
                <CardContent className="pt-6">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Nombre del Tipo *
                      </label>
                      <input
                        type="text"
                        required
                        value={formulario.nombre}
                        onChange={(e) => setFormulario({ ...formulario, nombre: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Ej: Con Cabeza, Sin Cabeza, Entero, Freezeado"
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button type="submit">
                        {editando ? 'Actualizar' : 'Agregar'} Tipo
                      </Button>
                      <Button type="button" variant="outline" onClick={resetFormulario}>
                        Cancelar
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* Lista de tipos existentes */}
            <div className="space-y-2">
              {tiposProductos.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Settings className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                  <p>No hay tipos de productos configurados.</p>
                  <p className="text-sm mt-2">Agrega tu primer tipo haciendo clic en "Nuevo Tipo".</p>
                </div>
              ) : (
                tiposProductos.map((tipo) => (
                  <div
                    key={tipo.id}
                    className="flex items-center justify-between p-4 bg-white border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex-1">
                      <div className="font-medium">{tipo.nombre}</div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => iniciarEdicion(tipo)}
                        title="Editar tipo"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => confirmarEliminacion(tipo.id, tipo.nombre)}
                        className="text-red-600 hover:text-red-700 hover:border-red-300"
                        title="Eliminar tipo"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Botones de acción del modal */}
            <div className="flex justify-end pt-4 border-t">
              <Button variant="outline" onClick={onClose}>
                Cerrar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
