<template>
  <div class="pdf-manager" @dragover.prevent="isDragging = true" @dragleave.prevent="isDragging = false" @drop.prevent="onDrop">
    <div class="topbar">
      <div class="left">
        <button @click="triggerFileInput">添加 PDF</button>
        <input ref="fileInput" type="file" accept=".pdf" multiple @change="onFileChange">
        <span class="hint">支持拖拽添加</span>
      </div>
      <div class="right">
        <input class="search" v-model.trim="search" placeholder="搜索文件名">
      </div>
    </div>
    <div class="content">
      <aside class="sidebar">
        <div class="list-header">
          <span>文件列表</span>
          <span class="count">{{ filteredFiles.length }}</span>
        </div>
        <ul class="file-list">
          <li v-for="(f, i) in filteredFiles" :key="f.id" :class="{ active: i === selectedIndex }" @click="selectFileByFilteredIndex(i)">
            <div class="name">{{ f.name }}</div>
            <div class="meta">{{ formatSize(f.size) }}</div>
            <div class="actions" @click.stop>
              <button @click="renameFile(i)">重命名</button>
              <button @click="downloadFile(i)">下载</button>
              <button class="danger" @click="removeFile(i)">删除</button>
            </div>
          </li>
        </ul>
      </aside>
      <main class="viewer">
        <div v-if="selectedFile" class="toolbar">
          <div class="file-info">
            <span class="filename">{{ selectedFile.name }}</span>
          </div>
          <div class="pager">
            <button @click="goFirst" :disabled="currentPage <= 1">首页</button>
            <button @click="prevPage" :disabled="currentPage <= 1">上一页</button>
            <span>第</span>
            <input
              class="page-input"
              type="number"
              v-model.number="pageInput"
              :min="1"
              :max="totalPages || 1"
              @keyup.enter="applyPageInput"
              @blur="applyPageInput"
            />
            <span>/ {{ totalPages || '?' }} 页</span>
            <button @click="applyPageInput">跳转</button>
            <button @click="nextPage" :disabled="totalPages && currentPage >= totalPages">下一页</button>
            <button @click="goLast" :disabled="!totalPages || currentPage >= totalPages">末页</button>
          </div>
          <div class="quick-actions">
            <button @click="downloadSelected">下载当前</button>
            <button @click="zoomOut">缩小</button>
            <button @click="zoomIn">放大</button>
            <button @click="zoomReset">重置缩放</button>
            <button @click="rotateLeft">左旋</button>
            <button @click="rotateRight">右旋</button>
            <button @click="printDoc">打印</button>
            <button @click="toggleFullscreen">{{ isFullscreen ? '退出全屏' : '全屏' }}</button>
          </div>
          <div class="progress" v-if="progressTotal">
            <span>加载进度：{{ Math.round((progressLoaded / progressTotal) * 100) }}%</span>
          </div>
        </div>
        <div v-if="selectedFile" class="pdf-container">
          <div class="pdf-zoom" :style="zoomStyle">
            <vue-pdf-embed
              :source="selectedFile.url"
              :page="currentPage"
              @loaded="onLoaded"
              @rendered="onRendered"
              @progress="onProgress"
              @error="onError"
              :key="pdfKey"
              :rotation="rotation"
              :textLayer="true"
              :annotationLayer="true"
              ref="pdf"
            />
          </div>
        </div>
        <div v-else class="empty">
          <p>未选择文件</p>
          <button @click="triggerFileInput">选择或拖拽 PDF</button>
        </div>
      </main>
    </div>
    <div v-if="isDragging" class="drop-mask">释放以添加 PDF</div>
  </div>
</template>

<script>
import VuePdfEmbed from 'vue-pdf-embed/dist/vue2-pdf-embed'
import { GlobalWorkerOptions, getDocument } from 'pdfjs-dist/legacy/build/pdf'
GlobalWorkerOptions.workerSrc = require('pdfjs-dist/legacy/build/pdf.worker.min.js')

export default {
  name: 'PdfManager',
  components: { VuePdfEmbed },
  data() {
    return {
      files: [],
      selectedIndex: -1,
      currentPage: 1,
      totalPages: 0,
      search: '',
      isDragging: false,
      pageInput: 1,
      scale: 1,
      rotation: 0,
      isFullscreen: false,
      progressLoaded: 0,
      progressTotal: 0
    }
  },
  computed: {
    pdfKey() {
      const id = this.selectedFile ? this.selectedFile.id : ''
      return `${id}-${this.scale}-${this.rotation}`
    },
    zoomStyle() {
      return {
        transform: `scale(${this.scale})`,
        transformOrigin: 'top left'
      }
    },
    filteredFiles() {
      const q = this.search.toLowerCase()
      return this.files.filter(f => f.name.toLowerCase().includes(q))
    },
    selectedFile() {
      return this.files[this.selectedIndex] || null
    }
  },
  methods: {
    triggerFileInput() {
      this.$refs.fileInput.click()
    },
    onFileChange(e) {
      const list = Array.from(e.target.files || [])
      this.addFiles(list)
      e.target.value = ''
    },
    onDrop(e) {
      this.isDragging = false
      const list = Array.from(e.dataTransfer.files || []).filter(f => f.type === 'application/pdf')
      this.addFiles(list)
    },
    addFiles(list) {
      const added = list.map(f => {
        return {
          id: `${Date.now()}_${Math.random().toString(36).slice(2)}`,
          name: f.name,
          size: f.size,
          url: URL.createObjectURL(f),
          createdAt: Date.now()
        }
      })
      this.files = [...added, ...this.files]
      if (this.selectedIndex === -1 && this.files.length) {
        this.selectedIndex = 0
        this.currentPage = 1
        this.pageInput = 1
        this.loadTotalPages()
      }
    },
    selectFileByFilteredIndex(i) {
      const target = this.filteredFiles[i]
      const actualIndex = this.files.findIndex(f => f.id === target.id)
      this.selectedIndex = actualIndex
      this.currentPage = 1
      this.pageInput = 1
      this.loadTotalPages()
    },
    removeFile(i) {
      const target = this.filteredFiles[i]
      const actualIndex = this.files.findIndex(f => f.id === target.id)
      const f = this.files[actualIndex]
      if (f && f.url) URL.revokeObjectURL(f.url)
      this.files.splice(actualIndex, 1)
      if (this.selectedIndex === actualIndex) {
        this.selectedIndex = this.files.length ? 0 : -1
        this.currentPage = 1
        this.totalPages = 0
        if (this.selectedIndex !== -1) this.loadTotalPages()
      } else if (actualIndex < this.selectedIndex) {
        this.selectedIndex -= 1
      }
    },
    renameFile(i) {
      const target = this.filteredFiles[i]
      const actualIndex = this.files.findIndex(f => f.id === target.id)
      const newName = window.prompt('重命名文件', this.files[actualIndex].name)
      if (newName && newName.trim()) {
        this.$set(this.files[actualIndex], 'name', newName.trim())
      }
    },
    downloadFile(i) {
      const target = this.filteredFiles[i]
      const a = document.createElement('a')
      a.href = target.url
      a.download = target.name || 'download.pdf'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    },
    downloadSelected() {
      if (!this.selectedFile) return
      const a = document.createElement('a')
      a.href = this.selectedFile.url
      a.download = this.selectedFile.name || 'download.pdf'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    },
    zoomIn() {
      const next = Math.min(this.scale + 0.1, 3)
      this.scale = Number(next.toFixed(2))
    },
    zoomOut() {
      const next = Math.max(this.scale - 0.1, 0.3)
      this.scale = Number(next.toFixed(2))
    },
    zoomReset() {
      this.scale = 1
    },
    rotateLeft() {
      this.rotation = (this.rotation - 90 + 360) % 360
    },
    rotateRight() {
      this.rotation = (this.rotation + 90) % 360
    },
    printDoc() {
      const inst = this.$refs.pdf
      if (inst && typeof inst.print === 'function') {
        inst.print(300, this.selectedFile ? this.selectedFile.name : '', false)
      }
    },
    toggleFullscreen() {
      const el = this.$el
      if (!document.fullscreenElement) {
        el.requestFullscreen?.()
        this.isFullscreen = true
      } else {
        document.exitFullscreen?.()
        this.isFullscreen = false
      }
    },
    prevPage() {
      if (this.currentPage > 1) {
        this.currentPage -= 1
        this.pageInput = this.currentPage
      }
    },
    nextPage() {
      if (!this.selectedFile) return
      if (!this.totalPages) {
        this.loadTotalPages().then(() => {
          if (!this.totalPages || this.currentPage < this.totalPages) {
            this.jumpToPage(this.currentPage + 1)
          }
        })
        return
      }
      if (this.currentPage < this.totalPages) {
        this.jumpToPage(this.currentPage + 1)
      }
    },
    goFirst() {
      if (this.currentPage !== 1) {
        this.jumpToPage(1)
      }
    },
    goLast() {
      if (this.totalPages && this.currentPage !== this.totalPages) {
        this.jumpToPage(this.totalPages)
      }
    },
    applyPageInput() {
      let p = Number(this.pageInput || 1)
      if (!Number.isFinite(p)) p = 1
      if (p < 1) p = 1
      if (this.totalPages && p > this.totalPages) p = this.totalPages
      this.jumpToPage(p)
    },
    jumpToPage(p) {
      this.currentPage = p
      this.pageInput = p
    },
    onLoaded(doc) {
      const count = doc && doc.numPages ? doc.numPages : 0
      if (count > 0) {
        this.totalPages = count
        if (this.currentPage > count) this.currentPage = count
        if (this.pageInput > count) this.pageInput = count
      }
    },
    onProgress(p) {
      this.progressLoaded = p && typeof p.loaded === 'number' ? p.loaded : 0
      this.progressTotal = p && typeof p.total === 'number' ? p.total : 0
    },
    onRendered(e) {
      const count = e && (e.pageCount || e.total || e.pages) ? (e.pageCount || e.total || e.pages) : null
      if (typeof count === 'number' && count > 0) {
        this.totalPages = count
        if (this.currentPage > count) this.currentPage = count
        if (this.pageInput > count) this.pageInput = count
      }
    },
    onError(e) {
      console.error(e)
    },
    formatSize(s) {
      if (s < 1024) return `${s} B`
      if (s < 1024 * 1024) return `${(s / 1024).toFixed(1)} KB`
      return `${(s / (1024 * 1024)).toFixed(2)} MB`
    },
    async loadTotalPages() {
      this.totalPages = 0
      if (!this.selectedFile) return
      try {
        const doc = await getDocument(this.selectedFile.url).promise
        this.totalPages = doc.numPages || 0
      } catch (e) {
        this.totalPages = 0
      }
    }
  },
  mounted() {
    this.loadTotalPages()
  },
  beforeDestroy() {
    this.files.forEach(f => {
      if (f.url) URL.revokeObjectURL(f.url)
    })
  }
}
</script>

<style scoped>
.pdf-manager {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px;
  font-family: Arial, sans-serif;
}
.topbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  background: #f8f9fa;
  border-radius: 8px;
  padding: 10px 12px;
}
.topbar .left {
  display: flex;
  align-items: center;
  gap: 10px;
}
.topbar input[type="file"] {
  display: none;
}
.topbar .hint {
  color: #888;
  font-size: 13px;
}
.topbar .search {
  width: 220px;
  padding: 8px 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
}
.content {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 12px;
}
.sidebar {
  background: #fff;
  border: 1px solid #eee;
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  background: #fafafa;
  border-bottom: 1px solid #eee;
  font-weight: 600;
}
.list-header .count {
  font-size: 12px;
  color: #999;
}
.file-list {
  list-style: none;
  margin: 0;
  padding: 0;
}
.file-list li {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 8px;
  align-items: center;
  padding: 10px 12px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
}
.file-list li.active {
  background: #f0f7ff;
}
.file-list .name {
  font-weight: 500;
}
.file-list .meta {
  color: #999;
  font-size: 12px;
}
.file-list .actions {
  display: flex;
  gap: 6px;
}
.file-list .actions .danger {
  color: #d33;
}
.viewer {
  background: #fff;
  border: 1px solid #eee;
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  background: #fafafa;
  border-bottom: 1px solid #eee;
}
.toolbar .filename {
  font-weight: 600;
}
.pager {
  display: flex;
  align-items: center;
  gap: 10px;
}
.pdf-container {
  min-height: 560px;
  padding: 12px;
}
.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 560px;
  color: #666;
  gap: 8px;
}
button {
  padding: 8px 14px;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: #fff;
  cursor: pointer;
}
button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.drop-mask {
  position: fixed;
  inset: 0;
  background: rgba(21, 105, 255, 0.1);
  border: 3px dashed #1569ff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  color: #1569ff;
  pointer-events: none;
}
</style>
