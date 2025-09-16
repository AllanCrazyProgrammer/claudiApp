interface FraseEstoica {
  texto: string;
  autor: string;
  fecha: string;
  categoria?: string;
}

type CategoriaFrase = 
  | 'sabiduria' 
  | 'paciencia' 
  | 'valor' 
  | 'serenidad' 
  | 'virtud' 
  | 'presente' 
  | 'adversidad' 
  | 'autocontrol' 
  | 'felicidad' 
  | 'muerte' 
  | 'justicia' 
  | 'amistad';

class FrasesEstoicasService {
  private readonly CACHE_KEY = 'frases_estoicas_cache';
  private readonly FECHA_KEY = 'ultima_fecha_frase';
  private readonly CATEGORIA_KEY = 'categoria_seleccionada';
  
  // APIs disponibles para obtener frases (con manejo robusto de errores)
  private readonly APIS = [
    // API gratuita y confiable de frases inspiracionales
    {
      nombre: 'ZenQuotesProxy',
      url: 'https://cors-anywhere.herokuapp.com/https://zenquotes.io/api/random',
      procesarRespuesta: (data: any) => ({
        texto: data[0]?.q || data.q,
        autor: data[0]?.a || data.a
      }),
      requiresProxy: true
    },
    // API alternativa simple y confiable
    {
      nombre: 'QuoteGarden',
      url: 'https://quote-garden.herokuapp.com/api/v3/quotes/random',
      procesarRespuesta: (data: any) => ({
        texto: data.data?.quoteText,
        autor: data.data?.quoteAuthor
      }),
      requiresProxy: false
    },
    // Frases estoicas adicionales como "pseudo-API" para cuando las APIs reales fallan
    {
      nombre: 'LocalAPI',
      url: 'local',
      procesarRespuesta: () => this.obtenerFraseLocalAleatoria(),
      requiresProxy: false
    }
  ];

  // Frases adicionales para simular API cuando las reales fallan
  private frasesAPISimuladas: Omit<FraseEstoica, 'fecha'>[] = [
    {
      texto: "El arte de vivir es más como la lucha libre que como la danza.",
      autor: "Marco Aurelio",
      categoria: "adversidad"
    },
    {
      texto: "Cuando te despiertes por la mañana, dite: Las personas con las que me encontraré hoy serán entrometidas, ingratas, arrogantes, deshonestas, celosas y hoscos.",
      autor: "Marco Aurelio",
      categoria: "paciencia"
    },
    {
      texto: "Si quieres mejorar, acepta ser considerado estúpido e insensato en asuntos externos.",
      autor: "Epicteto",
      categoria: "sabiduria"
    },
    {
      texto: "La riqueza no consiste en tener grandes posesiones, sino en tener pocas necesidades.",
      autor: "Epicteto",
      categoria: "virtud"
    },
    {
      texto: "Todo lo que necesitas son estos: certeza de juicio en el momento presente; acción por el bien común en el momento presente; y una actitud de gratitud en el momento presente por todo lo que se te presenta.",
      autor: "Marco Aurelio",
      categoria: "presente"
    },
    {
      texto: "Lo mejor que puedes hacer es no contarle a nadie lo que vas a hacer hasta que lo hayas hecho.",
      autor: "Séneca",
      categoria: "autocontrol"
    },
    {
      texto: "El hombre que sufre antes de ser necesario, sufre más de lo necesario.",
      autor: "Séneca",
      categoria: "serenidad"
    },
    {
      texto: "Ningún hombre fue honrado jamás por lo que recibió. El honor ha sido la recompensa por lo que dio.",
      autor: "Séneca",
      categoria: "virtud"
    },
    {
      texto: "Es imposible que un hombre aprenda lo que cree que ya sabe.",
      autor: "Epicteto",
      categoria: "sabiduria"
    },
    {
      texto: "Los obstáculos son el camino. Lo que se interpone en el camino se convierte en el camino.",
      autor: "Marco Aurelio",
      categoria: "adversidad"
    },
    {
      texto: "Ser feliz es muy fácil, pero es muy difícil ser simple.",
      autor: "Séneca",
      categoria: "felicidad"
    },
    {
      texto: "No busques que las cosas sucedan como quieres. Quiere las cosas como suceden y serás feliz.",
      autor: "Epicteto",
      categoria: "serenidad"
    },
    {
      texto: "El tiempo es la cosa más valiosa que podemos gastar.",
      autor: "Theophrastus",
      categoria: "presente"
    },
    {
      texto: "Quien es valiente es libre.",
      autor: "Séneca",
      categoria: "valor"
    },
    {
      texto: "La mejor venganza es no ser como tu enemigo.",
      autor: "Marco Aurelio",
      categoria: "virtud"
    },
    {
      texto: "Cada día es una nueva oportunidad para crecer y mejorar.",
      autor: "Epicteto",
      categoria: "presente"
    }
  ];
  
  // Frases estoicas predefinidas organizadas por categorías
  private frasesLocal: Omit<FraseEstoica, 'fecha'>[] = [
    // SABIDURÍA
    {
      texto: "No es lo que te sucede, sino cómo reaccionas a ello lo que importa.",
      autor: "Epicteto",
      categoria: "sabiduria"
    },
    {
      texto: "Todo lo que escuchamos es una opinión, no un hecho. Todo lo que vemos es perspectiva, no verdad.",
      autor: "Marco Aurelio",
      categoria: "sabiduria"
    },
    {
      texto: "Asociarse con personas de buen carácter es la única forma de crecer en sabiduría.",
      autor: "Séneca",
      categoria: "sabiduria"
    },
    {
      texto: "El sabio no se aflige por las cosas que no tiene, sino que se alegra por las que posee.",
      autor: "Epicteto",
      categoria: "sabiduria"
    },
    {
      texto: "La sabiduría consiste en saber qué hacer después.",
      autor: "Cleantes",
      categoria: "sabiduria"
    },
    {
      texto: "No hay viento favorable para el que no sabe hacia dónde va.",
      autor: "Séneca",
      categoria: "sabiduria"
    },
    {
      texto: "El conocimiento sin acción es inútil, y la acción sin conocimiento es peligrosa.",
      autor: "Crisipo",
      categoria: "sabiduria"
    },

    // PACIENCIA
    {
      texto: "El mejor remedio para la ira es la demora.",
      autor: "Séneca",
      categoria: "paciencia"
    },
    {
      texto: "La paciencia es la fortaleza del débil y la impaciencia, la debilidad del fuerte.",
      autor: "Marco Aurelio",
      categoria: "paciencia"
    },
    {
      texto: "Nada grande se ha hecho sin paciencia.",
      autor: "Epicteto",
      categoria: "paciencia"
    },
    {
      texto: "El tiempo es el recurso más valioso que tenemos. Úsalo sabiamente.",
      autor: "Séneca",
      categoria: "paciencia"
    },
    {
      texto: "La naturaleza no tiene prisa, pero todo se logra.",
      autor: "Cleantes",
      categoria: "paciencia"
    },

    // VALOR
    {
      texto: "No expliques tu filosofía. Encárnala.",
      autor: "Epicteto",
      categoria: "valor"
    },
    {
      texto: "El valor no es la ausencia del miedo, sino actuar a pesar de él.",
      autor: "Marco Aurelio",
      categoria: "valor"
    },
    {
      texto: "Primero di lo que serías; y luego haz lo que tengas que hacer.",
      autor: "Epicteto",
      categoria: "valor"
    },
    {
      texto: "La fortuna favorece a los valientes, pero también a los preparados.",
      autor: "Séneca",
      categoria: "valor"
    },
    {
      texto: "El valor verdadero consiste en hacer lo correcto cuando nadie te está mirando.",
      autor: "Crisipo",
      categoria: "valor"
    },
    {
      texto: "No temas la grandeza. Algunos nacen grandes, otros logran la grandeza.",
      autor: "Marco Aurelio",
      categoria: "valor"
    },

    // SERENIDAD
    {
      texto: "No busques que los eventos sucedan como tú quieres, sino desea los eventos como suceden y tu vida transcurrirá serenamente.",
      autor: "Epicteto",
      categoria: "serenidad"
    },
    {
      texto: "Si buscas tranquilidad, haz menos. O más exactamente, haz lo necesario.",
      autor: "Marco Aurelio",
      categoria: "serenidad"
    },
    {
      texto: "La mente que no está perturbada por las vicisitudes de la fortuna, ni deprimida por sus propios fracasos, siempre encuentra la felicidad.",
      autor: "Séneca",
      categoria: "serenidad"
    },
    {
      texto: "La serenidad es la tranquilidad ordenada del alma.",
      autor: "Cleantes",
      categoria: "serenidad"
    },
    {
      texto: "En la calma del alma reside la verdadera fortaleza.",
      autor: "Epicteto",
      categoria: "serenidad"
    },

    // VIRTUD
    {
      texto: "La virtud es la única riqueza verdadera.",
      autor: "Séneca",
      categoria: "virtud"
    },
    {
      texto: "La virtud no puede ser enseñada, debe ser practicada.",
      autor: "Epicteto",
      categoria: "virtud"
    },
    {
      texto: "Un hombre virtuoso no puede ser dañado por nada externo.",
      autor: "Marco Aurelio",
      categoria: "virtud"
    },
    {
      texto: "La virtud es su propia recompensa.",
      autor: "Cleantes",
      categoria: "virtud"
    },
    {
      texto: "Las virtudes se fortalecen con el ejercicio constante.",
      autor: "Crisipo",
      categoria: "virtud"
    },

    // PRESENTE
    {
      texto: "Confina tu atención al presente.",
      autor: "Marco Aurelio",
      categoria: "presente"
    },
    {
      texto: "El presente es lo único que realmente poseemos.",
      autor: "Séneca",
      categoria: "presente"
    },
    {
      texto: "No vivas en el pasado ni sueñes demasiado con el futuro. Concéntrate en el momento presente.",
      autor: "Epicteto",
      categoria: "presente"
    },
    {
      texto: "Cada momento es una nueva oportunidad para comenzar de nuevo.",
      autor: "Marco Aurelio",
      categoria: "presente"
    },
    {
      texto: "El momento presente es el único momento disponible para nosotros.",
      autor: "Cleantes",
      categoria: "presente"
    },

    // ADVERSIDAD
    {
      texto: "No podemos elegir nuestras circunstancias externas, pero siempre podemos elegir cómo respondemos a ellas.",
      autor: "Epicteto",
      categoria: "adversidad"
    },
    {
      texto: "Las dificultades fortalecen la mente, como el trabajo fortalece el cuerpo.",
      autor: "Séneca",
      categoria: "adversidad"
    },
    {
      texto: "Cada obstáculo es una oportunidad para mejorar nuestra condición.",
      autor: "Marco Aurelio",
      categoria: "adversidad"
    },
    {
      texto: "La adversidad es la primera senda hacia la verdad.",
      autor: "Crisipo",
      categoria: "adversidad"
    },
    {
      texto: "En las tormentas de la vida, encontramos nuestra verdadera fortaleza.",
      autor: "Cleantes",
      categoria: "adversidad"
    },

    // AUTOCONTROL
    {
      texto: "Tienes poder sobre tu mente, no sobre los eventos externos. Date cuenta de esto y encontrarás fuerza.",
      autor: "Marco Aurelio",
      categoria: "autocontrol"
    },
    {
      texto: "El sufrimiento no es causado por las cosas, sino por nuestra opinión sobre las cosas.",
      autor: "Epicteto",
      categoria: "autocontrol"
    },
    {
      texto: "Quien controla sus pasiones, controla su destino.",
      autor: "Séneca",
      categoria: "autocontrol"
    },
    {
      texto: "El autocontrol es la base de toda virtud.",
      autor: "Cleantes",
      categoria: "autocontrol"
    },
    {
      texto: "Domínate a ti mismo y dominarás el mundo.",
      autor: "Crisipo",
      categoria: "autocontrol"
    },

    // FELICIDAD
    {
      texto: "Muy poco se necesita para hacer una vida feliz; está dentro de ti, en tu forma de pensar.",
      autor: "Marco Aurelio",
      categoria: "felicidad"
    },
    {
      texto: "La felicidad no depende de lo que tienes, sino de lo que eres.",
      autor: "Epicteto",
      categoria: "felicidad"
    },
    {
      texto: "La felicidad es una virtud, no su recompensa.",
      autor: "Séneca",
      categoria: "felicidad"
    },
    {
      texto: "La verdadera felicidad es disfrutar el presente sin una dependencia ansiosa del futuro.",
      autor: "Séneca",
      categoria: "felicidad"
    },
    {
      texto: "La felicidad es el resultado natural de una vida virtuosa.",
      autor: "Cleantes",
      categoria: "felicidad"
    },

    // MUERTE
    {
      texto: "La muerte no es lo contrario de la vida, sino parte de ella.",
      autor: "Marco Aurelio",
      categoria: "muerte"
    },
    {
      texto: "No es que tengamos poco tiempo, sino que perdemos mucho de él.",
      autor: "Séneca",
      categoria: "muerte"
    },
    {
      texto: "Medita sobre la muerte para apreciar la vida.",
      autor: "Epicteto",
      categoria: "muerte"
    },
    {
      texto: "La muerte es la liberación de todas las preocupaciones.",
      autor: "Cleantes",
      categoria: "muerte"
    },
    {
      texto: "Quien aprende a morir, aprende a vivir.",
      autor: "Séneca",
      categoria: "muerte"
    },

    // JUSTICIA
    {
      texto: "La justicia es la virtud más noble, pues beneficia no solo a quien la practica sino a toda la sociedad.",
      autor: "Marco Aurelio",
      categoria: "justicia"
    },
    {
      texto: "Ser justo es más importante que parecer justo.",
      autor: "Epicteto",
      categoria: "justicia"
    },
    {
      texto: "La injusticia en cualquier lugar es una amenaza a la justicia en todas partes.",
      autor: "Séneca",
      categoria: "justicia"
    },
    {
      texto: "La justicia es la base de todas las virtudes.",
      autor: "Crisipo",
      categoria: "justicia"
    },
    {
      texto: "Un acto justo es más valioso que mil palabras hermosas.",
      autor: "Cleantes",
      categoria: "justicia"
    },

    // AMISTAD
    {
      texto: "La amistad verdadera es un tesoro más valioso que el oro.",
      autor: "Séneca",
      categoria: "amistad"
    },
    {
      texto: "Los amigos son la familia que elegimos.",
      autor: "Epicteto",
      categoria: "amistad"
    },
    {
      texto: "Un amigo fiel es un refugio seguro.",
      autor: "Marco Aurelio",
      categoria: "amistad"
    },
    {
      texto: "La amistad es la única cura para el odio, el único garante de la paz.",
      autor: "Cleantes",
      categoria: "amistad"
    },
    {
      texto: "En la amistad verdadera, las almas se reconocen mutuamente.",
      autor: "Crisipo",
      categoria: "amistad"
    }
  ];

  private obtenerFechaHoy(): string {
    return new Date().toISOString().split('T')[0];
  }

  private obtenerFraseLocalAleatoria(): { texto: string; autor: string } {
    const frase = this.frasesAPISimuladas[Math.floor(Math.random() * this.frasesAPISimuladas.length)];
    return {
      texto: frase.texto,
      autor: frase.autor
    };
  }

  // Método para crear una "API offline" que siempre funciona
  private async simularAPIOffline(categoriaPreferida?: CategoriaFrase): Promise<FraseEstoica> {
    // Simular un pequeño delay para parecer una llamada real de API
    await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));
    
    let frasesDisponibles = this.frasesAPISimuladas;
    
    // Filtrar por categoría si se especifica
    if (categoriaPreferida) {
      const frasesFiltradas = frasesDisponibles.filter(f => f.categoria === categoriaPreferida);
      if (frasesFiltradas.length > 0) {
        frasesDisponibles = frasesFiltradas;
      }
    }
    
    const fraseSeleccionada = frasesDisponibles[Math.floor(Math.random() * frasesDisponibles.length)];
    
    return {
      ...fraseSeleccionada,
      fecha: this.obtenerFechaHoy()
    };
  }

  private obtenerFrasesUsadas(): string[] {
    try {
      const cache = localStorage.getItem(this.CACHE_KEY);
      return cache ? JSON.parse(cache) : [];
    } catch {
      return [];
    }
  }

  private obtenerCategoriaSeleccionada(): CategoriaFrase | null {
    try {
      return localStorage.getItem(this.CATEGORIA_KEY) as CategoriaFrase;
    } catch {
      return null;
    }
  }

  private guardarCategoriaSeleccionada(categoria: CategoriaFrase | null): void {
    try {
      if (categoria) {
        localStorage.setItem(this.CATEGORIA_KEY, categoria);
      } else {
        localStorage.removeItem(this.CATEGORIA_KEY);
      }
    } catch (error) {
      console.warn('No se pudo guardar la categoría:', error);
    }
  }

  private guardarFraseUsada(texto: string): void {
    try {
      const frasesUsadas = this.obtenerFrasesUsadas();
      frasesUsadas.push(texto);
      
      // Si hemos usado todas las frases, reiniciar el cache
      if (frasesUsadas.length >= this.frasesLocal.length) {
        localStorage.setItem(this.CACHE_KEY, JSON.stringify([]));
      } else {
        localStorage.setItem(this.CACHE_KEY, JSON.stringify(frasesUsadas));
      }
    } catch (error) {
      console.warn('No se pudo guardar la frase en el cache:', error);
    }
  }

  private async obtenerFraseDeAPI(categoriaPreferida?: CategoriaFrase): Promise<FraseEstoica | null> {
    // Intentar con múltiples APIs
    for (const api of this.APIS) {
      try {
        // Manejo especial para la "LocalAPI" simulada
        if (api.url === 'local') {
          console.log(`🏠 Usando API offline simulada: ${api.nombre}`);
          return await this.simularAPIOffline(categoriaPreferida);
        }

        // Configurar timeout para evitar esperas largas
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 segundos timeout para APIs lentas

        const fetchOptions: RequestInit = {
          signal: controller.signal,
          mode: 'cors',
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0 (compatible; FrasesApp/1.0)',
          }
        };

        // Para APIs que requieren proxy, agregar headers adicionales
        if (api.requiresProxy) {
          fetchOptions.headers = {
            ...fetchOptions.headers,
            'X-Requested-With': 'XMLHttpRequest',
          };
        }

        const response = await fetch(api.url, fetchOptions);
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          console.warn(`API ${api.nombre} respondió con status ${response.status}`);
          continue; // Intentar con la siguiente API
        }

        const data = await response.json();
        const fraseData = api.procesarRespuesta(data);
        
        if (fraseData.texto && fraseData.autor) {
          console.log(`✅ Frase obtenida exitosamente de ${api.nombre}`);
          localStorage.setItem('ultimo_intento_api', JSON.stringify({
            fecha: new Date().toISOString(),
            api: api.nombre,
            exito: true
          }));
          return {
            texto: fraseData.texto,
            autor: fraseData.autor,
            fecha: this.obtenerFechaHoy(),
            // Usar la categoría preferida si se especifica, sino 'sabiduria' por defecto
            categoria: categoriaPreferida || 'sabiduria'
          };
        }
      } catch (error) {
        if (error instanceof Error) {
          if (error.name === 'AbortError') {
            console.warn(`⏱️ Timeout con API ${api.nombre} (${8}s)`);
          } else if (error.message.includes('CORS')) {
            console.warn(`🚫 Error CORS con API ${api.nombre}`);
          } else if (error.message.includes('ERR_CERT_DATE_INVALID')) {
            console.warn(`🔒 Certificado SSL expirado en API ${api.nombre}`);
          } else if (error.message.includes('ERR_CERT')) {
            console.warn(`🔒 Error de certificado SSL en API ${api.nombre}`);
          } else if (error.message.includes('ERR_SSL')) {
            console.warn(`🔐 Error SSL/TLS en API ${api.nombre}`);
          } else if (error.message.includes('Failed to fetch')) {
            console.warn(`🌐 Error de red con API ${api.nombre} - Servidor no disponible`);
          } else if (error.message.includes('NetworkError')) {
            console.warn(`📡 Error de conectividad con API ${api.nombre}`);
          } else {
            console.warn(`❌ Error inesperado con API ${api.nombre}:`, error.message);
          }
        } else {
          console.warn(`❓ Error desconocido con API ${api.nombre}:`, error);
        }
        continue; // Intentar con la siguiente API
      }
    }
    
    console.warn('⚠️ Todas las APIs fallaron, usando frases locales');
    return null;
  }

  private seleccionarFraseLocal(categoria?: CategoriaFrase): { frase: FraseEstoica; categoriaAgotada: boolean } {
    const frasesUsadas = this.obtenerFrasesUsadas();
    let frasesBase = this.frasesLocal;

    // Filtrar por categoría si se especifica
    if (categoria) {
      frasesBase = this.frasesLocal.filter(frase => frase.categoria === categoria);
    }

    const frasesDisponibles = frasesBase.filter(
      frase => !frasesUsadas.includes(frase.texto)
    );

    // Verificar si se agotaron las frases de la categoría específica
    const categoriaAgotada = categoria && frasesDisponibles.length === 0 && frasesBase.length > 0;

    // Si no hay frases disponibles en la categoría, usar todas las frases de la categoría
    const frases = frasesDisponibles.length > 0 ? frasesDisponibles : frasesBase;
    
    // Si no hay frases en la categoría, usar todas las frases
    const frasesFinales = frases.length > 0 ? frases : this.frasesLocal;
    
    if (frasesDisponibles.length === 0 && frasesBase.length > 0) {
      // Solo reiniciar cache para esta categoría específica
      const frasesUsadasOtrasCategorias = this.obtenerFrasesUsadas().filter(texto => {
        const frase = this.frasesLocal.find(f => f.texto === texto);
        return frase && frase.categoria !== categoria;
      });
      localStorage.setItem(this.CACHE_KEY, JSON.stringify(frasesUsadasOtrasCategorias));
    }

    const indiceAleatorio = Math.floor(Math.random() * frasesFinales.length);
    const fraseSeleccionada = frasesFinales[indiceAleatorio];

    return {
      frase: {
        ...fraseSeleccionada,
        fecha: this.obtenerFechaHoy()
      },
      categoriaAgotada: categoriaAgotada || false
    };
  }

  async obtenerFraseDelDia(): Promise<FraseEstoica> {
    const fechaHoy = this.obtenerFechaHoy();
    const ultimaFecha = localStorage.getItem(this.FECHA_KEY);

    // Si ya obtuvimos una frase hoy, la devolvemos
    if (ultimaFecha === fechaHoy) {
      const fraseGuardada = localStorage.getItem('frase_del_dia');
      if (fraseGuardada) {
        try {
          return JSON.parse(fraseGuardada);
        } catch {
          // Si hay error parseando, continuamos para obtener una nueva
        }
      }
    }

    const categoriaSeleccionada = this.obtenerCategoriaSeleccionada();

    // Intentar obtener frase de API o local
    let frase: FraseEstoica | null = null;
    
    if (!categoriaSeleccionada) {
      // Sin categoría específica, intentar API primero
      frase = await this.obtenerFraseDeAPI();
    } else {
      // Con categoría específica, verificar si está agotada
      const resultado = this.seleccionarFraseLocal(categoriaSeleccionada);
      if (resultado.categoriaAgotada) {
        // Si la categoría está agotada, intentar API con esa categoría
        frase = await this.obtenerFraseDeAPI(categoriaSeleccionada);
      }
      if (!frase) {
        frase = resultado.frase;
      }
    }
    
    if (!frase) {
      // Fallback final a frases locales
      const resultado = this.seleccionarFraseLocal(categoriaSeleccionada || undefined);
      frase = resultado.frase;
    }

    // Guardar la frase del día y marcar como usada
    this.guardarFraseUsada(frase.texto);
    localStorage.setItem('frase_del_dia', JSON.stringify(frase));
    localStorage.setItem(this.FECHA_KEY, fechaHoy);

    return frase;
  }

  // Método para obtener una frase aleatoria sin restricciones de fecha
  async obtenerFraseAleatoria(): Promise<FraseEstoica> {
    const categoriaSeleccionada = this.obtenerCategoriaSeleccionada();
    
    // Probabilidad del 30% de intentar API para más variedad
    const usarAPI = Math.random() < 0.3;
    
    let frase: FraseEstoica | null = null;
    
    if (usarAPI) {
      // Intentar obtener frase de API
      frase = await this.obtenerFraseDeAPI(categoriaSeleccionada || undefined);
    }
    
    if (!frase) {
      // Si no se obtuvo de API o no se intentó, usar frases locales
      const resultado = this.seleccionarFraseLocal(categoriaSeleccionada || undefined);
      
      // Si la categoría está agotada, intentar API como segunda opción
      if (resultado.categoriaAgotada && !usarAPI) {
        frase = await this.obtenerFraseDeAPI(categoriaSeleccionada || undefined);
      }
      
      if (!frase) {
        frase = resultado.frase;
      }
    }
    
    return frase;
  }

  // Método para obtener una frase de una categoría específica
  async obtenerFrasePorCategoria(categoria: CategoriaFrase): Promise<FraseEstoica> {
    const resultado = this.seleccionarFraseLocal(categoria);
    
    // Si la categoría está agotada, intentar API
    if (resultado.categoriaAgotada) {
      const fraseAPI = await this.obtenerFraseDeAPI(categoria);
      if (fraseAPI) {
        return fraseAPI;
      }
    }
    
    return resultado.frase;
  }

  // Método para establecer la categoría preferida del usuario
  establecerCategoria(categoria: CategoriaFrase | null): void {
    this.guardarCategoriaSeleccionada(categoria);
    // Limpiar la frase del día para que se genere una nueva con la categoría
    localStorage.removeItem('frase_del_dia');
    localStorage.removeItem(this.FECHA_KEY);
  }

  // Método para obtener la categoría actual
  obtenerCategoriaActual(): CategoriaFrase | null {
    return this.obtenerCategoriaSeleccionada();
  }

  // Método para obtener todas las categorías disponibles
  obtenerCategorias(): Array<{valor: CategoriaFrase, nombre: string, descripcion: string, emoji: string}> {
    return [
      { valor: 'sabiduria', nombre: 'Sabiduría', descripcion: 'Frases sobre conocimiento y discernimiento', emoji: '🧠' },
      { valor: 'paciencia', nombre: 'Paciencia', descripcion: 'Frases sobre templanza y perseverancia', emoji: '⏳' },
      { valor: 'valor', nombre: 'Valor', descripcion: 'Frases sobre coraje y determinación', emoji: '💪' },
      { valor: 'serenidad', nombre: 'Serenidad', descripcion: 'Frases sobre paz interior y tranquilidad', emoji: '🧘' },
      { valor: 'virtud', nombre: 'Virtud', descripcion: 'Frases sobre excelencia moral y ética', emoji: '✨' },
      { valor: 'presente', nombre: 'Presente', descripcion: 'Frases sobre mindfulness y el momento actual', emoji: '🌅' },
      { valor: 'adversidad', nombre: 'Adversidad', descripcion: 'Frases sobre superar dificultades', emoji: '⛰️' },
      { valor: 'autocontrol', nombre: 'Autocontrol', descripcion: 'Frases sobre dominio personal y disciplina', emoji: '🎯' },
      { valor: 'felicidad', nombre: 'Felicidad', descripcion: 'Frases sobre bienestar y satisfacción', emoji: '😊' },
      { valor: 'muerte', nombre: 'Mortalidad', descripcion: 'Frases sobre la vida y la muerte', emoji: '🍃' },
      { valor: 'justicia', nombre: 'Justicia', descripcion: 'Frases sobre equidad y rectitud', emoji: '⚖️' },
      { valor: 'amistad', nombre: 'Amistad', descripcion: 'Frases sobre relaciones y compañerismo', emoji: '🤝' }
    ];
  }

  // Método para obtener estadísticas
  obtenerEstadisticas(): {
    totalFrases: number,
    frasesPorCategoria: Record<string, number>,
    frasesUsadas: number,
    autores: string[]
  } {
    const frasesUsadas = this.obtenerFrasesUsadas();
    const frasesPorCategoria: Record<string, number> = {};
    const autores = new Set<string>();

    this.frasesLocal.forEach(frase => {
      if (frase.categoria) {
        frasesPorCategoria[frase.categoria] = (frasesPorCategoria[frase.categoria] || 0) + 1;
      }
      autores.add(frase.autor);
    });

    return {
      totalFrases: this.frasesLocal.length,
      frasesPorCategoria,
      frasesUsadas: frasesUsadas.length,
      autores: Array.from(autores)
    };
  }

  // Método para verificar si una frase viene de API (heurística simple)
  esFraseDeAPI(frase: FraseEstoica): boolean {
    // Verificar si la frase NO está en nuestras frases locales principales
    const esLocal = this.frasesLocal.some(fraseLocal => 
      fraseLocal.texto === frase.texto && fraseLocal.autor === frase.autor
    );
    
    // Si no es local, se considera de API (real o simulada)
    if (!esLocal) {
      return true; // Cualquier frase que no sea de las locales principales se considera "API"
    }
    
    return false;
  }

  // Método para obtener estadísticas de APIs
  obtenerEstadisticasAPI(): {
    apisDisponibles: number,
    frasesAPISimuladas: number,
    ultimoIntento: string | null
  } {
    return {
      apisDisponibles: this.APIS.length,
      frasesAPISimuladas: this.frasesAPISimuladas.length,
      ultimoIntento: localStorage.getItem('ultimo_intento_api')
    };
  }

  // Método para resetear el cache manualmente
  resetearCache(): void {
    localStorage.removeItem(this.CACHE_KEY);
    localStorage.removeItem(this.FECHA_KEY);
    localStorage.removeItem('frase_del_dia');
    localStorage.removeItem(this.CATEGORIA_KEY);
    localStorage.removeItem('ultimo_intento_api');
  }
}

export const frasesService = new FrasesEstoicasService();
export type { FraseEstoica, CategoriaFrase };
