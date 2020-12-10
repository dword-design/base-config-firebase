import packageName from 'depcheck-package-name'
import execa from 'execa'
import { remove } from 'fs-extra'

import lint from './lint'

export default async options => {
  options = { log: true, ...options }
  await lint()
  await remove('dist')
  await execa(
    'babel',
    [
      '--config-file',
      packageName`@dword-design/babel-config`,
      '--out-dir',
      'dist',
      '--copy-files',
      '--no-copy-ignored',
      '--ignore',
      '**/*.spec.js',
      '--verbose',
      'src',
    ],
    { cwd: 'functions', stdio: options.log ? 'inherit' : 'pipe' }
  )
}
