/**
 * @description register builtin modules
 * @author wangfupeng
 */

// basic-modules
import '@w3cways-editor/basic-modules/dist/css/style.css'
import basicModules from '@w3cways-editor/basic-modules'

import registerModule from './register'

basicModules.forEach(module => registerModule(module))
