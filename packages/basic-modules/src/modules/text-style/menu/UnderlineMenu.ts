/**
 * @description underline menu
 * @author wangfupeng
 */

import { t } from '@w3cways-editor/core'
import BaseMenu from './BaseMenu'
import { UNDER_LINE_SVG } from '../../../constants/icon-svg'

class UnderlineMenu extends BaseMenu {
  readonly mark = 'underline'
  readonly title = t('textStyle.underline')
  readonly iconSvg = UNDER_LINE_SVG
  readonly hotkey = 'mod+u'
}

export default UnderlineMenu
