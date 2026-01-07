module.exports = {
  transpileDependencies: ['pdfjs-dist'],
  configureWebpack: {
    resolve: {
      alias: {
        'vue-pdf-embed': 'vue-pdf-embed/dist/vue2-pdf-embed',
        'pdfjs-dist/build/pdf.js': require.resolve('pdfjs-dist/legacy/build/pdf'),
        'pdfjs-dist/build/pdf': require.resolve('pdfjs-dist/legacy/build/pdf'),
        'pdfjs-dist/build/pdf.worker': require.resolve('pdfjs-dist/legacy/build/pdf.worker.js'),
        'pdfjs-dist/es5/build/pdf.js': require.resolve('pdfjs-dist/legacy/build/pdf'),
        'pdfjs-dist/build/pdf.worker.js': require.resolve('pdfjs-dist/legacy/build/pdf.worker.js'),
        'pdfjs-dist/build/pdf.worker.min.js': require.resolve('pdfjs-dist/legacy/build/pdf.worker.min.js'),
        'pdfjs-dist/es5/build/pdf.worker.js': require.resolve('pdfjs-dist/legacy/build/pdf.worker.js'),
        'pdfjs-dist/build/pdf.worker.entry': require.resolve('pdfjs-dist/build/pdf.worker.entry')
      }
    }
  }
}
