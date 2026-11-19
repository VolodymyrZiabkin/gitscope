import fsd from '@feature-sliced/steiger-plugin';
import { defineConfig } from 'steiger';

export default defineConfig([
  ...fsd.configs.recommended,
  {
    // `insignificant-slice` asks to merge slices referenced only once. FSD explicitly allows a widget for a large,
    // self-sufficient block of a single page (https://feature-sliced.design/docs/reference/layers#widgets), and the
    // dashboard is made of such blocks. Steiger also does not see Next.js routes in `app/`, so the site header and
    // the pages look unused. Scoping the rule to some layers hides their references from the others, so it is off.
    rules: { 'fsd/insignificant-slice': 'off' },
  },
]);
