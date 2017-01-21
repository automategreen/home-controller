module.exports = {
    "env": {
        "commonjs": true,
        "node": true,
        "es6": false
    },
    "extends": "eslint:recommended",
    "installedESLint": true,
    "parserOptions": {
        "ecmaVersion": 5,
        "ecmaFeatures": {
        },
        "sourceType": "module"
    },
    "rules": {
        "indent": [
            "error",
            2
        ],
        "linebreak-style": [
            "error",
            "unix"
        ],
        "semi": "error",
    },
    "globals": {
        "process": true,
    }
};
