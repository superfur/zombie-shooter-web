import { defineConfig } from 'vite';

export default defineConfig({
  // 设置为 './' 可以让生成的 index.html 使用相对路径引用资源
  // 这样无论你的 GitHub 仓库叫什么名字，或者部署在什么路径，都能正常运行
  base: './', 
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false
  }
});


