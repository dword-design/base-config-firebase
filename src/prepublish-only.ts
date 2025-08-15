import pathLib from 'node:path';

import type { Base, PartialCommandOptions } from '@dword-design/base';
import { execaCommand } from 'execa';
import fs from 'fs-extra';

import resolveAliases from './resolve-aliases';

export default async function (
  this: Base,
  options: PartialCommandOptions = {},
) {
  options = {
    log: process.env.NODE_ENV !== 'test',
    stderr: 'inherit',
    ...options,
  };

  await this.lint(options);

  if (await fs.exists(pathLib.join(this.cwd, 'functions'))) {
    const result = execaCommand(
      'mkdist --declaration --ext=js --pattern=** --pattern=!**/*.spec.ts --pattern=!**/*-snapshots',
      {
        ...(options.log && { stdout: 'inherit' }),
        cwd: pathLib.join(this.cwd, 'functions'),
        stderr: options.stderr,
      },
    );

    await resolveAliases({ cwd: this.cwd });
    return result;
  }
}
