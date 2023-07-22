/**
 * @description 监听 composition 事件
 * @author wangfupeng
 */

import { Editor, Range, Element, Transforms, Path, Node } from 'slate'
import { IDomEditor } from '../../editor/interface'
import { DomEditor } from '../../editor/dom-editor'
import TextArea from '../TextArea'
import { hasEditableTarget } from '../helpers'
import { IS_SAFARI, IS_CHROME, IS_FIREFOX } from '../../utils/ua'
import { DOMNode } from '../../utils/dom'
import { hidePlaceholder } from '../place-holder'
import { editorSelectionToDOM } from '../syncSelection'
import { EDITOR_TO_PENDING_INSERTION_MARKS, EDITOR_TO_USER_MARKS } from '../../utils/weak-maps'

const EDITOR_TO_TEXT: WeakMap<IDomEditor, string> = new WeakMap()
const EDITOR_TO_START_CONTAINER: WeakMap<IDomEditor, DOMNode> = new WeakMap()

function checkPrevNode(editor: IDomEditor, selection: Range) {
  const curNode = Node.get(editor, selection.anchor.path) //当前选取的node
  const fragments = editor.getFragment()
  const [start] = Range.edges(selection)
  const startPath = start.path
  if (!!startPath[0] || !!startPath[1]) {
    const parentNode = Node.parent(editor, startPath)
    if (parentNode.children.length > 1) {
      //父节点存在，且子元素大于1
      const previousPath = Path.previous(startPath)

      // 获取上一个节点
      const prevNode = Node.get(editor, previousPath) //当前选取的node的上一个节点

      if (
        prevNode &&
        Editor.isVoid(editor, prevNode) &&
        Editor.isInline(editor, prevNode) &&
        selection.focus.offset === 0
      ) {
        //上个节点是inline 且是void,且选区超过2行,且当前selection的起点位置为0
        return true
      }
      return false
    }
  }

  return false
}

/**
 * composition start 事件
 * @param e event
 * @param textarea textarea
 * @param editor editor
 */
export function handleCompositionStart(
  e: CompositionEvent,
  textarea: TextArea,
  editor: IDomEditor
) {
  if (DomEditor.hasSelectableTarget(editor, e.target)) {
    textarea.isComposing = true

    const { selection } = editor
    if (selection) {
      if (Range.isExpanded(selection) || !e.data) {
        //加!e.data判断是因为首次选择文字节点，且前面是inline&void节点做了特殊处理，第2次再触发时Range.isExpanded(selection) === false
        const flag = checkPrevNode(editor, selection)
        if (flag) {
          Editor.insertText(editor, ' ')
          textarea.hasTempSelection = true
        }
        Editor.deleteFragment(editor)
        Promise.resolve().then(() => {
          // deleteFragment 会在一个 Promise 后更新 dom，导致浏览器选区不正确
          // 因此这里延迟一下再设置选区，使选区在正确位置
          // 这里 model 选区没有发生变化，不能使用 editor.restoreSelection
          // restoreSelection 会对比前后 model 选区是否相同，相同就不更新了
          editorSelectionToDOM(textarea, editor, true)
        })

        return
      }
      const inline = Editor.above(editor, {
        match: n => Element.isElement(n) && Editor.isInline(editor, n),
        mode: 'highest',
      })
      if (inline) {
        const [, inlinePath] = inline
        if (Editor.isEnd(editor, selection.anchor, inlinePath)) {
          const point = Editor.after(editor, inlinePath)!
          Transforms.setSelection(editor, {
            anchor: point,
            focus: point,
          })
        }
      }
    }
  }
}

/**
 * composition update 事件
 * @param e event
 * @param textarea textarea
 * @param editor editor
 */
export function handleCompositionUpdate(event: Event, textarea: TextArea, editor: IDomEditor) {
  if (!hasEditableTarget(editor, event.target)) return

  textarea.isComposing = true
}

/**
 * composition end 事件
 * @param e event
 * @param textarea textarea
 * @param editor editor
 */
export function handleCompositionEnd(
  event: CompositionEvent,
  textarea: TextArea,
  editor: IDomEditor
) {
  if (DomEditor.hasSelectableTarget(editor, event.target)) {
    if (textarea.isComposing) {
      textarea.isComposing = false
    }

    if (textarea.hasTempSelection) {
      Editor.deleteBackward(editor)
      textarea.hasTempSelection = false
    }

    // COMPAT: In Chrome, `beforeinput` events for compositions
    // aren't correct and never fire the "insertFromComposition"
    // type that we need. So instead, insert whenever a composition
    // ends since it will already have been committed to the DOM.
    if (IS_CHROME && event.data) {
      const placeholderMarks = EDITOR_TO_PENDING_INSERTION_MARKS.get(editor)
      EDITOR_TO_PENDING_INSERTION_MARKS.delete(editor)

      // Ensure we insert text with the marks the user was actually seeing
      if (placeholderMarks !== undefined) {
        EDITOR_TO_USER_MARKS.set(editor, editor.marks)
        editor.marks = placeholderMarks
      }

      Editor.insertText(editor, event.data)

      const userMarks = EDITOR_TO_USER_MARKS.get(editor)
      EDITOR_TO_USER_MARKS.delete(editor)
      if (userMarks !== undefined) {
        editor.marks = userMarks
      }
    }
  }
}
