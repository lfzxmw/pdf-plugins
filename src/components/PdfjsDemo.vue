<template>
  <div class="pdfjs-demo">
    <div class="top">
      <input type="file" accept=".pdf" @change="onFileChange">
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
        <button @click="zoomReset" :disabled="scale === 1">重置缩放</button>
        <button @click="rotateLeft">左旋</button>
        <button @click="rotateRight">右旋</button>
      </div>
    </div>
    <div class="viewer">
      <canvas ref="canvas"></canvas>
      <div class="empty" v-if="!pdf && !loading">请选择 PDF 文件以预览</div>
      <div class="loading" v-if="loading">加载中...</div>
      <div class="error" v-if="error">{{ error }}</div>
    </div>
  </div>
</template>

<script>
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf'
pdfjs.GlobalWorkerOptions.workerSrc = require('pdfjs-dist/legacy/build/pdf.worker.min.js')

export default {
  name: 'PdfjsDemo',
  data() {
    return {
      pdf: null,
      fileUrl: null,
      pageNum: 1,
      pageCount: 0,
      pageInput: 1,
      scale: 1,
      rotation: 0,
      loading: false,
      error: ''
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
        const buf = reader.result
        const data = new Uint8Array(buf)
        this.loadPdfData(data)
      }
      reader.onerror = () => {
        this.error = '文件读取失败'
      }
      reader.readAsArrayBuffer(f)
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
      if (!isFinite(p)) p = 1
      if (p < 1) p = 1
      if (this.pageCount && p > this.pageCount) p = this.pageCount
      this.pageNum = p
      this.pageInput = p
      this.renderPage()
    },
    zoomIn() {
      const next = Math.min(this.scale + 0.1, 3)
      this.scale = Number(next.toFixed(2))
      this.renderPage()
    },
    zoomOut() {
      const next = Math.max(this.scale - 0.1, 0.3)
      this.scale = Number(next.toFixed(2))
      this.renderPage()
    },
    zoomReset() {
      if (this.scale !== 1) {
        this.scale = 1
        this.renderPage()
      }
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
  beforeDestroy() {
    if (this.fileUrl) {
      URL.revokeObjectURL(this.fileUrl)
    }
    if (this.pdf && this.pdf.destroy) {
      this.pdf.destroy()
    }
  }
}
</script>

<style scoped>
.pdfjs-demo {
  padding: 12px;
}
.top {
  display: flex;
  align-items: center;
  gap: 12px;
}
.controls {
  display: flex;
  align-items: center;
  gap: 8px;
}
.viewer {
  margin-top: 12px;
  min-height: 200px;
}
.page-input {
  width: 64px;
  padding: 4px 6px;
  border: 1px solid #ddd;
  border-radius: 4px;
}
.loading, .empty, .error {
  margin-top: 16px;
  color: #666;
}
.error { color: #d33; }
button {
  padding: 6px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: #fff;
  cursor: pointer;
}
</style>
