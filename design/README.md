# Design source of truth

`index.html` is the finished landing page, and it is the reference for the
whole product — palette, type, card language, copy tone.

It is kept here so the port can be diffed against it:

- the tokens in its `:root` are the `@theme` block in `src/app/globals.css`
- its stylesheet is `src/styles/field-guide.css`, ported class for class
- its markup is `src/components/landing/`, rendered by `src/app/page.tsx`

Change this file only when the design itself changes, and carry the change
through to the three places above. Do not let the app drift from it.
