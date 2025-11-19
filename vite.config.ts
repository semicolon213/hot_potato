import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    fs: {
      strict: false
    },
    middlewareMode: false,
    hmr: {
      overlay: true
    },
    headers: {
      'Content-Security-Policy':
          "connect-src 'self' https://accounts.google.com https://apis.google.com https://www.googleapis.com https://content.googleapis.com https://oauth2.googleapis.com https://clients6.google.com https://script.google.com https://script.googleusercontent.com https://*.googleusercontent.com https://sheets.googleapis.com https://docs.googleapis.com https://drive.googleapis.com https://*.googleapis.com https://*.gstatic.com https://www.gstatic.com https://ssl.gstatic.com;"
    },
    proxy: {
      '/api': {
        target: process.env.VITE_APP_SCRIPT_URL || 'https://script.google.com/macros/s/AKfycbwlgk6IgxezP9RpLT3Jn6Lv2JmuW1ZjTdrnx5-IyiC3MJDSv-xGb8vz1h9H0TCU9JyY/exec',
        changeOrigin: true,
        secure: false,
        followRedirects: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('🚨 프록시 에러:', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('📤 프록시 요청:', req.method, req.url, '→', proxyReq.path);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('📥 프록시 응답:', proxyRes.statusCode, req.url);
          });
        },
      }
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // React 관련 라이브러리
          'react-vendor': ['react', 'react-dom'],
          // Google API 관련
          'google-vendor': ['gapi-script'],
          // Papyrus DB
          'papyrus-vendor': ['papyrus-db'],
          // 그래프 라이브러리 (네트리파이 배포 호환성)
          'chart-vendor': ['recharts'],
          // 기타 유틸리티
          'utils-vendor': ['rrule']
        }
      }
    },
    // 청크 크기 경고 임계값 조정 (선택사항)
    chunkSizeWarningLimit: 1000
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
  }
})
