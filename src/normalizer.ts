import Fuse from 'fuse.js';
import type {
  IngredienteData,
  IngredientesDatabase,
  NormalizacionResultado,
  BusquedaOptions
} from './types';

export class IngredientNormalizer {
  private static instance: IngredientNormalizer | null = null;
  private ingredientesMap: Map<string, IngredienteData>;
  private sinonimosMap: Map<string, string>;
  private fuseSearch: Fuse<{ termino: string; principal: string }>;
  private readonly version: string;

  private constructor(ingredientesDb: IngredientesDatabase) {
    this.version = ingredientesDb.version;
    this.ingredientesMap = new Map();
    this.sinonimosMap = new Map();

    // Construir mapas
    ingredientesDb.ingredientes.forEach(ingrediente => {
      this.ingredientesMap.set(ingrediente.nombre_principal, ingrediente);
      this.sinonimosMap.set(ingrediente.nombre_principal, ingrediente.nombre_principal);

      ingrediente.sinonimos.forEach(sinonimo => {
        this.sinonimosMap.set(
          sinonimo.toLowerCase(),
          ingrediente.nombre_principal
        );
      });

      Object.values(ingrediente.variantes_regionales).forEach(variantes => {
        variantes.forEach(variante => {
          this.sinonimosMap.set(
            variante.toLowerCase(),
            ingrediente.nombre_principal
          );
        });
      });
    });

    // Configurar Fuse.js
    const terminosBusqueda = Array.from(this.sinonimosMap.entries()).map(
      ([termino, principal]) => ({ termino, principal })
    );

    this.fuseSearch = new Fuse(terminosBusqueda, {
      keys: ['termino'],
      threshold: 0.3,
      distance: 100,
      ignoreLocation: true,
      includeScore: true
    });
  }

  static initialize(ingredientesDb: IngredientesDatabase): void {
    if (!IngredientNormalizer.instance) {
      IngredientNormalizer.instance = new IngredientNormalizer(ingredientesDb);
    }
  }

  private static getInstance(): IngredientNormalizer {
    if (!IngredientNormalizer.instance) {
      throw new Error('IngredientNormalizer no inicializado');
    }
    return IngredientNormalizer.instance;
  }

  /**
   * Normalize un ingrediente (version mejorada con metadata)
   */
  static normalizarConMetadata(ingrediente: string): NormalizacionResultado {
    const instance = this.getInstance();
    const limpio = ingrediente.toLowerCase().trim();


    // Busqueda exacta
    const principal = instance.sinonimosMap.get(limpio);
    if (principal) {
      const data = instance.ingredientesMap.get(principal);
      if (data) {
        return {
          original: ingrediente,
          principal,
          sinonimos: data.sinonimos,
          confianza: 1.0,
          variantesRegionales: data.variantes_regionales
        };
      }
    }

    // Búsqueda fuzzy
    const resultadosFuzzy = instance.fuseSearch.search(limpio);
    if (resultadosFuzzy.length > 0) {
      const resultado = resultadosFuzzy[0];
      const principalFuzzy = resultado.item.principal;
      const data = instance.ingredientesMap.get(principalFuzzy);

      if (data) {
        return {
          original: ingrediente,
          principal: principalFuzzy,
          sinonimos: data.sinonimos,
          confianza: 1 - (resultado.score || 0),
          variantesRegionales: data.variantes_regionales
        };
      }
    }

    // No encontrado
    return {
      original: ingrediente,
      principal: limpio,
      sinonimos: [],
      confianza: 0
    };
  }

  /**
   * Normalización simple (retrocompatibilidad)
   */
  static normalizar(ingrediente: string): string[] {
    const resultado = this.normalizarConMetadata(ingrediente);
    return [resultado.principal, ...resultado.sinonimos];
  }

  static normalizarMultiples(ingredientes: string[]): string[] {
    const normalizados = new Set<string>();
    ingredientes.forEach(ingrediente => {
      const variantes = this.normalizar(ingrediente);
      variantes.forEach(variante => normalizados.add(variante));
    });
    return Array.from(normalizados);
  }

  static obtenerPrincipal(ingrediente: string): string {
    const resultado = this.normalizarConMetadata(ingrediente);
    return resultado.principal;
  }

  static sonSinonimos(ingrediente1: string, ingrediente2: string): boolean {
    const principal1 = this.obtenerPrincipal(ingrediente1);
    const principal2 = this.obtenerPrincipal(ingrediente2);
    return principal1 === principal2;
  }

  static obtenerInfo(ingrediente: string): IngredienteData | null {
    const instance = this.getInstance();
    const principal = this.obtenerPrincipal(ingrediente);
    return instance.ingredientesMap.get(principal) || null;
  }

  static obtenerVariantesRegionales(
    ingrediente: string,
    region?: string
  ): string[] {
    const info = this.obtenerInfo(ingrediente);
    if (!info) return [ingrediente];

    if (region && info.variantes_regionales[region]) {
      return info.variantes_regionales[region];
    }

    return Object.values(info.variantes_regionales).flat();
  }

  static buscarPorCategoria(categoria: string): IngredienteData[] {
    const instance = this.getInstance();
    return Array.from(instance.ingredientesMap.values()).filter(
      ingrediente => ingrediente.categoria.toLowerCase() === categoria.toLowerCase()
    );
  }

  static obtenerCategorias(): string[] {
    const instance = this.getInstance();
    const categorias = new Set<string>();
    instance.ingredientesMap.forEach(
      ingrediente => categorias.add(ingrediente.categoria)
    );
    return Array.from(categorias).sort();
  }

  static obtenerTodos(): IngredienteData[] {
    const instance = this.getInstance();
    return Array.from(instance.ingredientesMap.values());
  }

  static buscarPorTexto(
    texto: string,
    options: BusquedaOptions = {}
  ): IngredienteData[] {
    const instance = this.getInstance();
    const { limite = 10, threshold = 0.3 } = options;

    // Configurar búsqueda con threshold personalizado
    const fuse = new Fuse(
      Array.from(instance.sinonimosMap.entries()).map(
        ([termino, principal]) => ({ termino, principal })
      ),
      {
        keys: ['termino'],
        threshold,
        includeScore: true
      }
    );

    const resultados = fuse.search(texto, { limit: limite * 2 });

    const ingredientesUnicos = new Set<string>();
    const resultadosFinales: IngredienteData[] = [];

    resultados.forEach(resultado => {
      const principal = resultado.item.principal;
      if (
        !ingredientesUnicos.has(principal) &&
        resultadosFinales.length < limite
      ) {
        ingredientesUnicos.add(principal);
        const info = instance.ingredientesMap.get(principal);
        if (info) {
          resultadosFinales.push(info);
        }
      }
    });

    return resultadosFinales;
  }

  /**
   * Obtiene la version del paquete
   */
  static getVersion(): string {
    const instance = this.getInstance();
    return instance.version;
  }

  /**
   * Estadisticas del normalizador
   */
  static obtenerEstadisticas() {
    const instance = this.getInstance();
    const ingredientes = Array.from(instance.ingredientesMap.values());

    return {
      totalIngredientes: ingredientes.length,
      totalSinonimos: instance.sinonimosMap.size,
      categorias: this.obtenerCategorias(),
      porCategoria: this.obtenerCategorias().map(cat => ({
        categoria: cat,
        cantidad: this.buscarPorCategoria(cat).length
      })),
      version: instance.version
    };
  }

  /**
   * Reset la instancia
   */
  static reset(): void {
    IngredientNormalizer.instance = null;
  }
}