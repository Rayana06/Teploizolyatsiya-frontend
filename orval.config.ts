import { defineConfig } from 'orval'

export default defineConfig({
  teploshchit: {
    input: './openapi/lab6.json',
    output: {
      target: './src/api/generated/insulationMaterialsApi.ts',
      schemas: './src/api/generated/models',
      client: 'axios-functions',
      mode: 'split',
      prettier: true,
      override: {
        mutator: {
          path: './src/api/axiosInstance.ts',
          name: 'axiosInstance',
        },
      },
    },
  },
})
