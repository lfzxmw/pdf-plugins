<template>
  <div>
    <!-- 使用 pdf-embed 组件来嵌入 PDF -->
    <pdf-embed :src="pdfUrl" :page="currentPage" :scale="scale" />
    
    <!-- 分页控制 -->
    <div class="pagination">
      <button @click="goToPreviousPage">上一页</button>
      <button @click="goToNextPage">下一页</button>
    </div>
  </div>
</template>

<script>
import PdfEmbed from 'vue-pdf-embed';

export default {
  components: {
    PdfEmbed
  },
  data() {
    return {
      // PDF 文件的路径，可以是本地文件或外部 URL
      pdfUrl: 'path/to/your/pdf/file.pdf',
      
      // 当前页码，默认为第1页
      currentPage: 1,
      
      // 缩放比例
      scale: 1.0
    };
  },
  methods: {
    goToPreviousPage() {
      if (this.currentPage > 1) {
        this.currentPage--;
      }
    },
    goToNextPage() {
      this.currentPage++;
    }
  }
};
</script>

<style scoped>
.pagination {
  margin-top: 10px;
  text-align: center;
}

.pagination button {
  margin: 0 10px;
  padding: 5px 10px;
  cursor: pointer;
}
</style>
