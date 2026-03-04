import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  const { VITE_PUBLIC_IP } = env;
  return{
    plugins: [react()],
    server: {
      host: true,
      https: {
        key: fs.readFileSync(`${VITE_PUBLIC_IP}+2-key.pem`),
        cert: fs.readFileSync(`${VITE_PUBLIC_IP}+2.pem`),
      }
    }
  }
})