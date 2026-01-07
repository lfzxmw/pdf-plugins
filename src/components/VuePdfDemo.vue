<template>
  <div class="viewer">
    <header class="toolbar">
      <input type="file" accept=".pdf" @change="onFileChange">
      <input class="url" v-model.trim="urlText" placeholder="输入 PDF 地址">
      <button @click="loadUrlText">加载URL</button>
      <span class="split"></span>
      <button @click="prevPage" :disabled="page <= 1">上一页</button>
      <span>第</span>
      <input class="page-input" type="number" v-model.number="pageInput" :min="1" :max="pageCount || 1" @keyup.enter="applyPageInput" @blur="applyPageInput">
      <span>/ {{ pageCount || '?' }}</span>
      <button @click="nextPage" :disabled="pageCount && page >= pageCount">下一页</button>
      <button @click="goFirst" :disabled="page <= 1">首页</button>
      <button @click="goLast" :disabled="!pageCount || page >= pageCount">末页</button>
      <span class="split"></span>
      <button @click="zoomOut">缩小</button>
      <span>{{ zoomLabel }}</span>
      <button @click="zoomIn">放大</button>
      <select class="preset" @change="setScalePreset($event)">
        <option value="page-width">适配宽度</option>
        <option value="0.5">50%</option>
        <option value="0.75">75%</option>
        <option value="1">100%</option>
        <option value="1.25">125%</option>
        <option value="1.5">150%</option>
        <option value="2">200%</option>
      </select>
      <button @click="rotateLeft">左旋</button>
      <button @click="rotateRight">右旋</button>
      <span class="split"></span>
      <input class="search" v-model.trim="searchText" placeholder="搜索文本" @keyup.enter="runSearch">
      <button @click="runSearch">搜索</button>
      <span v-if="searching">搜索中...</span>
      <span v-else-if="searchText && searchTotal >= 0">结果：{{ searchTotal }}</span>
      <button @click="prevResult" :disabled="!hasResults">上一个</button>
      <button @click="nextResult" :disabled="!hasResults">下一个</button>
      <span class="split"></span>
      <button @click="printPdf" :disabled="!rawSource">打印</button>
      <button @click="downloadPdf" :disabled="!rawSource">下载</button>
      <button @click="toggleFull">{{ isFull ? '退出全屏' : '全屏' }}</button>
      <button @click="toggleSidebar">{{ showSidebar ? '收起缩略图' : '展开缩略图' }}</button>
    </header>

    <main class="content">
      <aside class="sidebar" v-show="showSidebar">
        <div class="thumbs" ref="thumbs">
          <div class="thumb" v-for="n in pageCount" :key="n" @click="jumpTo(n)">
            <img v-if="thumbnails[n]" :src="thumbnails[n]" :alt="'第' + n + '页'">
            <div v-else class="thumb-loading">生成中...</div>
            <div class="thumb-index">{{ n }}</div>
          </div>
        </div>
      </aside>
      <section class="page">
        <pdf
          v-if="src"
          :src="src"
          :page="page"
          :rotate="rotate"
          :scale="scale"
          @num-pages="pageCount = $event"
          style="width:100%;margin:0 auto;"
        />
        <div v-else class="empty">
          <p>请选择或输入 PDF 进行预览</p>
          <p v-if="errorMsg" class="error">{{ errorMsg }}</p>
        </div>
      </section>
    </main>
  </div>
</template>

<script>
import pdf from 'vue-pdf'
import * as pdfjs from 'pdfjs-dist/build/pdf'
import { GlobalWorkerOptions } from 'pdfjs-dist/build/pdf'
GlobalWorkerOptions.workerSrc = require('pdfjs-dist/build/pdf.worker.entry')

export default {
  name: 'VuePdfDemo',
  components: { pdf },
  data() {
    return {
      src: null,
      doc: null,
      rawSource: null,
      page: 1,
      pageCount: 0,
      scale: 'page-width',
      rotate: 0,
      pageInput: 1,
      errorMsg: '',
      urlText: '',
      isFull: false,
      showSidebar: true,
      thumbnails: {},
      searchText: '',
      searching: false,
      searchResults: [],
      searchIndex: -1
    }
  },
  computed: {
    zoomLabel() {
      return typeof this.scale === 'number'
        ? `${Math.round(this.scale * 100)}%`
        : '自适应宽度'
    },
    hasResults() {
      return this.searchResults && this.searchResults.length > 0
    },
    searchTotal() {
      return this.searchResults.length
    }
  },
  methods: {
    onFileChange(e) {
      const f = e.target.files && e.target.files[0]
      if (!f) return
      const reader = new FileReader()
      reader.onload = () => {
        const data = new Uint8Array(reader.result)
        this.rawSource = data
        this.loadFromData(data)
        this.errorMsg = ''
      }
      reader.onerror = () => {
        this.errorMsg = '文件读取失败'
      }
      reader.readAsArrayBuffer(f)
    },
    loadUrlText() {
      const u = this.urlText && this.urlText.trim()
      if (!u) return
      this.errorMsg = ''
      this.rawSource = u
      this.loadFromUrl(u)
    },
    rotateLeft() {
      this.rotate = (this.rotate - 90 + 360) % 360
    },
    rotateRight() {
      this.rotate = (this.rotate + 90) % 360
    },
    toggleFull() {
      const el = this.$el
      if (!document.fullscreenElement) {
        if (el.requestFullscreen) el.requestFullscreen()
        this.isFull = true
      } else {
        if (document.exitFullscreen) document.exitFullscreen()
        this.isFull = false
      }
    },
    toggleSidebar() {
      this.showSidebar = !this.showSidebar
    },
    async loadFromUrl(url) {
      try {
        this.src = url
        const doc = await pdfjs.getDocument(url).promise
        this.doc = doc
        this.pageCount = doc.numPages || 0
        this.page = 1
        this.pageInput = 1
        this.errorMsg = ''
        this.prepareInitialThumbnails()
      } catch (e) {
        this.src = null
        this.doc = null
        this.pageCount = 0
        this.errorMsg = (e && e.message) ? e.message : '加载失败'
      }
    },
    async loadFromData(data) {
      try {
        this.src = data
        const doc = await pdfjs.getDocument({ data }).promise
        this.doc = doc
        this.pageCount = doc.numPages || 0
        this.page = 1
        this.pageInput = 1
        this.errorMsg = ''
        this.prepareInitialThumbnails()
      } catch (e) {
        this.src = null
        this.doc = null
        this.pageCount = 0
        this.errorMsg = (e && e.message) ? e.message : '加载失败'
      }
    },
    async genThumbnail(n) {
      if (!this.doc || this.thumbnails[n]) return
      try {
        const page = await this.doc.getPage(n)
        const viewport = page.getViewport({ scale: 0.25 })
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        canvas.width = viewport.width
        canvas.height = viewport.height
        await page.render({ canvasContext: ctx, viewport }).promise
        this.$set(this.thumbnails, n, canvas.toDataURL('image/png'))
      } catch (e) {
        return
      }
    },
    prepareInitialThumbnails() {
      const count = Math.min(this.pageCount || 0, 12)
      const tasks = []
      for (let i = 1; i <= count; i++) {
        tasks.push(this.genThumbnail(i))
      }
      Promise.all(tasks)
    },
    jumpTo(n) {
      if (!Number.isFinite(n)) return
      if (n < 1) n = 1
      if (this.pageCount && n > this.pageCount) n = this.pageCount
      this.page = n
      this.pageInput = n
      this.genThumbnail(n + 1)
      this.genThumbnail(n + 2)
    },
    prevPage() {
      if (this.page > 1) {
        this.page -= 1
        this.pageInput = this.page
      }
    },
    nextPage() {
      if (this.pageCount && this.page < this.pageCount) {
        this.page += 1
        this.pageInput = this.page
      }
    },
    goFirst() {
      if (this.page !== 1) {
        this.page = 1
        this.pageInput = 1
      }
    },
    goLast() {
      if (this.pageCount && this.page !== this.pageCount) {
        this.page = this.pageCount
        this.pageInput = this.pageCount
      }
    },
    applyPageInput() {
      let p = Number(this.pageInput || 1)
      if (!Number.isFinite(p)) p = 1
      if (p < 1) p = 1
      if (this.pageCount && p > this.pageCount) p = this.pageCount
      this.page = p
      this.pageInput = p
    },
    zoomIn() {
      if (typeof this.scale !== 'number') this.scale = 1
      this.scale = Math.min(Number((this.scale + 0.1).toFixed(2)), 2)
    },
    zoomOut() {
      if (typeof this.scale !== 'number') this.scale = 1
      this.scale = Math.max(Number((this.scale - 0.1).toFixed(2)), 0.2)
    },
    setScalePreset(e) {
      const v = e && e.target ? e.target.value : 'page-width'
      if (v === 'page-width') {
        this.scale = 'page-width'
      } else {
        const n = Number(v)
        this.scale = Number.isFinite(n) ? n : 1
      }
    },
    async runSearch() {
      const q = (this.searchText || '').trim()
      if (!q || !this.doc) {
        this.searchResults = []
        this.searchIndex = -1
        return
      }
      this.searching = true
      this.searchResults = []
      this.searchIndex = -1
      try {
        const total = this.pageCount || 0
        for (let p = 1; p <= total; p++) {
          const page = await this.doc.getPage(p)
          const text = await page.getTextContent()
          const items = text.items || []
          const str = items.map(i => i.str).join(' ')
          if (str.toLowerCase().includes(q.toLowerCase())) {
            this.searchResults.push({ page: p })
          }
        }
        if (this.searchResults.length > 0) {
          this.searchIndex = 0
          const target = this.searchResults[0]
          this.jumpTo(target.page)
        }
      } finally {
        this.searching = false
      }
    },
    nextResult() {
      if (!this.hasResults) return
      this.searchIndex = (this.searchIndex + 1) % this.searchResults.length
      const target = this.searchResults[this.searchIndex]
      this.jumpTo(target.page)
    },
    prevResult() {
      if (!this.hasResults) return
      this.searchIndex = (this.searchIndex - 1 + this.searchResults.length) % this.searchResults.length
      const target = this.searchResults[this.searchIndex]
      this.jumpTo(target.page)
    },
    async downloadPdf() {
      if (!this.rawSource) return
      try {
        let blob
        if (typeof this.rawSource === 'string') {
          const res = await fetch(this.rawSource)
          const buf = await res.arrayBuffer()
          blob = new Blob([buf], { type: 'application/pdf' })
        } else {
          blob = new Blob([this.rawSource], { type: 'application/pdf' })
        }
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'document.pdf'
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      } catch (e) {
        this.errorMsg = '下载失败'
      }
    },
    async printPdf() {
      if (!this.rawSource) return
      try {
        let blobUrl
        if (typeof this.rawSource === 'string') {
          const res = await fetch(this.rawSource)
          const buf = await res.arrayBuffer()
          const blob = new Blob([buf], { type: 'application/pdf' })
          blobUrl = URL.createObjectURL(blob)
        } else {
          const blob = new Blob([this.rawSource], { type: 'application/pdf' })
          blobUrl = URL.createObjectURL(blob)
        }
        const iframe = document.createElement('iframe')
        iframe.style.position = 'fixed'
        iframe.style.right = '0'
        iframe.style.bottom = '0'
        iframe.style.width = '0'
        iframe.style.height = '0'
        iframe.style.border = '0'
        iframe.src = blobUrl
        document.body.appendChild(iframe)
        iframe.onload = () => {
          iframe.contentWindow.focus()
          iframe.contentWindow.print()
          setTimeout(() => {
            document.body.removeChild(iframe)
            URL.revokeObjectURL(blobUrl)
          }, 3000)
        }
      } catch (e) {
        this.errorMsg = '打印失败'
      }
    }
  },
  mounted() {
    const demo = 'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf'
    this.rawSource = demo
    this.loadFromUrl(demo)
  }
}
</script>

<style scoped>
.viewer {
  display: flex;
  flex-direction: column;
  height: 100%;
}
.toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-bottom: 1px solid #eee;
  background: #fafafa;
}
.split {
  width: 1px;
  height: 20px;
  background: #e5e5e5;
  margin: 0 6px;
}
.url {
  flex: 1 1 320px;
  min-width: 220px;
  max-width: 520px;
  padding: 6px 8px;
  border: 1px solid #d0d0d0;
  border-radius: 6px;
  outline: none;
}
select, button, input[type="file"], .search, .page-input {
  padding: 6px 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: #fff;
}
.content {
  display: flex;
  min-height: calc(100vh - 120px);
}
.sidebar {
  width: 180px;
  border-right: 1px solid #eee;
  overflow: auto;
}
.thumbs {
  padding: 10px;
  display: grid;
  grid-template-columns: 1fr;
  gap: 8px;
}
.thumb {
  position: relative;
  border: 1px solid #eaeaea;
  border-radius: 6px;
  background: #fff;
  overflow: hidden;
  cursor: pointer;
}
.thumb img {
  display: block;
  width: 100%;
  height: auto;
}
.thumb-loading {
  padding: 16px;
  text-align: center;
  font-size: 12px;
  color: #888;
}
.thumb-index {
  position: absolute;
  right: 6px;
  bottom: 6px;
  font-size: 12px;
  color: #666;
  background: rgba(255,255,255,0.7);
  padding: 2px 6px;
  border-radius: 4px;
}
.page {
  flex: 1;
  padding: 12px;
}
.empty {
  padding: 40px 20px;
  text-align: center;
  color: #666;
}
.error {
  color: #d33;
}
@media (max-width: 768px) {
  .toolbar {
    gap: 8px;
  }
  .url {
    max-width: 100%;
  }
  .sidebar {
    display: none;
  }
}
</style>
