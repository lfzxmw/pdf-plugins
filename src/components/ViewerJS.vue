<template>
  <div class="viewerjs">
    <div class="top">
      <input type="file" accept=".pdf" @change="onFileChange">
      <input class="url" v-model.trim="urlText" placeholder="输入 PDF 地址">
      <button @click="loadUrlText">加载URL</button>
      <div class="controls" v-if="pdf">
        <button @click="goFirst" :disabled="pageNum <= 1">首页</button>
        <button @click="prevPage" :disabled="pageNum <= 1">上一页</button>
        <span>第</span>
        <input class="page-input" type="number" v-model.number="pageInput" :min="1" :max="pageCount || 1" @keyup.enter="applyPageInput" @blur="applyPageInput">
        <span>/ {{ pageCount || '?' }} 页</span>
        <button @click="nextPage" :disabled="pageCount && pageNum >= pageCount">下一页</button>
        <button @click="goLast" :disabled="!pageCount || pageNum >= pageCount">末页</button>
        <button @click="zoomOut">缩小</button>
        <span>{{ zoomLabel }}</span>
        <button @click="zoomIn">放大</button>
        <button @click="rotateLeft">左旋</button>
        <button @click="rotateRight">右旋</button>
      </div>
    </div>
    <div class="viewer">
      <canvas ref="canvas"></canvas>
      <div class="empty" v-if="!pdf && !loading">请选择或输入 PDF 进行预览</div>
      <div class="loading" v-if="loading">加载中...</div>
      <div class="error" v-if="error">{{ error }}</div>
    </div>
  </div>
</template>

<script>
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf'
pdfjs.GlobalWorkerOptions.workerSrc = require('pdfjs-dist/legacy/build/pdf.worker.min.js')

export default {
  name: 'ViewerJS',
  data() {
    return {
      pdf: null,
      pageNum: 1,
      pageCount: 0,
      pageInput: 1,
      scale: 1,
      rotation: 0,
      loading: false,
      error: '',
      urlText: ''
    }
  },
  computed: {
    zoomLabel() {
      return Math.round(this.scale * 100) + '%'
    }
  },
  methods: {
    onFileChange(e) {
      const f = e.target.files && e.target.files[0]
      if (!f) return
      const reader = new FileReader()
      reader.onload = () => {
        const data = new Uint8Array(reader.result)
        this.loadPdfData(data)
      }
      reader.onerror = () => {
        this.error = '文件读取失败'
      }
      reader.readAsArrayBuffer(f)
    },
    loadUrlText() {
      const u = this.urlText && this.urlText.trim()
      if (!u) return
      this.loadPdf(u)
    },
    async loadPdf(url) {
      this.loading = true
      this.error = ''
      try {
        if (this.pdf && this.pdf.destroy) {
          this.pdf.destroy()
        }
        const doc = await pdfjs.getDocument(url).promise
        this.pdf = doc
        this.pageCount = doc.numPages || 0
        this.pageNum = 1
        this.pageInput = 1
        await this.renderPage()
      } catch (e) {
        this.error = (e && e.message) ? e.message : '加载失败'
        this.pdf = null
        this.pageCount = 0
      } finally {
        this.loading = false
      }
    },
    async loadPdfData(data) {
      this.loading = true
      this.error = ''
      try {
        if (this.pdf && this.pdf.destroy) {
          this.pdf.destroy()
        }
        const doc = await pdfjs.getDocument({ data }).promise
        this.pdf = doc
        this.pageCount = doc.numPages || 0
        this.pageNum = 1
        this.pageInput = 1
        await this.renderPage()
      } catch (e) {
        this.error = (e && e.message) ? e.message : '加载失败'
        this.pdf = null
        this.pageCount = 0
      } finally {
        this.loading = false
      }
    },
    async renderPage() {
      if (!this.pdf) return
      const page = await this.pdf.getPage(this.pageNum)
      const viewport = page.getViewport({ scale: this.scale, rotation: this.rotation })
      const canvas = this.$refs.canvas
      const ctx = canvas.getContext('2d')
      canvas.width = viewport.width
      canvas.height = viewport.height
      await page.render({ canvasContext: ctx, viewport }).promise
    },
    prevPage() {
      if (this.pageNum > 1) {
        this.pageNum -= 1
        this.pageInput = this.pageNum
        this.renderPage()
      }
    },
    nextPage() {
      if (this.pageCount && this.pageNum < this.pageCount) {
        this.pageNum += 1
        this.pageInput = this.pageNum
        this.renderPage()
      }
    },
    goFirst() {
      if (this.pageNum !== 1) {
        this.pageNum = 1
        this.pageInput = 1
        this.renderPage()
      }
    },
    goLast() {
      if (this.pageCount && this.pageNum !== this.pageCount) {
        this.pageNum = this.pageCount
        this.pageInput = this.pageCount
        this.renderPage()
      }
    },
    applyPageInput() {
      let p = Number(this.pageInput || 1)
      if (!Number.isFinite(p)) p = 1
      if (p < 1) p = 1
      if (this.pageCount && p > this.pageCount) p = this.pageCount
      this.pageNum = p
      this.pageInput = p
      this.renderPage()
    },
    zoomIn() {
      this.scale = Math.min(Number((this.scale + 0.1).toFixed(2)), 3)
      this.renderPage()
    },
    zoomOut() {
      this.scale = Math.max(Number((this.scale - 0.1).toFixed(2)), 0.2)
      this.renderPage()
    },
    rotateLeft() {
      this.rotation = (this.rotation - 90 + 360) % 360
      this.renderPage()
    },
    rotateRight() {
      this.rotation = (this.rotation + 90) % 360
      this.renderPage()
    }
  },
  mounted() {
    const demo = 'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf'
    this.loadPdf(demo)
  },
  beforeDestroy() {
    if (this.pdf && this.pdf.destroy) {
      this.pdf.destroy()
    }
  }
}
</script>

<style scoped>
.viewerjs {
  padding: 12px;
}
.top {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
}
.controls {
  display: flex;
  align-items: center;
  gap: 8px;
}
.viewer {
  margin-top: 10px;
}
.empty, .loading, .error {
  padding: 12px 6px;
}
.page-input, .url {
  padding: 6px 8px;
  border: 1px solid #d0d0d0;
  border-radius: 6px;
  outline: none;
}
.url {
  width: 320px;
}
button {
  padding: 6px 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: #fff;
  cursor: pointer;
}
</style>
