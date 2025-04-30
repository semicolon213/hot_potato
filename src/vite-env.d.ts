/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CLIENT_ID: string
  readonly VITE_API_KEY: string
  readonly VITE_SPREADSHEET_ID: string
  readonly VITE_RANGE: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
