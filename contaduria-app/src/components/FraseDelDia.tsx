import { useEffect, useState } from 'react';
import { Quote, RefreshCw, Sparkles, Settings, ChevronDown, Globe } from 'lucide-react';
import { frasesService, type FraseEstoica, type CategoriaFrase } from '../lib/frasesService';

interface FraseDelDiaProps {
  className?: string;
  mostrarBotonRefresh?: boolean;
  mostrarSelectorCategoria?: boolean;
  variant?: 'default' | 'compact' | 'hero';
}

export function FraseDelDia({ 
  className = '', 
  mostrarBotonRefresh = false,
  mostrarSelectorCategoria = false,
  variant = 'default'
}: FraseDelDiaProps) {
  const [frase, setFrase] = useState<FraseEstoica | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categoriaActual, setCategoriaActual] = useState<CategoriaFrase | null>(null);
  const [mostrarSelector, setMostrarSelector] = useState(false);
  const [categorias] = useState(() => frasesService.obtenerCategorias());
  const [mostrarNotificacionAPI, setMostrarNotificacionAPI] = useState(false);

  const cargarFrase = async () => {
    try {
      setCargando(true);
      setError(null);
      const nuevaFrase = await frasesService.obtenerFraseDelDia();
      setFrase(nuevaFrase);
    } catch (err) {
      setError('No se pudo cargar la frase del día');
      console.error('Error cargando frase:', err);
    } finally {
      setCargando(false);
    }
  };

  const obtenerFraseAleatoria = async () => {
    try {
      setCargando(true);
      const nuevaFrase = await frasesService.obtenerFraseAleatoria();
      setFrase(nuevaFrase);
    } catch (err) {
      setError('No se pudo cargar una nueva frase');
      console.error('Error obteniendo frase aleatoria:', err);
    } finally {
      setCargando(false);
    }
  };

  const cambiarCategoria = async (categoria: CategoriaFrase | null) => {
    try {
      setCargando(true);
      frasesService.establecerCategoria(categoria);
      setCategoriaActual(categoria);
      setMostrarSelector(false);
      
      // Cargar nueva frase con la categoría seleccionada
      const nuevaFrase = await frasesService.obtenerFraseDelDia();
      setFrase(nuevaFrase);
    } catch (err) {
      setError('No se pudo cambiar la categoría');
      console.error('Error cambiando categoría:', err);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    // Cargar categoría actual al montar el componente
    const categoria = frasesService.obtenerCategoriaActual();
    setCategoriaActual(categoria);
    cargarFrase();
  }, []);

  if (cargando) {
    return (
      <div className={`flex items-center justify-center p-6 ${className}`}>
        <div className="flex items-center space-x-2 text-gray-500">
          <Sparkles className="h-5 w-5 animate-spin" />
          <span>Cargando sabiduría...</span>
        </div>
      </div>
    );
  }

  if (error || !frase) {
    return (
      <div className={`p-6 text-center ${className}`}>
        <div className="text-red-500 mb-4">{error || 'No se pudo cargar la frase'}</div>
        <button 
          onClick={cargarFrase}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
        >
          Intentar de nuevo
        </button>
      </div>
    );
  }

  // Variante compacta para espacios pequeños
  if (variant === 'compact') {
    return (
      <div className={`bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-4 border border-indigo-100 ${className}`}>
        <div className="flex items-start space-x-3">
          <Quote className="h-5 w-5 text-indigo-500 mt-1 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-700 italic leading-relaxed">
              "{frase.texto}"
            </p>
            <p className="text-xs text-indigo-600 font-medium mt-2">
              — {frase.autor}
            </p>
          </div>
          {mostrarBotonRefresh && (
            <button
              onClick={obtenerFraseAleatoria}
              className="p-1 text-indigo-400 hover:text-indigo-600 transition-colors"
              title="Nueva frase"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    );
  }

  // Componente del selector de categorías
  const SelectorCategorias = () => (
    <div className="relative">
      <button
        onClick={() => setMostrarSelector(!mostrarSelector)}
        className="flex items-center space-x-2 bg-white/20 backdrop-blur-sm px-3 py-2 rounded-lg hover:bg-white/30 transition-colors"
        title="Seleccionar categoría"
      >
        <Settings className="h-4 w-4" />
        <span className="text-sm">
          {categoriaActual 
            ? categorias.find(c => c.valor === categoriaActual)?.emoji + ' ' + categorias.find(c => c.valor === categoriaActual)?.nombre
            : 'Todas las categorías'
          }
        </span>
        <ChevronDown className={`h-4 w-4 transition-transform ${mostrarSelector ? 'rotate-180' : ''}`} />
      </button>

      {mostrarSelector && (
        <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 max-h-80 overflow-y-auto">
          <div className="p-2">
            <button
              onClick={() => cambiarCategoria(null)}
              className={`w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors ${
                !categoriaActual ? 'bg-indigo-50 text-indigo-600' : 'text-gray-700'
              }`}
            >
              <div className="flex items-center space-x-3">
                <span className="text-lg">🎯</span>
                <div>
                  <div className="font-medium">Todas las categorías</div>
                  <div className="text-xs text-gray-500">Frases aleatorias de todos los temas</div>
                </div>
              </div>
            </button>
            
            {categorias.map(categoria => (
              <button
                key={categoria.valor}
                onClick={() => cambiarCategoria(categoria.valor)}
                className={`w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors ${
                  categoriaActual === categoria.valor ? 'bg-indigo-50 text-indigo-600' : 'text-gray-700'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-lg">{categoria.emoji}</span>
                  <div>
                    <div className="font-medium">{categoria.nombre}</div>
                    <div className="text-xs text-gray-500">{categoria.descripcion}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  // Variante hero para destacar
  if (variant === 'hero') {
    return (
      <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-8 text-white shadow-2xl ${className}`}>
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl">
                <Quote className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Frase del Día</h3>
                <p className="text-white/80 text-sm">
                  {frase?.categoria 
                    ? `${categorias.find(c => c.valor === frase.categoria)?.emoji} ${categorias.find(c => c.valor === frase.categoria)?.nombre}`
                    : 'Sabiduría Estoica'
                  }
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {mostrarSelectorCategoria && <SelectorCategorias />}
              {mostrarBotonRefresh && (
                <button
                  onClick={obtenerFraseAleatoria}
                  className="bg-white/20 backdrop-blur-sm p-2 rounded-lg hover:bg-white/30 transition-colors"
                  title="Nueva frase"
                >
                  <RefreshCw className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>
          
          <blockquote className="text-xl leading-relaxed mb-4 italic">
            "{frase.texto}"
          </blockquote>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <cite className="text-white/90 font-medium not-italic">
                — {frase.autor}
              </cite>
              {frasesService.esFraseDeAPI(frase) && (
                <div className="flex items-center space-x-1 bg-white/20 backdrop-blur-sm px-2 py-1 rounded-full" title="Frase obtenida de fuente externa">
                  <Globe className="h-3 w-3" />
                  <span className="text-xs font-medium">Fuente Externa</span>
                </div>
              )}
            </div>
            <div className="text-white/70 text-sm">
              {new Date(frase.fecha).toLocaleDateString('es-ES')}
            </div>
          </div>
        </div>
        
        {/* Elementos decorativos */}
        <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
        <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-white/5 rounded-full blur-3xl"></div>
        
        {/* Notificación de estado de API */}
        {mostrarNotificacionAPI && (
          <div className="absolute top-4 left-4 bg-blue-500/90 backdrop-blur-sm text-white px-3 py-2 rounded-lg text-sm font-medium animate-fade-in-up">
            🏠 Modo offline - Contenido curado localmente
          </div>
        )}
      </div>
    );
  }

  // Variante por defecto
  return (
    <div className={`bg-white/90 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/20 ${className}`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="bg-gradient-to-r from-indigo-500 to-purple-500 p-2 rounded-lg">
            <Quote className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Frase del Día</h3>
            <p className="text-gray-500 text-sm">Sabiduría Estoica</p>
          </div>
        </div>
        {mostrarBotonRefresh && (
          <button
            onClick={obtenerFraseAleatoria}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100"
            title="Nueva frase"
          >
            <RefreshCw className="h-5 w-5" />
          </button>
        )}
      </div>
      
      <blockquote className="text-gray-700 leading-relaxed mb-4 italic text-lg">
        "{frase.texto}"
      </blockquote>
      
      <div className="flex items-center justify-between">
        <cite className="text-indigo-600 font-medium not-italic">
          — {frase.autor}
        </cite>
        <div className="text-gray-400 text-sm">
          {new Date(frase.fecha).toLocaleDateString('es-ES')}
        </div>
      </div>
    </div>
  );
}
