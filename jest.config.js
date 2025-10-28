/** @type {import('jest').Config} */
module.exports = {
  // Preset para TypeScript
  preset: 'ts-jest',
  
  // Entorno de ejecución
  testEnvironment: 'node',
  
  // Dónde buscar tests
  roots: ['<rootDir>/tests'],
  
  // Patrones de archivos de test
  testMatch: [
    '**/__tests__/**/*.ts',
    '**/?(*.)+(spec|test).ts'
  ],
  
  // Transformación de archivos
  transform: {
    '^.+\\.ts$': 'ts-jest'
  },
  
  // Extensiones de archivos
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  
  // Cobertura de código
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/index.ts' // Archivo de barril, no necesita coverage
  ],
  
  // Directorio de cobertura
  coverageDirectory: 'coverage',
  
  // Reportes de cobertura
  coverageReporters: ['text', 'lcov', 'html'],
  
  // Umbrales de cobertura
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },
  
  // Configuración de ts-jest
  globals: {
    'ts-jest': {
      tsconfig: {
        esModuleInterop: true,
        allowSyntheticDefaultImports: true
      }
    }
  },
  
  // Tiempo máximo por test (5 segundos)
  testTimeout: 5000,
  
  // Mostrar resultados detallados
  verbose: true
};
