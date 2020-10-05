export const ie11polyfills = [
  'core-js/es/symbol',
  'core-js/es/object',
  'core-js/es/function',
  'core-js/es/parse-int',
  'core-js/es/parse-float',
  'core-js/es/number',
  'core-js/es/math',
  'core-js/es/string',
  'core-js/es/date',
  'core-js/es/array',
  'core-js/es/regexp',
  'core-js/es/map',
  'core-js/es/weak-map',
  'core-js/es/set',
  'classlist.js',
  'whatwg-fetch'
];

export const ie11polyfillPackages = 
  {
    'classlist.js': '~1.1.20150312',
    'whatwg-fetch': '3.4.1'
  } as {[key: string]: string}
;