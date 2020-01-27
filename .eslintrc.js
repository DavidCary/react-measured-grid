const isStrict = false;

module.exports = {
    "parser": "babel-eslint",
       
    "env": {
        "browser": true,
        "es6": true,
        "node": true
    },
    "extends": [
        "eslint:recommended",
        "plugin:react/recommended",
        "plugin:flowtype/recommended",
    ],
    "globals": {
        "Atomics": "readonly",
        "SharedArrayBuffer": "readonly"
    },
    "parserOptions": {
        "ecmaFeatures": {
            "jsx": true
        },
        "ecmaVersion": 2018,
        "sourceType": "module"
    },
    "plugins": [
        "react",
        "flowtype"
    ],
    "rules": {
      "flowtype/boolean-style": [
        2,
        "boolean"
      ],
      "flowtype/define-flow-type": 1,
      "flowtype/delimiter-dangle": [
        2,
        isStrict ? "never" : "only-multiline"
      ],
      "flowtype/generic-spacing": [
        2,
        "never"
      ],
      "flowtype/no-mixed": isStrict ? 2 : 0,
      "flowtype/no-primitive-constructor-types": 2,
      "flowtype/no-types-missing-file-annotation": 2,
      "flowtype/no-weak-types": isStrict ? 2 : 0,
      "flowtype/object-type-delimiter": [
        2,
        "comma"
      ],
      "flowtype/require-parameter-type": 2,
      "flowtype/require-readonly-react-props": 0,
      "flowtype/require-return-type": [
        2,
        "always",
        {
          "annotateUndefined": "never"
        }
      ],
      "flowtype/require-valid-file-annotation": 2,
      "flowtype/semi": [
        2,
        "always"
      ],
      "flowtype/space-after-type-colon": [
        2,
        "always"
      ],
      "flowtype/space-before-generic-bracket": [
        2,
        "never"
      ],
      "flowtype/space-before-type-colon": [
        2,
        "never"
      ],
      "flowtype/type-id-match": [
        0,  // default was 2
        "^([A-Z][a-z0-9]+)+Type$"
      ],
      "flowtype/union-intersection-spacing": [
        2,
        "always"
      ],
      "flowtype/use-flow-type": 1,
      "flowtype/valid-syntax": 1
    },
    "settings": {
      "flowtype": {
        "onlyFilesWithFlowAnnotation": true // default was false
      },
      "react": {
        "version": "detect"
      }
    }
};
