/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_CASHFREE_MODE?: "sandbox" | "production";
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
