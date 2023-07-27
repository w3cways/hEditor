/**
 * @description 处理 beforeInput 事件
 * @author wangfupeng
 */

import { Editor, Transforms, Range, Node, Element } from 'slate'
import { DomEditor } from '../../editor/dom-editor'
import { IDomEditor } from '../../editor/interface'
import TextArea from '../TextArea'
import { hasEditableTarget, isDOMEventHandled, handleSelectedVoidElement } from '../helpers'
import { DOMStaticRange, DOMText } from '../../utils/dom'
import { HAS_BEFORE_INPUT_SUPPORT } from '../../utils/ua'
import { EDITOR_TO_CAN_PASTE, EDITOR_TO_USER_SELECTION } from '../../utils/weak-maps'

// 补充 beforeInput event 的属性
interface BeforeInputEventType {
  data: string | null
  dataTransfer: DataTransfer | null
  getTargetRanges(): DOMStaticRange[]
  inputType: string
  isComposing: boolean
}

function handleBeforeInput(e: Event, textarea: TextArea, editor: IDomEditor) {
  const event = e as Event & BeforeInputEventType
  const { readOnly } = editor.getConfig()

  if (!HAS_BEFORE_INPUT_SUPPORT) return // 有些浏览器完全不支持 beforeInput ，会用 keypress 和 keydown 兼容
  if (readOnly) return
  if (isDOMEventHandled(event)) return
  if (!hasEditableTarget(editor, event.target)) return

  const { selection } = editor
  const { inputType: type } = event
  const data = event.dataTransfer || event.data || undefined

  // These two types occur while a user is composing text and can't be
  // cancelled. Let them through and wait for the composition to end.

  const isCompositionChange = type === 'insertCompositionText' || type === 'deleteCompositionText'
  if (isCompositionChange && textarea.isComposing) {
    return
  }

  let native = false
  if (
    type === 'insertText' &&
    selection &&
    Range.isCollapsed(selection) &&
    // Only use native character insertion for single characters a-z or space for now.
    // Long-press events (hold a + press 4 = ä) to choose a special character otherwise
    // causes duplicate inserts.
    event.data &&
    event.data.length === 1 &&
    /[a-z ]/i.test(event.data) &&
    // Chrome has issues correctly editing the start of nodes: https://bugs.chromium.org/p/chromium/issues/detail?id=1249405
    // When there is an inline element, e.g. a link, and you select
    // right after it (the start of the next node).
    selection.anchor.offset !== 0
  ) {
    native = true

    // Skip native if there are marks, as
    // `insertText` will insert a node, not just text.
    if (editor.marks) {
      native = false
    }

    // Chrome also has issues correctly editing the end of anchor elements: https://bugs.chromium.org/p/chromium/issues/detail?id=1259100
    // Therefore we don't allow native events to insert text at the end of anchor nodes.
    const { anchor } = selection

    const [node, offset] = DomEditor.toDOMPoint(editor, anchor)
    const anchorNode = node.parentElement?.closest('a')

    const window = DomEditor.getWindow(editor)

    if (native && anchorNode && DomEditor.hasDOMNode(editor, anchorNode)) {
      // Find the last text node inside the anchor.
      const lastText = window?.document
        .createTreeWalker(anchorNode, NodeFilter.SHOW_TEXT)
        .lastChild() as DOMText | null

      if (lastText === node && lastText.textContent?.length === offset) {
        native = false
      }
    }

    // Chrome has issues with the presence of tab characters inside elements with whiteSpace = 'pre'
    // causing abnormal insert behavior: https://bugs.chromium.org/p/chromium/issues/detail?id=1219139
    if (
      native &&
      node.parentElement &&
      window?.getComputedStyle(node.parentElement)?.whiteSpace === 'pre'
    ) {
      const block = Editor.above(editor, {
        at: anchor.path,
        match: n => Element.isElement(n) && Editor.isBlock(editor, n),
      })

      if (block && Node.string(block[0]).includes('\t')) {
        native = false
      }
    }
  }

  // COMPAT: For the deleting forward/backward input types we don't want
  // to change the selection because it is the range that will be deleted,
  // and those commands determine that for themselves.
  if (!type.startsWith('delete') || type.startsWith('deleteBy')) {
    const [targetRange] = (event as any).getTargetRanges()

    if (targetRange) {
      const range = DomEditor.toSlateRange(editor, targetRange, {
        exactMatch: false,
        suppressThrow: false,
      })

      if (!selection || !Range.equals(selection, range)) {
        native = false

        const selectionRef =
          !isCompositionChange && editor.selection && Editor.rangeRef(editor, editor.selection)

        Transforms.select(editor, range)

        if (selectionRef) {
          EDITOR_TO_USER_SELECTION.set(editor, selectionRef)
        }
      }
    }
  }

  // Composition change types occur while a user is composing text and can't be
  // cancelled. Let them through and wait for the composition to end.
  if (isCompositionChange) {
    return
  }

  if (!native) {
    event.preventDefault()
  }

  // COMPAT: If the selection is expanded, even if the command seems like
  // a delete forward/backward command it should delete the selection.
  if (selection && Range.isExpanded(selection) && type.startsWith('delete')) {
    const direction = type.endsWith('Backward') ? 'backward' : 'forward'
    Editor.deleteFragment(editor, { direction })
    return
  }

  // 根据 beforeInput 的 event.inputType
  switch (type) {
    case 'deleteByComposition':
    case 'deleteByCut':
    case 'deleteByDrag': {
      Editor.deleteFragment(editor)
      break
    }

    case 'deleteContent':
    case 'deleteContentForward': {
      Editor.deleteForward(editor)
      break
    }

    case 'deleteContentBackward': {
      Editor.deleteBackward(editor)
      break
    }

    case 'deleteEntireSoftLine': {
      Editor.deleteBackward(editor, { unit: 'line' })
      Editor.deleteForward(editor, { unit: 'line' })
      break
    }

    case 'deleteHardLineBackward': {
      Editor.deleteBackward(editor, { unit: 'block' })
      break
    }

    case 'deleteSoftLineBackward': {
      Editor.deleteBackward(editor, { unit: 'line' })
      break
    }

    case 'deleteHardLineForward': {
      Editor.deleteForward(editor, { unit: 'block' })
      break
    }

    case 'deleteSoftLineForward': {
      Editor.deleteForward(editor, { unit: 'line' })
      break
    }

    case 'deleteWordBackward': {
      Editor.deleteBackward(editor, { unit: 'word' })
      break
    }

    case 'deleteWordForward': {
      Editor.deleteForward(editor, { unit: 'word' })
      break
    }

    case 'insertLineBreak':
    case 'insertParagraph': {
      Editor.insertBreak(editor)
      break
    }

    case 'insertFromDrop':
    case 'insertFromPaste':
    case 'insertFromYank':
    case 'insertReplacementText':
    case 'insertText': {
      if (type === 'insertFromPaste') {
        if (!EDITOR_TO_CAN_PASTE.get(editor)) break // 不可默认粘贴
      }

      if (data instanceof DataTransfer) {
        // 这里处理非纯文本（如 html 图片文件等）的粘贴。对于纯文本的粘贴，使用 paste 事件
        editor.insertData(data)
      } else if (typeof data === 'string') {
        if (native) {
          textarea.deferredOperations.push(() => Editor.insertText(editor, data))
        } else {
          if (selection) {
            handleSelectedVoidElement(editor, selection)
          }

          Editor.insertText(editor, data)
        }
      }
      break
    }
  }

  // Restore the actual user section if nothing manually set it.
  const toRestore = EDITOR_TO_USER_SELECTION.get(editor)?.unref()
  EDITOR_TO_USER_SELECTION.delete(editor)

  if (toRestore && (!editor.selection || !Range.equals(editor.selection, toRestore))) {
    Transforms.select(editor, toRestore)
  }
}

export default handleBeforeInput
