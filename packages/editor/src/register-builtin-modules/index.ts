/**
 * @description register builtin modules
 * @author wangfupeng
 */

// basic-modules
import '@wangeditor/basic-modules/dist/css/style.css'
import basicModules from '@wangeditor/basic-modules'

import registerModule from './register'

basicModules.forEach(module => registerModule(module))
