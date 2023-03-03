import { defineConfig } from 'astro/config';
import { visit } from 'unist-util-visit'
import md5 from 'md5';

import { SITE_URL } from './src/consts';


function pipeline() {
  return [

    () => (tree) => {
      visit(tree, 'element', (node, index) => {
        if (node.tagName === 'p' && node.children[0].tagName === 'img') {
          node.tagName = 'figure';
          
          let img = node.children[0];
          let sign = md5(img.properties.src);
          let data = img.properties.alt.split("|");
          let alt = data[0];
          let size = "big";
          if (data.length > 1) {
            size = data[1];
          }

          let classes = ['image component image-fullbleed body-copy-wide nr-scroll-animation nr-scroll-animation--on'];
          classes.push(`image-${size}`);

          node.properties.className = classes;
          node.children = [
            {
              type: 'element',
              tagName: 'div',
              properties: { className: ['component-content'] },
              children: [
                {
                  type: 'element',
                  tagName: 'div',
                  properties: { className: ['image-sharesheet'] },
                  children: [
                    {
                      type: 'element',
                      tagName: 'div',
                      properties: { className: [`image image-load image-asset image-${sign}`], id: `lht${sign}` },
                      children: [
                        {
                          type: 'element',
                          tagName: 'picture',
                          properties: { className: ['picture'] },
                          children: [
                            {
                              type: 'element',
                              tagName: 'img',
                              properties: {
                                'data-src': img.properties.src,
                                alt: alt,
                                className: ['picture-image'],
                              }
                            }
                          ]
                        }
                      ]
                    }
                  ]
                },
                {
                  type: 'element',
                  tagName: 'div',
                  properties: { className: ['image-description'] },
                  children: [
                    {
                      type: 'element',
                      tagName: 'div',
                      properties: { className: ['image-caption'] },
                      children: [
                        {
                          type: 'text',
                          value: alt
                        }
                      ]
                    }
                  ]
                }
              ]
            }
          ]
        }
      })
    },

    () => (tree) => {
      tree.children.forEach((node) => {
        if (node.type === "raw") {
          node.value = `<div class="pagebody code component"><div class="component-content code"> ${node.value} </div></div>`
          // node.value = node.value.replace(/astro-code/g, 'astro-code')
        }
      });
    },


    () => (tree) => {
      for (let i = 0; i < tree.children.length; i++) {
        let node = tree.children[i];
        if (node.type === "element" && ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', "ul", "ol"].includes(node.tagName)) {

          let next = tree.children[i + 1];
          let nodes = [node];
          while (next && !['figure'].includes(next.tagName) && next.type != "raw") {

            nodes.push(next);
            next = tree.children[tree.children.indexOf(next) + 1];
          }

          if (nodes.length > 1) {
            // rename label
            nodes.forEach((node) => {
              if (node.tagName === "p") {
                node.properties.className = ['pagebody-copy'];
                node.tagName = "div";
              }
              if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(node.tagName)) {
                node.properties.className = ['pagebody-header'];
              }
            });

            tree.children.splice(i, nodes.length, {
              type: 'element',
              tagName: 'div',
              properties: { className: ['pagebody  text component'] },
              children: [
                {
                  type: 'element',
                  tagName: 'div',
                  properties: { className: ['component-content'] },
                  children: nodes
                }
              ]
            });

          }
        }
      }
    },
    () => (tree) => {
      let len = tree.children.length;
      for (let index = 0; index < len; index++) {
        let node = tree.children[index];
        if (node.type === "element" && node.tagName === "figure") {
          tree.children.splice(index, 0, {
            type: 'element',
            tagName: 'div',
            properties: { className: ['tertiarynav component'] },
            children: [{
              type: 'element',
              tagName: 'div',
              properties: { className: ['component-content'] },
            }]
          })
          index++;
        }
      }
    }
  ]
}



// https://astro.build/config
export default defineConfig({
  site: SITE_URL,
  markdown: {
    rehypePlugins: pipeline(),
    syntaxHighlight: 'prism',
  },
});
