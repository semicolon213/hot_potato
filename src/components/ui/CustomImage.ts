import Image from '@tiptap/extension-image';

export const CustomImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        parseHTML: element => element.getAttribute('width'),
        renderHTML: attributes => ({
          width: attributes.width,
        }),
      },
    };
  },
});
