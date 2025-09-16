import { useEffect, useState } from "react";
import {
  Package,
  Users,
  TrendingUp,
  TrendingDown,
  Clock,
  Calendar,
  Star,
  Sparkles,
  Heart,
  Compass,
  Rocket,
  Eye,
  ArrowRight,
  Play,
} from "lucide-react";
import { FraseDelDia } from "../components/FraseDelDia";
import { useAppStore } from "../stores/useAppStore";

interface Seccion {
  id: string;
  titulo: string;
  descripcion: string;
  icono: any;
  color: string;
  gradiente: string;
  caracteristicas: string[];
  ruta: string;
}

export function Dashboard() {
  const { setCurrentPage } = useAppStore();
  const [scrollY, setScrollY] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    // Efecto parallax
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll);

    // Efecto de seguimiento del mouse
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);

    // Actualizar hora cada segundo
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("mousemove", handleMouseMove);
      clearInterval(timer);
    };
  }, []);

  // Función para navegar a las diferentes secciones
  const navegarA = (ruta: string) => {
    // Convertir la ruta a la página correspondiente
    const pagina = ruta.replace('/', '');
    setCurrentPage(pagina);
  };

  const secciones: Seccion[] = [
    {
      id: "productos",
      titulo: "Catálogo de Productos",
      descripcion:
        "El corazón de tu inventario donde registras y gestionas todos tus productos",
      icono: Package,
      color: "text-blue-600",
      gradiente: "from-blue-500 to-cyan-500",
      caracteristicas: [
        "Registro completo de productos con tipo y proveedor",
        "Asignación de proveedores propios del producto",
        "Informacion clara y concisa",
        "Seguimiento automático de existencias actuales",
      ],
      ruta: "productos",
    },
    {
      id: "proveedores",
      titulo: "Red de Proveedores",
      descripcion:
        "Gestiona tu cadena de suministro y mantén contacto con tus aliados comerciales",
      icono: Users,
      color: "text-emerald-600",
      gradiente: "from-emerald-500 to-teal-500",
      caracteristicas: [
        "Base de datos completa de proveedores comerciales",
        "Edita y agrega proveedores que necesites",
        "Informacion clara y concisa",
      ],
      ruta: "proveedores",
    },
    {
      id: "entradas",
      titulo: "Entradas de Inventario",
      descripcion:
        "Registra cada compra y entrada de mercancía con precisión total",
      icono: TrendingUp,
      color: "text-green-600",
      gradiente: "from-green-500 to-emerald-500",
      caracteristicas: [
        "Registro detallado de compras con fechas y facturas",
        "Control de precios y cálculo automático de totales",
        "Sistema de lotes FIFO (Primero en Entrar, Primero en Salir)",
        "Actualización automática de precios promedio",
        "Trazabilidad completa de cada entrada",
      ],
      ruta: "entradas",
    },
    {
      id: "salidas",
      titulo: "Salidas y Ventas",
      descripcion: "Controla cada venta, salida y movimiento de tu inventario",
      icono: TrendingDown,
      color: "text-orange-600",
      gradiente: "from-orange-500 to-red-500",
      caracteristicas: [
        "Registro de ventas con lote y proveedor",
        "Control automático de stock disponible",
        "Sistema inteligente de rotación de lotes",
      ],
      ruta: "salidas",
    },
    {
      id: "existencias",
      titulo: "Control de Existencias",
      descripcion:
        "Visualiza en tiempo real el estado completo de tu inventario",
      icono: Eye,
      color: "text-purple-600",
      gradiente: "from-purple-500 to-pink-500",
      caracteristicas: [
        "Vista en tiempo real de todas las existencias",

        "Reportes detallados exportables a PDF",
      ],
      ruta: "existencias",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
      {/* Elementos de fondo con parallax */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          transform: `translateY(${scrollY * 0.5}px)`,
        }}
      >
        <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
        <div
          className="absolute top-40 right-10 w-72 h-72 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse"
          style={{ animationDelay: "2s" }}
        ></div>
        <div
          className="absolute bottom-20 left-20 w-72 h-72 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse"
          style={{ animationDelay: "4s" }}
        ></div>
      </div>

      {/* Cursor follower */}
      <div
        className="fixed w-4 h-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full pointer-events-none z-50 opacity-50 transition-all duration-100"
        style={{
          left: mousePosition.x - 8,
          top: mousePosition.y - 8,
          transform: `scale(${Math.sin(Date.now() * 0.01) * 0.3 + 1})`,
        }}
      />

      <div className="relative z-10 p-6 space-y-12">
        {/* Hero Section */}
        <div
          className="text-center py-20"
          style={{
            transform: `translateY(${scrollY * 0.3}px)`,
          }}
        >
          <div className="relative">
            <div className="absolute inset-0 flex items-center justify-center">
              <div
                className="w-96 h-96 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 rounded-full opacity-20 animate-spin"
                style={{ animationDuration: "20s" }}
              ></div>
            </div>
            <div className="relative z-10">
              <div className="flex justify-center mb-8">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full blur-lg opacity-50 animate-pulse"></div>
                  <div className="relative bg-gradient-to-r from-blue-500 to-purple-600 p-6 rounded-full">
                    <Sparkles className="h-16 w-16 text-white animate-bounce" />
                  </div>
                </div>
              </div>

              <h1 className="text-7xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-6 animate-pulse">
                ¡Hola Brenda y Claudia!
              </h1>

              <p
                className="text-2xl text-gray-700 mb-4 animate-fade-in-up"
                style={{ animationDelay: "0.5s" }}
              >
                Bienvenidas a su Sistema de Inventario Inteligente
              </p>

              <div
                className="flex items-center justify-center space-x-4 text-lg text-gray-600 animate-fade-in-up"
                style={{ animationDelay: "1s" }}
              >
                <Calendar className="h-5 w-5" />
                <span>
                  {currentTime.toLocaleDateString("es-ES", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
                <Clock className="h-5 w-5 ml-4" />
                <span>
                  {currentTime.toLocaleTimeString("es-ES", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Introducción */}
        <div
          className="max-w-4xl mx-auto text-center mb-16 animate-fade-in-up"
          style={{
            animationDelay: "1.5s",
            transform: `translateY(${scrollY * 0.1}px)`,
          }}
        >
          {/* Frase del Día */}
          <div
            className="max-w-4xl mx-auto animate-fade-in-up"
            style={{
              animationDelay: "2.2s",
              transform: `translateY(${scrollY * 0.08}px)`,
            }}
          >
            <FraseDelDia
              variant="hero"
              mostrarBotonRefresh={true}
              mostrarSelectorCategoria={true}
              className="hover:scale-105 transition-transform duration-500"
            />
          </div>
          <div className="my-12 border-t border-gray-200"></div>
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-white/20">
            <div className="flex justify-center mb-6">
              <div className="bg-gradient-to-r from-emerald-500 to-blue-500 p-4 rounded-2xl">
                <Rocket className="h-12 w-12 text-white" />
              </div>
            </div>
            <h2 className="text-4xl font-bold text-gray-800 mb-4">
              Su Nueva Herramienta de Gestión
            </h2>
            <p className="text-xl text-gray-600 leading-relaxed">
              Esta aplicación ha sido diseñada especialmente para revolucionar
              la forma en que manejan su inventario. Cada sección está pensada
              para simplificar sus procesos y brindarles información valiosa
              para tomar las mejores decisiones.
            </p>
            <div className="mt-6 flex justify-center">
              <div className="flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-3 rounded-full">
                <Heart className="h-5 w-5" />
                <span className="font-medium">
                  Hecho con dedicación para ustedes
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Secciones de la aplicación */}
        <div className="space-y-16">
          {secciones.map((seccion, index) => {
            const Icono = seccion.icono;
            const isEven = index % 2 === 0;

            return (
              <div
                key={seccion.id}
                className={`flex flex-col ${
                  isEven ? "lg:flex-row" : "lg:flex-row-reverse"
                } items-center gap-12 animate-fade-in-up`}
                style={{
                  animationDelay: `${2 + index * 0.3}s`,
                  transform: `translateY(${scrollY * (0.05 + index * 0.02)}px)`,
                }}
              >
                {/* Tarjeta principal */}
                <div className="flex-1">
                  <div className="group relative overflow-hidden rounded-3xl bg-white/90 backdrop-blur-sm shadow-2xl border border-white/20 p-8 hover:shadow-3xl transition-all duration-500 hover:-translate-y-2">
                    <div
                      className={`absolute inset-0 bg-gradient-to-br ${seccion.gradiente} opacity-5 group-hover:opacity-10 transition-opacity duration-500`}
                    ></div>

                    <div className="relative z-10">
                      <div className="flex items-center mb-6">
                        <div
                          className={`relative p-4 rounded-2xl bg-gradient-to-br ${seccion.gradiente} shadow-lg mr-4 group-hover:scale-110 transition-transform duration-300`}
                        >
                          <Icono className="h-8 w-8 text-white" />
                          <div className="absolute inset-0 bg-white/20 rounded-2xl animate-pulse"></div>
                        </div>
                        <div>
                          <h3 className="text-3xl font-bold text-gray-800 mb-2">
                            {seccion.titulo}
                          </h3>
                          <p className="text-lg text-gray-600">
                            {seccion.descripcion}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        {seccion.caracteristicas.map((caracteristica, idx) => (
                          <div
                            key={idx}
                            className="flex items-start space-x-3 group-hover:translate-x-2 transition-transform duration-300"
                            style={{ transitionDelay: `${idx * 100}ms` }}
                          >
                            <div
                              className={`mt-2 w-2 h-2 rounded-full bg-gradient-to-r ${seccion.gradiente} flex-shrink-0`}
                            ></div>
                            <p className="text-gray-700 leading-relaxed">
                              {caracteristica}
                            </p>
                          </div>
                        ))}
                      </div>

                      <div className="mt-8">
                        <button
                          onClick={() => navegarA(seccion.ruta)}
                          className={`group/btn relative overflow-hidden bg-gradient-to-r ${seccion.gradiente} text-white px-8 py-4 rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105`}
                        >
                          <div className="absolute inset-0 bg-white/20 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300"></div>
                          <div className="relative flex items-center space-x-2">
                            <span>Explorar {seccion.titulo}</span>
                            <ArrowRight className="h-5 w-5 group-hover/btn:translate-x-1 transition-transform duration-300" />
                          </div>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Visualización interactiva */}
                <div className="flex-1">
                  <div className="relative">
                    <div
                      className={`w-full h-80 rounded-3xl bg-gradient-to-br ${seccion.gradiente} p-8 shadow-2xl overflow-hidden`}
                    >
                      <div className="absolute inset-0 bg-black/10"></div>
                      <div className="relative z-10 h-full flex flex-col justify-center items-center text-white">
                        <div className="relative mb-6">
                          <div className="absolute inset-0 bg-white/20 rounded-full blur-xl animate-pulse"></div>
                          <div className="relative bg-white/20 backdrop-blur-sm p-6 rounded-full">
                            <Icono className="h-16 w-16 animate-bounce" />
                          </div>
                        </div>
                        <h4 className="text-2xl font-bold mb-4 text-center">
                          Vista Previa
                        </h4>
                        <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
                          {[1, 2, 3, 4].map((item) => (
                            <div
                              key={item}
                              className="bg-white/20 backdrop-blur-sm rounded-lg p-4 animate-pulse"
                              style={{ animationDelay: `${item * 200}ms` }}
                            >
                              <div className="h-3 bg-white/40 rounded mb-2"></div>
                              <div className="h-2 bg-white/30 rounded"></div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Elementos decorativos animados */}
                      <div className="absolute top-4 right-4 w-8 h-8 bg-white/20 rounded-full animate-ping"></div>
                      <div
                        className="absolute bottom-4 left-4 w-6 h-6 bg-white/20 rounded-full animate-pulse"
                        style={{ animationDelay: "1s" }}
                      ></div>
                      <div
                        className="absolute top-1/2 left-4 w-4 h-4 bg-white/20 rounded-full animate-bounce"
                        style={{ animationDelay: "2s" }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Call to Action Final */}
        <div
          className="text-center py-16 animate-fade-in-up"
          style={{
            animationDelay: "4s",
            transform: `translateY(${scrollY * 0.1}px)`,
          }}
        >
          <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-3xl p-12 text-white shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-black/20"></div>
            <div className="relative z-10">
              <div className="flex justify-center mb-6">
                <div className="bg-white/20 backdrop-blur-sm p-4 rounded-2xl">
                  <Star
                    className="h-12 w-12 text-yellow-300 animate-spin"
                    style={{ animationDuration: "3s" }}
                  />
                </div>
              </div>
              <h2 className="text-4xl font-bold mb-6">
                ¡Están Listas Para Comenzar!
              </h2>
              <p className="text-xl mb-8 max-w-2xl mx-auto">
                Su nuevo sistema de inventario está configurado y esperando.
                Cada sección les ayudará a optimizar sus procesos y tomar
                decisiones más inteligentes.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button 
                  onClick={() => navegarA('productos')}
                  className="bg-white text-blue-600 px-8 py-4 rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center justify-center space-x-2"
                >
                  <Play className="h-5 w-5" />
                  <span>Comenzar con Productos</span>
                </button>
                <button 
                  onClick={() => navegarA('existencias')}
                  className="border-2 border-white text-white px-8 py-4 rounded-2xl font-bold hover:bg-white hover:text-blue-600 transition-all duration-300 flex items-center justify-center space-x-2"
                >
                  <Compass className="h-5 w-5" />
                  <span>Ver Existencias</span>
                </button>
              </div>
            </div>

            {/* Efectos de fondo */}
            <div className="absolute -top-8 -left-8 w-32 h-32 bg-white/10 rounded-full blur-2xl animate-pulse"></div>
            <div
              className="absolute -bottom-8 -right-8 w-24 h-24 bg-white/10 rounded-full blur-xl animate-pulse"
              style={{ animationDelay: "2s" }}
            ></div>
          </div>
        </div>
      </div>

      {/* CSS personalizado para animaciones */}
      <style>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 0.8s ease-out forwards;
          opacity: 0;
        }
        
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
      `}</style>
    </div>
  );
}
