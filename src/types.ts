export interface IngredienteData {
  id: string;
  nombre_principal: string;
  categoria: string;
  sinonimos: string[];
  variantes_regionales: Record<string, string[]>;
  descripcion?: string;
  nombres_cientificos?: string[];
}

export interface IngredientesDatabase {
  version: string;
  ultima_actualizacion: string;
  total_ingredientes: number;
  ingredientes: IngredienteData[];
}

export interface NormalizacionResultado {
  original: string;
  principal: string;
  sinonimos: string[];
  confianza: number;
  variantesRegionales?: Record<string, string[]>;
}

export interface BusquedaOptions {
  threshold?: number;
  limite?: number;
  incluirRegionales?: boolean;
  region?: string;
}

export type Categoria =
 | 'Tubérculos'
 | 'Verduras'
 | 'Frutas'
 | 'Granos'
 | 'Legumbres'
 | 'Proteínas'
 | 'Lácteos'
 | 'Condimentos';
