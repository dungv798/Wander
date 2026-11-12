// Cấu hình ép chuẩn FE của Wander (docs/architecture/frontend-standards.md §9, PO duyệt G3 ngày 26/10/2026).
// Các con số của quy tắc nằm ở QUALITY để không rải số ma thuật ngay trong cấu hình.
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import jsdoc from 'eslint-plugin-jsdoc';
import boundaries from 'eslint-plugin-boundaries';
import globals from 'globals';

const QUALITY = { maxFunctionLines: 60, allowedNumbers: [0, 1, -1, 100] };

/** Loại phần tử kiến trúc: app → features → shared (chuẩn §1). */
const ELEMENTS = [
  { type: 'app', pattern: 'src/app/**' },
  { type: 'feature', pattern: 'src/features/*', capture: ['name'] },
  { type: 'shared', pattern: 'src/shared/**' },
];

export default tseslint.config(
  // spike/ là mã thử nghiệm không vào bản dựng (gồm bản vendor three.js): không lint (quy ước spike, ghi ở NOTES.md của từng spike).
  { ignores: ['dist', 'node_modules', 'scripts', 'spike', 'public', 'src/**/*.generated.ts'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: { globals: { ...globals.browser }, parserOptions: { ecmaFeatures: { jsx: true } } },
    plugins: { react, 'react-hooks': reactHooks, 'jsx-a11y': jsxA11y, jsdoc, boundaries },
    settings: { react: { version: 'detect' }, 'boundaries/elements': ELEMENTS },
    rules: {
      ...react.configs.recommended.rules,
      ...react.configs['jsx-runtime'].rules,
      ...reactHooks.configs.recommended.rules,
      ...jsxA11y.flatConfigs.recommended.rules,
      // §7: một khối TSDoc trước mọi hàm, phương thức, lớp, hook, thành phần.
      'jsdoc/require-jsdoc': ['error', {
        publicOnly: false,
        require: { FunctionDeclaration: true, MethodDefinition: true, ClassDeclaration: true, ArrowFunctionExpression: false, FunctionExpression: false },
        // hàm mũi tên gán cho biến/thuộc tính lớp, phương thức trong đối tượng, kiểu và giao diện: cũng phải có chú thích (hàm mũi tên truyền thẳng làm đối số/prop JSX thì không)
        contexts: [
          'VariableDeclaration:has(> VariableDeclarator > ArrowFunctionExpression)',
          'PropertyDefinition:has(> ArrowFunctionExpression)',
          'Property:has(> FunctionExpression)',
        ],
        checkConstructors: false,
        checkGetters: true,
        checkSetters: true,
      }],
      'jsdoc/require-description': 'error',
      'jsdoc/check-alignment': 'error',
      // §8: không số ma thuật, không chữ cứng trong JSX.
      'no-magic-numbers': ['error', { ignore: QUALITY.allowedNumbers, ignoreArrayIndexes: true, enforceConst: true }],
      'react/no-danger': 'error', // XSS: chỉ Icon.tsx được phép (nguồn là hằng tĩnh), có chú thích tắt riêng
      'react/jsx-no-literals': ['error', { noStrings: false, allowedStrings: ['·', '–', '—', '/', ':', '(', ')', '+', '×', '%'], ignoreProps: true }],
      // §1: kích thước hàm (PO bỏ giới hạn số dòng của TỆP ngày 09/11/2026: không còn `max-lines`).
      'max-lines-per-function': ['error', { max: QUALITY.maxFunctionLines, skipBlankLines: true, skipComments: true }],
      // §1: hướng phụ thuộc một chiều; tính năng khác chỉ qua index.ts.
      'boundaries/dependencies': ['error', {
        default: 'disallow',
        policies: [
          { from: { element: { type: 'app' } }, allow: { to: { element: { types: { anyOf: ['app', 'feature', 'shared'] } } } } },
          { from: { element: { type: 'feature' } }, allow: { to: { element: { types: { anyOf: ['shared'] } } } } },
          { from: { element: { type: 'feature' } }, allow: { to: { element: { type: 'feature', captured: { name: '{{ from.captured.name }}' } } } } },
          // tính năng khác chỉ qua cổng công khai `index.ts` của nó (chuẩn FE §1)
          { from: { element: { type: 'feature' } }, allow: { to: { element: { type: 'feature', internalPath: 'index.ts' } } } },
          { from: { element: { type: 'shared' } }, allow: { to: { element: { type: 'shared' } } } },
        ],
      }],
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { varsIgnorePattern: '^_', ignoreRestSiblings: true }],
    },
  },
  {
    // Tệp hằng số và kiểm thử định nghĩa/ép giá trị nên được phép dùng số và chữ trực tiếp.
    files: ['src/**/*.const.ts', 'src/**/*.copy.ts', 'src/**/*.test.ts', 'src/**/*.test.tsx'],
    rules: { 'no-magic-numbers': 'off', 'jsdoc/require-jsdoc': 'off', 'max-lines-per-function': 'off' },
  },
  {
    // Hình vẽ SVG: tọa độ hình học không phải "số ma thuật" nghiệp vụ.
    files: ['src/shared/ui/art/**'],
    rules: { 'no-magic-numbers': 'off', 'max-lines-per-function': 'off' },
  },
  { files: ['*.config.{js,ts}'], languageOptions: { globals: { ...globals.node } } },
  // Node-run helpers shared by the browser e2e scenarios (not bundled into the app).
  { files: ['e2e/support/**/*.mjs'], languageOptions: { globals: { ...globals.node } } },
);
