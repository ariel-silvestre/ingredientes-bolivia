import { IngredientNormalizer, ingredientesDB } from '../src/index';
import type { IngredientesDatabase } from '../src/index';

const ingredientesData = ingredientesDB as unknown as IngredientesDatabase; 

describe('Integration Tests', () => {
  beforeAll(() => {
    IngredientNormalizer.initialize(ingredientesData);
  });

  test('flujo completo de normalización', () => {
    // 1. Usuario ingresa ingredientes con variantes
    const ingredientesUsuario = ['ch\'uqi', 'lokoto', 'sara'];
    
    // 2. Normalizar
    const normalizados = IngredientNormalizer.normalizarMultiples(ingredientesUsuario);
    
    // 3. Verificar que encontró los principales
    expect(normalizados).toContain('papa');
    expect(normalizados).toContain('ají');
    expect(normalizados).toContain('maíz');
  });

  test('búsqueda de recetas por ingredientes disponibles', () => {
    // Simular ingredientes que un usuario tiene en casa
    const ingredientesDisponibles = ['papa', 'cebolla', 'ají'];
    
    // Normalizar cada uno
    const resultados = ingredientesDisponibles.map(ing => ({
      original: ing,
      normalizado: IngredientNormalizer.obtenerPrincipal(ing),
      info: IngredientNormalizer.obtenerInfo(ing)
    }));
    
    // Verificar que todos tienen información
    expect(resultados.every(r => r.info !== null)).toBe(true);
  });

  test('filtrado por región', () => {
    const ingrediente = 'papa';
    const region = 'La Paz';
    
    // Obtener variantes de La Paz
    const variantesLP = IngredientNormalizer.obtenerVariantesRegionales(
      ingrediente,
      region
    );
    
    // Verificar que incluye variantes quechua/aymara
    expect(variantesLP.length).toBeGreaterThan(0);
  });

  test('categorización de ingredientes', () => {
    // Obtener todas las categorías
    const categorias = IngredientNormalizer.obtenerCategorias();
    
    // Para cada categoría, obtener ingredientes
    const ingredientesPorCategoria = categorias.map(cat => ({
      categoria: cat,
      ingredientes: IngredientNormalizer.buscarPorCategoria(cat)
    }));
    
    // Verificar que todas tienen al menos un ingrediente
    expect(ingredientesPorCategoria.every(c => c.ingredientes.length > 0)).toBe(true);
  });
});