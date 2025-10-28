import { IngredientNormalizer } from '../src/normalizer';
import ingredientesData from '../data/ingredientes.json';
import type { IngredientesDatabase } from '../src/types';

const ingredientesDB = ingredientesData as unknown as IngredientesDatabase;

describe('IngredientNormalizer', () => {
  beforeAll(() => {
    IngredientNormalizer.initialize(ingredientesDB);
  });

  describe('initialize', () => {
    test('debe inicializar correctamente', () => {
      expect(() => IngredientNormalizer.obtenerTodos()).not.toThrow();
      expect(IngredientNormalizer.obtenerTodos().length).toBeGreaterThan(0);
    });

    test('debe cargar todos los ingredientes de la base de datos', () => {
      const ingredientes = IngredientNormalizer.obtenerTodos();
      expect(ingredientes.length).toBe(ingredientesDB.total_ingredientes);
    });
  });

  describe('normalizar', () => {
    test('debe normalizar sinónimos exactos', () => {
      const resultado = IngredientNormalizer.normalizar("ch'uqi");
      expect(resultado).toContain('papa');
      expect(resultado).toContain('patata');
      expect(resultado).toContain("ch'uqi");
    });

    test('debe manejar búsqueda fuzzy con typos', () => {
      const resultado = IngredientNormalizer.normalizar('lokoto');
      expect(resultado[0]).toBe('ají');
    });

    test('debe retornar el ingrediente original si no encuentra coincidencias', () => {
      const resultado = IngredientNormalizer.normalizar('ingredientenoexiste');
      expect(resultado[0]).toBe('ingredientenoexiste');
      expect(resultado.length).toBe(1);
    });

    test('debe ser case-insensitive', () => {
      const resultado1 = IngredientNormalizer.normalizar('PAPA');
      const resultado2 = IngredientNormalizer.normalizar('papa');
      expect(resultado1).toEqual(resultado2);
    });

    test('debe eliminar espacios en blanco', () => {
      const resultado = IngredientNormalizer.normalizar('  papa  ');
      expect(resultado).toContain('papa');
    });
  });

  describe('normalizarMultiples', () => {
    test('debe normalizar múltiples ingredientes', () => {
      const resultado = IngredientNormalizer.normalizarMultiples([
        'papa',
        "ch'uqi",
        'patata'
      ]);
      expect(resultado).toContain('papa');
      expect(resultado.length).toBeGreaterThan(3);
    });

    test('debe eliminar duplicados', () => {
      const resultado = IngredientNormalizer.normalizarMultiples([
        'papa',
        'papa',
        'PAPA'
      ]);
      const papas = resultado.filter(r => r === 'papa');
      expect(papas.length).toBe(1);
    });

    test('debe manejar array vacío', () => {
      const resultado = IngredientNormalizer.normalizarMultiples([]);
      expect(resultado).toEqual([]);
    });
  });

  describe('obtenerPrincipal', () => {
    test('debe retornar nombre principal desde sinónimo', () => {
      expect(IngredientNormalizer.obtenerPrincipal('locoto')).toBe('ají');
      expect(IngredientNormalizer.obtenerPrincipal("ch'uqi")).toBe('papa');
    });

    test('debe manejar fuzzy search', () => {
      expect(IngredientNormalizer.obtenerPrincipal('lokoto')).toBe('ají');
    });

    test('debe retornar el mismo ingrediente si es principal', () => {
      expect(IngredientNormalizer.obtenerPrincipal('papa')).toBe('papa');
    });

    test('debe ser case-insensitive', () => {
      expect(IngredientNormalizer.obtenerPrincipal('PAPA')).toBe('papa');
    });
  });

  describe('sonSinonimos', () => {
    test('debe identificar sinónimos correctamente', () => {
      expect(IngredientNormalizer.sonSinonimos('papa', "ch'uqi")).toBe(true);
      expect(IngredientNormalizer.sonSinonimos('locoto', 'ají')).toBe(true);
    });

    test('debe identificar NO sinónimos', () => {
      expect(IngredientNormalizer.sonSinonimos('papa', 'tomate')).toBe(false);
      expect(IngredientNormalizer.sonSinonimos('ají', 'quinua')).toBe(false);
    });

    test('debe comparar un ingrediente consigo mismo', () => {
      expect(IngredientNormalizer.sonSinonimos('papa', 'papa')).toBe(true);
    });
  });

  describe('obtenerInfo', () => {
    test('debe retornar información completa del ingrediente', () => {
      const info = IngredientNormalizer.obtenerInfo('papa');
      
      expect(info).not.toBeNull();
      expect(info?.nombre_principal).toBe('papa');
      expect(info?.categoria).toBe('Tubérculos');
      expect(info?.sinonimos).toContain('patata');
      expect(info?.variantes_regionales).toBeDefined();
    });

    test('debe funcionar con sinónimos', () => {
      const info1 = IngredientNormalizer.obtenerInfo('papa');
      const info2 = IngredientNormalizer.obtenerInfo("ch'uqi");
      
      expect(info1).toEqual(info2);
    });

    test('debe retornar null si no existe', () => {
      const info = IngredientNormalizer.obtenerInfo('noexiste');
      expect(info).toBeNull();
    });
  });

  describe('obtenerVariantesRegionales', () => {
    test('debe retornar variantes de una región específica', () => {
      const variantes = IngredientNormalizer.obtenerVariantesRegionales(
        'papa',
        'La Paz'
      );
      
      expect(variantes).toContain("ch'uqi");
      expect(variantes.length).toBeGreaterThan(0);
    });

    test('debe retornar todas las variantes si no se especifica región', () => {
      const variantes = IngredientNormalizer.obtenerVariantesRegionales('papa');
      expect(variantes.length).toBeGreaterThan(0);
    });

    test('debe manejar ingrediente sin variantes regionales', () => {
      const variantes = IngredientNormalizer.obtenerVariantesRegionales('tomate');
      expect(Array.isArray(variantes)).toBe(true);
    });
  });

  describe('buscarPorCategoria', () => {
    test('debe encontrar ingredientes por categoría', () => {
      const tuberculos = IngredientNormalizer.buscarPorCategoria('Tubérculos');
      
      expect(tuberculos.length).toBeGreaterThan(0);
      expect(tuberculos.some(i => i.nombre_principal === 'papa')).toBe(true);
      expect(tuberculos.every(i => i.categoria === 'Tubérculos')).toBe(true);
    });

    test('debe ser case-insensitive', () => {
      const tuberculos1 = IngredientNormalizer.buscarPorCategoria('tubérculos');
      const tuberculos2 = IngredientNormalizer.buscarPorCategoria('TUBÉRCULOS');
      
      expect(tuberculos1.length).toBe(tuberculos2.length);
    });

    test('debe retornar array vacío para categoría inexistente', () => {
      const resultado = IngredientNormalizer.buscarPorCategoria('NoExiste');
      expect(resultado).toEqual([]);
    });
  });

  describe('obtenerCategorias', () => {
    test('debe retornar todas las categorías', () => {
      const categorias = IngredientNormalizer.obtenerCategorias();
      
      expect(categorias.length).toBeGreaterThan(0);
      expect(categorias).toContain('Tubérculos');
      expect(categorias).toContain('Condimentos');
    });

    test('debe retornar categorías ordenadas alfabéticamente', () => {
      const categorias = IngredientNormalizer.obtenerCategorias();
      const sorted = [...categorias].sort();
      
      expect(categorias).toEqual(sorted);
    });

    test('no debe tener duplicados', () => {
      const categorias = IngredientNormalizer.obtenerCategorias();
      const unicos = [...new Set(categorias)];
      
      expect(categorias.length).toBe(unicos.length);
    });
  });

  describe('obtenerTodos', () => {
    test('debe retornar todos los ingredientes', () => {
      const todos = IngredientNormalizer.obtenerTodos();
      
      expect(todos.length).toBe(ingredientesDB.total_ingredientes);
      expect(todos.every(i => i.nombre_principal)).toBe(true);
    });
  });

  describe('buscarPorTexto', () => {
    test('debe encontrar ingredientes por búsqueda de texto', () => {
      const resultados = IngredientNormalizer.buscarPorTexto('ají', {
        limite: 5
      });
      
      expect(resultados.length).toBeGreaterThan(0);
      expect(resultados[0].nombre_principal).toBe('ají');
    });

    test('debe respetar el límite', () => {
      const resultados = IngredientNormalizer.buscarPorTexto('a', {
        limite: 3
      });
      
      expect(resultados.length).toBeLessThanOrEqual(3);
    });

    test('debe usar threshold personalizado', () => {
      const resultadosEstrictos = IngredientNormalizer.buscarPorTexto('xyz', {
        threshold: 0.1
      });
      
      expect(Array.isArray(resultadosEstrictos)).toBe(true);
    });

    test('debe manejar búsqueda vacía', () => {
      const resultados = IngredientNormalizer.buscarPorTexto('', {
        limite: 5
      });
      
      expect(resultados.length).toBeLessThanOrEqual(5);
    });
  });

  describe('normalizarConMetadata', () => {
    test('debe retornar metadata completa para coincidencia exacta', () => {
      const resultado = IngredientNormalizer.normalizarConMetadata("ch'uqi");
      
      expect(resultado.original).toBe("ch'uqi");
      expect(resultado.principal).toBe('papa');
      expect(resultado.confianza).toBe(1.0);
      expect(resultado.sinonimos.length).toBeGreaterThan(0);
      expect(resultado.variantesRegionales).toBeDefined();
    });

    test('debe indicar menor confianza en fuzzy match', () => {
      const resultado = IngredientNormalizer.normalizarConMetadata('lokoto');
      
      expect(resultado.confianza).toBeGreaterThan(0);
      expect(resultado.confianza).toBeLessThan(1.0);
    });

    test('debe indicar confianza 0 si no encuentra', () => {
      const resultado = IngredientNormalizer.normalizarConMetadata('noexiste');
      
      expect(resultado.confianza).toBe(0);
      expect(resultado.principal).toBe('noexiste');
    });
  });

  describe('obtenerEstadisticas', () => {
    test('debe retornar estadísticas correctas', () => {
      const stats = IngredientNormalizer.obtenerEstadisticas();
      
      expect(stats.totalIngredientes).toBeGreaterThan(0);
      expect(stats.totalSinonimos).toBeGreaterThan(0);
      expect(stats.categorias.length).toBeGreaterThan(0);
      expect(stats.version).toBe(ingredientesDB.version);
    });

    test('cantidad por categoría debe sumar al total', () => {
      const stats = IngredientNormalizer.obtenerEstadisticas();
      const sumaCategorias = stats.porCategoria.reduce(
        (sum, cat) => sum + cat.cantidad,
        0
      );
      
      expect(sumaCategorias).toBe(stats.totalIngredientes);
    });
  });

  describe('getVersion', () => {
    test('debe retornar la versión correcta', () => {
      const version = IngredientNormalizer.getVersion();
      
      expect(version).toBe(ingredientesDB.version);
      expect(typeof version).toBe('string');
    });
  });
});