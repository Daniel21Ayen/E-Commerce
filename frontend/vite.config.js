import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  css: {
    postcss: false
  },
  root: path.resolve(__dirname, '.'),
  publicDir: 'public',
  server: {
    port: 3005,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
        configure: (proxy) => {
          proxy.on('error', (err) => {
            console.log('Proxy error:', err);
          });
          proxy.on('proxyReq', (proxyReq, req) => {
            console.log(`Proxying: ${req.method} ${req.url}`);
          });
        }
      },
      '/uploads': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html')
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@css': path.resolve(__dirname, 'src/css'),
      '@js': path.resolve(__dirname, 'src/js'),
      '@modules': path.resolve(__dirname, 'src/js/modules'),
      '@templates': path.resolve(__dirname, 'src/templates')
    }
  },
  define: {
    'process.env.VERSION': JSON.stringify('1.0.0'),
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
    'process.env.API_URL': JSON.stringify('/api')
  }
});

