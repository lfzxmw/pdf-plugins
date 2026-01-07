import Vue from 'vue'
import Router from 'vue-router'
Vue.use(Router)

export default new Router({
  mode: 'hash',
  routes: [
    { path: '/', name: 'manager', component: () => import('@/components/HelloWorld.vue') },
    { path: '/pdfvuer', name: 'pdfvuer', component: () => import('@/components/PdfvuerTest.vue') },
    { path: '/embed', name: 'embed', component: () => import('@/components/vue-pdf-embed') },
    { path: '/vuepdf', name: 'vuepdf', component: () => import('@/components/VuePdfDemo.vue') },
    { path: '/pdfjs', name: 'pdfjs', component: () => import('@/components/PdfjsDemo.vue') },
    { path: '/pdfapp', name: 'pdfapp', component: () => import('@/components/VuePdfAppDemo.vue') },
    { path: '/viewerjs', name: 'viewerjs', component: () => import('@/components/ViewerJS.vue') }
  ]
})
