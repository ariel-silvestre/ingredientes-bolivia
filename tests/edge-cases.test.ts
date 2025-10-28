import { IngredientNormalizer } from '../src/normalizer';
import ingredientesData from '../data/ingredientes.json';
import type { IngredientesDatabase } from '../src/types';

const ingredientesDB = ingredientesData as unknown as IngredientesDatabase;

describe('Edge Cases', () => {
  beforeAll(() => {
    IngredientNormalizer.initialize(ingredientesDB);
  });

  describe('Entrada inválida', () => {
    test('debe manejar string vacío', () => {
      const resultado = IngredientNormalizer.normalizar('');
      expect(resultado).toEqual(['']);
    });

    test('debe manejar solo espacios', () => {
      const resultado = IngredientNormalizer.normalizar('   ');
      expect(resultado.length).toBeGreaterThan(0);
    });

    test('debe manejar caracteres especiales', () => {
      const resultado = IngredientNormalizer.normalizar('!@#$%');
      expect(Array.isArray(resultado)).toBe(true);
    });

    test('debe manejar números', () => {
      const resultado = IngredientNormalizer.normalizar('12345');
      expect(Array.isArray(resultado)).toBe(true);
    });
  });

  describe('Unicode y caracteres especiales', () => {
    test('debe manejar caracteres acentuados', () => {
      const resultado = IngredientNormalizer.normalizar('maíz');
      expect(resultado).toContain('maíz');
    });

    test('debe manejar apóstrofes', () => {
      const resultado = IngredientNormalizer.normalizar("ch'uqi");
      expect(resultado).toContain('papa');
    });
  });

  describe('Performance', () => {
    test('debe normalizar 100 ingredientes en menos de 1 segundo', () => {
      const start = Date.now();
      
      for (let i = 0; i < 100; i++) {
        IngredientNormalizer.normalizar('papa');
      }
      
      const elapsed = Date.now() - start;
      expect(elapsed).toBeLessThan(1000);
    });

    test('debe buscar por texto rápidamente', () => {
      const start = Date.now();
      
      IngredientNormalizer.buscarPorTexto('a', { limite: 10 });
      
      const elapsed = Date.now() - start;
      expect(elapsed).toBeLessThan(100);
    });
  });

  describe('Consistencia', () => {
    test('normalizar debe ser idempotente', () => {
      const resultado1 = IngredientNormalizer.normalizar('papa');
      const resultado2 = IngredientNormalizer.normalizar('papa');
      
      expect(resultado1).toEqual(resultado2);
    });

    test('sonSinonimos debe ser simétrico', () => {
      const son1 = IngredientNormalizer.sonSinonimos('papa', "ch'uqi");
      const son2 = IngredientNormalizer.sonSinonimos("ch'uqi", 'papa');
      
      expect(son1).toBe(son2);
    });
  });
});