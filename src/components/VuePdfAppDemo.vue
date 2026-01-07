<template>
  <div class="pdfapp-demo">
    <div class="top">
      <input type="file" accept=".pdf" @change="onFileChange">
      <div class="controls" v-if="pdf">
        <span>主题：</span>
        <button @click="theme = theme === 'light' ? 'dark' : 'light'">{{ theme }}</button>
        <span>缩放：</span>
        <select v-model="pageScale">
          <option value="auto">自适应</option>
          <option value="page-width">页宽</option>
          <option value="page-height">页高</option>
          <option value="page-fit">整页</option>
          <option value="page-actual">100%</option>
          <option value="20">20%</option>
          <option value="50">50%</option>
          <option value="75">75%</option>
          <option value="100">100%</option>
          <option value="125">125%</option>
          <option value="150">150%</option>
          <option value="200">200%</option>
        </select>
      </div>
    </div>
    <vue-pdf-app
      v-if="pdf"
      :pdf="pdf"
      :theme.sync="theme"
      :page-scale="pageScale"
      :title="true"
      :config="config"
      style="height: calc(100vh - 120px);"
    >
      <template #viewer-header>
        <div class="custom-header">
          <button class="btn" :id="idConfig.previous" type="button">上一页</button>
          <input :id="idConfig.pageNumber" class="page-input" type="number" :min="1" placeholder="页码">
          <button class="btn" :id="idConfig.next" type="button">下一页</button>
          <span class="split"></span>
          <button class="btn" :id="idConfig.zoomOut" type="button">-</button>
          <button class="btn" :id="idConfig.zoomIn" type="button">+</button>
        </div>
      </template>
    </vue-pdf-app>
    <div v-else class="empty">
      <p>请选择 PDF 文件以预览</p>
    </div>
  </div>
  </template>

<script>
import VuePdfApp from 'vue-pdf-app'
import 'vue-pdf-app/dist/icons/main.css'

export default {
  name: 'VuePdfAppDemo',
  components: { VuePdfApp },
  data() {
    return {
      pdf: null,
      theme: 'light',
      pageScale: 'auto',
      config: {
        sidebar: {
          viewThumbnail: true,
          viewOutline: true,
          viewAttachments: false
        },
        secondaryToolbar: false,
        toolbar: {
          toolbarViewerLeft: {
            findbar: false,
            previous: false,
            next: false,
            pageNumber: false
          },
          toolbarViewerMiddle: {
            zoomOut: false,
            zoomIn: false,
            scaleSelectContainer: true
          },
          toolbarViewerRight: {
            presentationMode: false,
            openFile: false,
            print: false,
            download: false,
            viewBookmark: false
          }
        },
        errorWrapper: true
      },
      idConfig: {
        previous: 'btnPrev',
        next: 'btnNext',
        pageNumber: 'inputPage',
        zoomOut: 'btnZoomOut',
        zoomIn: 'btnZoomIn'
      }
    }
  },
  methods: {
    onFileChange(e) {
      const f = e.target.files && e.target.files[0]
      if (!f) return
      const reader = new FileReader()
      reader.onload = () => {
        this.pdf = new Uint8Array(reader.result)
      }
      reader.readAsArrayBuffer(f)
    }
  }
}
</script>

<style scoped>
.pdfapp-demo {
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
select, button {
  padding: 6px 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: #fff;
}
.custom-header {
  position: sticky;
  top: 0;
  z-index: 5;
  display: inline-flex;
  gap: 8px;
  padding: 8px 10px;
  margin: 6px 8px;
  border: 1px solid #e6e6e6;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 2px 6px rgba(0,0,0,0.06);
}
.custom-header .btn {
  padding: 6px 10px;
  border: 1px solid #d0d0d0;
  border-radius: 6px;
  background: #f8f8f8;
  cursor: pointer;
}
.custom-header .btn:hover {
  background: #f0f4ff;
  border-color: #c5d2ff;
}
.custom-header .page-input {
  width: 80px;
  padding: 6px 8px;
  border: 1px solid #d0d0d0;
  border-radius: 6px;
  outline: none;
}
.custom-header .split {
  width: 1px;
  height: 20px;
  background: #e5e5e5;
  margin: 0 2px;
}
</style>
