import execa from 'execa'
import { copyFile, exists } from 'fs-extra'
import getPackageName from 'get-package-name'
import outputFiles from 'output-files'
import P from 'path'

import lint from './lint'
import prepublishOnly from './prepublish-only'

export default {
  allowedMatches: [
    'functions',
    '.firebaserc',
    'firebase.json',
    'firestore.indexes.json',
    'firestore.rules',
    'storage.rules',
  ],
  commands: {
    deploy: () => execa.command('firebase deploy', { stdio: 'inherit' }),
    prepublishOnly,
  },
  editorIgnore: [
    '.babelrc.json',
    '.eslintrc.json',
    'functions/.babelrc.json',
    'functions/dist',
    'functions/node_modules',
    'functions/yarn.lock',
    'firebase.json',
  ],
  gitignore: [
    '/.babelrc.json',
    '/.eslintrc.json',
    '/functions/.babelrc.json',
    '/functions/dist',
    '/functions/node_modules',
    '/firebase.json',
  ],
  lint,
  nodeVersion: 10,
  prepare: async () => {
    await execa.command('yarn', { cwd: 'functions' })
    await copyFile('.babelrc.json', P.join('functions', '.babelrc.json'))
    await outputFiles({
      '.eslintrc.json': `${JSON.stringify(
        {
          extends: getPackageName(
            require.resolve('@dword-design/eslint-config')
          ),
        },
        undefined,
        2
      )}\n`,
      'firebase.json': `${JSON.stringify(
        {
          ...((exists('firestore.indexes.json') |> await) && {
            firestore: {
              indexes: 'firestore.indexes.json',
              rules: 'firestore.rules',
            },
          }),
          ...((exists('functions') |> await) && {
            functions: {
              predeploy: ['yarn prepublishOnly'],
            },
          }),
          ...((exists('public') |> await) && {
            hosting: {
              ignore: ['firebase.json', '**/.*', '**/node_modules/**'],
              public: 'public',
            },
          }),
          ...((exists('storage.rules') |> await) && {
            storage: {
              rules: 'storage.rules',
            },
          }),
        },
        undefined,
        2
      )}\n`,
    })
  },
}
