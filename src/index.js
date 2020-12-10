import packageName from 'depcheck-package-name'
import execa from 'execa'
import { copyFile, exists } from 'fs-extra'
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
    const indexesExists = exists('firestore.indexes.json') |> await
    const rulesExists = exists('firestore.rules') |> await
    await outputFiles({
      '.eslintrc.json': `${JSON.stringify(
        {
          extends: packageName`@dword-design/eslint-config`,
        },
        undefined,
        2
      )}\n`,
      'firebase.json': `${JSON.stringify(
        {
          ...((indexesExists || rulesExists) && {
            firestore: {
              ...(indexesExists && { indexes: 'firestore.indexes.json' }),
              ...(rulesExists && { rules: 'firestore.rules' }),
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
