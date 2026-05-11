declare module 'prettier/plugins/estree' {
  import type { Plugin } from 'prettier'

  export const languages: Plugin['languages']
  export const options: Plugin['options']
  export const printers: Plugin['printers']
}
