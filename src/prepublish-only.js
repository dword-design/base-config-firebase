import packageName from 'depcheck-package-name'
import { execaCommand } from 'execa'
import { remove } from 'fs-extra'

import lint from './lint.js'

export default async options => {
  options = { log: true, ...options }
  await lint()
  await remove('dist')
  await execaCommand(
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
