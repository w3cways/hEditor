/**
 * @description textarea event handlers entry
 * @author wangfupeng
 */
import { Editor, Transforms, Range, Node, Element } from 'slate'
import { DomEditor } from '../../editor/dom-editor'
import { IDomEditor } from '../../editor/interface'
import TextArea from '../TextArea'
import { hasEditableTarget, isDOMEventHandled } from '../helpers'
import { DOMStaticRange, DOMText } from '../../utils/dom'
import { HAS_BEFORE_INPUT_SUPPORT } from '../../utils/ua'
import { EDITOR_TO_CAN_PASTE, EDITOR_TO_USER_SELECTION } from '../../utils/weak-maps'

import handleBeforeInput from './beforeInput'
import handleOnBlur from './blur'
import handleOnFocus from './focus'
import handleOnClick from './click'
import {
  handleCompositionStart,
  handleCompositionEnd,
  handleCompositionUpdate,
} from './composition'
import handleOnKeydown from './keydown'
import handleKeypress from './keypress'
import handleOnCopy from './copy'
import handleOnCut from './cut'
import handleOnPaste from './paste'
import { handleOnDragover, handleOnDragstart, handleOnDragend } from './drag'
import handleOnDrop from './drop'

const eventConf = {
  beforeinput: handleBeforeInput,
  input: (e: Event, textarea: TextArea, editor: IDomEditor) => {
    for (const op of textarea.deferredOperations) {
      op()
    }
    textarea.deferredOperations = []
  },
  blur: handleOnBlur,
  focus: handleOnFocus,
  click: handleOnClick,
  compositionstart: handleCompositionStart,
  compositionend: handleCompositionEnd,
  compositionupdate: handleCompositionUpdate,
  keydown: handleOnKeydown,
  keypress: handleKeypress,
  copy: handleOnCopy,
  cut: handleOnCut,
  paste: handleOnPaste,
  dragover: handleOnDragover,
  dragstart: handleOnDragstart,
  dragend: handleOnDragend,
  drop: handleOnDrop,
}

export default eventConf
