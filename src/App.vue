<template>
  <div id="app">
    <header class="nav">
      <router-link to="/">vue-pdf-embed管理页(完整)</router-link>
      <router-link to="/pdfvuer">pdfvuer 测试页</router-link>
      <router-link to="/vuepdf">vue-pdf 示例</router-link>
      <!-- <router-link to="/embed">vue-pdf-embed 测试</router-link> -->
      <router-link to="/pdfjs">pdf.js 示例</router-link>
      <router-link to="/pdfapp">vue-pdf-app 示例</router-link>
      <router-link to="/viewerjs">ViewerJS 页面</router-link>
    </header>
    <main class="main">
      <router-view />
    </main>
  </div>
</template>

<script>
export default {
  name: 'App'
}
 </script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
}
.nav {
  display: flex;
  gap: 16px;
  padding: 12px 16px;
  border-bottom: 1px solid #eee;
  background: #fafafa;
}
.nav a {
  text-decoration: none;
  color: #1569ff;
}
.main {
  padding: 8px 12px;
}
</style>
