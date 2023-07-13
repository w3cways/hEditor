/**
 * @description set default config
 * @author wangfupeng
 */

import Boot from '../Boot'
import {
  getDefaultEditorConfig,
  getDefaultToolbarConfig,
  getSimpleEditorConfig,
  getSimpleToolbarConfig,
} from './config'

const defaultEditorConfig = getDefaultEditorConfig()
Boot.setEditorConfig({
  ...defaultEditorConfig,
})

const simpleEditorConfig = getSimpleEditorConfig()
Boot.setSimpleEditorConfig({
  ...simpleEditorConfig,
})

const defaultToolbarConfig = getDefaultToolbarConfig()
Boot.setToolbarConfig(defaultToolbarConfig)

const simpleToolbarConfig = getSimpleToolbarConfig()
Boot.setSimpleToolbarConfig(simpleToolbarConfig)
