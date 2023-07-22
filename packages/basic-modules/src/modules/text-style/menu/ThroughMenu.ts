/**
 * @description through menu
 * @author wangfupeng
 */

import { t } from '@w3cways-editor/core'
import BaseMenu from './BaseMenu'
import { THROUGH_SVG } from '../../../constants/icon-svg'

class ThroughMenu extends BaseMenu {
  readonly mark = 'through'
  readonly title = t('textStyle.through')
  readonly iconSvg = THROUGH_SVG
  readonly hotkey = 'mod+shift+x'
}

export default ThroughMenu
