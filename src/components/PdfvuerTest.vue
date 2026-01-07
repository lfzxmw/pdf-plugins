<template>
  <div class="pdfvuer-demo">
    <div class="top">
      <input type="file" accept=".pdf" @change="onFileChange">
      <input class="url" v-model.trim="urlText" placeholder="输入 PDF 地址">
      <button @click="loadUrlText">加载URL</button>
      <div class="controls" v-if="pdfdata">
        <button @click="goFirst" :disabled="page <= 1">首页</button>
        <button @click="page > 1 ? page-- : 1">上一页</button>
        <span>第</span>
        <input
          class="page-input"
          type="number"
          v-model.number="pageInput"
          :min="1"
          :max="numPages || 1"
          @keyup.enter="applyPageInput"
          @blur="applyPageInput"
        />
        <span>/ {{ numPages || '?' }} 页</span>
        <button @click="page < numPages ? page++ : numPages">下一页</button>
        <button @click="goLast" :disabled="!numPages || page >= numPages">末页</button>
        <button @click="decZoom">- 缩放</button>
        <span>{{ formattedZoom }}%</span>
        <button @click="incZoom">+ 缩放</button>
        <select class="preset" @change="setScalePreset($event)">
          <option value="page-width">适配宽度</option>
          <option value="0.5">50%</option>
          <option value="0.75">75%</option>
          <option value="1">100%</option>
          <option value="1.25">125%</option>
          <option value="1.5">150%</option>
          <option value="2">200%</option>
        </select>
      </div>
    </div>

    <div class="viewer" v-if="pdfdata">
      <pdf
        :src="pdfdata"
        :page="page"
        :scale.sync="scale"
        :annotation="true"
        :resize="true"
        style="width:100%;margin:16px auto;"
      >
        <template slot="loading">
          加载中...
        </template>
      </pdf>
    </div>
    <div v-else class="empty">
      <p>请选择 PDF 文件以预览</p>
      <p v-if="errorMsg" style="color:#d33;">{{ errorMsg }}</p>
    </div>
  </div>
</template>

<script>
import pdf from 'pdfvuer'
import { GlobalWorkerOptions } from 'pdfjs-dist/legacy/build/pdf'
GlobalWorkerOptions.workerSrc = require('pdfjs-dist/legacy/build/pdf.worker.min.js')

export default {
  name: 'PdfvuerTest',
  components: {
    pdf
  },
  data() {
    return {
      page: 1,
      numPages: 0,
      pdfdata: null,
      scale: 'page-width',
      pageInput: 1,
      urlText: '',
      errorMsg: ''
    }
  },
  computed: {
    formattedZoom() {
      return typeof this.scale === 'number'
        ? Math.round(this.scale * 100)
        : this.scale === 'page-width'
          ? 100
          : 100
    }
  },
  methods: {
    onFileChange(e) {
      const file = e.target.files && e.target.files[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = () => {
        const buf = reader.result
        const data = new Uint8Array(buf)
        this.loadFromData(data)
      }
      reader.onerror = () => {
        this.pdfdata = null
        this.numPages = 0
      }
      reader.readAsArrayBuffer(file)
    },
    loadUrlText() {
      const u = this.urlText && this.urlText.trim()
      if (!u) return
      this.loadFromUrl(u)
    },
    loadFromUrl(url) {
      const task = pdf.createLoadingTask({ url })
      task.then(doc => {
        this.pdfdata = task
        this.numPages = doc.numPages || 0
        this.page = 1
        this.pageInput = 1
        this.errorMsg = ''
      }).catch((e) => {
        this.pdfdata = null
        this.numPages = 0
        this.errorMsg = (e && e.message) ? e.message : '加载失败'
      })
    },
    loadFromData(data) {
      const task = pdf.createLoadingTask({ data })
      task.then(doc => {
        this.pdfdata = task
        this.numPages = doc.numPages || 0
        this.page = 1
        this.pageInput = 1
        this.errorMsg = ''
      }).catch((e) => {
        this.pdfdata = null
        this.numPages = 0
        this.errorMsg = (e && e.message) ? e.message : '加载失败'
      })
    },
    applyPageInput() {
      let p = Number(this.pageInput || 1)
      if (!Number.isFinite(p)) p = 1
      if (p < 1) p = 1
      if (this.numPages && p > this.numPages) p = this.numPages
      this.page = p
      this.pageInput = p
    },
    goFirst() {
      if (this.page !== 1) {
        this.page = 1
        this.pageInput = 1
      }
    },
    goLast() {
      if (this.numPages && this.page !== this.numPages) {
        this.page = this.numPages
        this.pageInput = this.numPages
      }
    },
    incZoom() {
      if (typeof this.scale !== 'number') this.scale = 1
      this.scale = Math.min(Number((this.scale + 0.1).toFixed(2)), 2)
    },
    decZoom() {
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
    }
  },
  mounted() {
    const demo = 'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf'
    this.loadFromUrl(demo)
  },
  beforeDestroy() {
    if (this.pdfdata && this.pdfdata.destroy) {
      this.pdfdata.destroy()
    }
  }
}
</script>

<style src="pdfvuer/dist/pdfvuer.css"></style>
<style scoped>
.pdfvuer-demo {
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
.empty {
  padding: 40px 20px;
  text-align: center;
  color: #666;
}
button {
  padding: 6px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: #fff;
  cursor: pointer;
}
</style>
