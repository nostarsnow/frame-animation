import Vue from 'vue'
import {
  Button,
  Radio,
  RadioGroup,
  Message,
  Form,
  FormItem,
  Notification,
  Tag,
  InputNumber,
  Switch,
  Input,
  Tooltip,
} from 'element-ui'
import VueClipboard from 'vue-clipboard2'
Vue.use(VueClipboard)

import VueHighlightJS from './code/highlight'
import "highlight.js/styles/vs2015.css"
Vue.use(VueHighlightJS)

import App from './App'
Vue.config.productionTip = false

Vue.useAll = function(...arg){
  for (let com of arg) {
    Vue.use(com)
  }
}


let prototype = Vue.prototype
Vue.useAll(Button,Radio,RadioGroup,Form,FormItem,Tag,InputNumber,Switch,Input,Tooltip)
prototype.$msg = Message
prototype.$notify = Notification

Vue.prototype.$download = function(content, name, isContent) {
  let a = document.createElement('a')
  a.download = name
  if (isContent) {
    let blob = new Blob([content])
    a.href = window.URL.createObjectURL(blob)
  } else {
    a.href = content
  }
  a.click()
}

/* eslint-disable no-new */
new Vue({
  render: h => h(App)
}).$mount('#app')
