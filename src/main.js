import Vue from 'vue'
import App from './App.vue'

import '@/scss/index.scss'
import 'bootstrap'
import VueRouter from 'vue-router'
import Axios from 'axios'
import VueAxios from 'vue-axios'
import Element from 'element-ui'
import './scss/element-variables.scss'
import enLang from 'element-ui/lib/locale/lang/en'// 如果使用中文语言包请默认支持，无需额外引入，请删除该依赖

Vue.use(VueAxios, Axios);
Vue.use(Element, {
    locale: enLang // 如果使用中文，无需设置，请删除
})
Vue.use(VueRouter)
import router from '@/router'

Vue.config.productionTip = false
import AOS from "aos";
import "../node_modules/aos/dist/aos.css";

Vue.use(AOS);
AOS.init()
new Vue({
    render: h => h(App),
    router
}).$mount('#app')
