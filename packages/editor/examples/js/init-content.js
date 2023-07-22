/**
 * @description demo 页，初始化内容
 * @author wangfupeng
 */

window.content1 = [
  {
    type: 'paragraph',
    children: [
      { text: '一行文字' },
      {
        type: 'image',
        src: 'https://www.baidu.com/img/flexible/logo/pc/result@2.png',
        alt: '百度',
        url: 'https://www.baidu.com/',
        style: { width: '101px', height: '33px' },
        children: [{ text: '' }], // void node 要有一个空 text
      },
      { text: '一行文字' },
    ],
  },
]
