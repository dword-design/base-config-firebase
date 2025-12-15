import pathLib from 'node:path';

import { type Base, defineBaseConfig } from '@dword-design/base';
import { execaCommand } from 'execa';
import fs from 'fs-extra';

import prepublishOnly from './prepublish-only';

export default defineBaseConfig(function (this: Base) {
  return {
    allowedMatches: [
      'functions',
      '.firebaserc',
      'firebase.json',
      'firestore.indexes.json',
      'firestore.rules',
      'storage.rules',
    ],
    commands: {
      deploy(this: Base) {
        return execaCommand('firebase deploy', {
          cwd: this.cwd,
          stdio: 'inherit',
        });
      },
      prepublishOnly,
    },
    editorIgnore: [
      'functions/dist',
      'functions/node_modules',
      'functions/pnpm-lock.lock',
      'firebase.json',
    ],
    gitignore: ['/functions/dist', '/functions/node_modules', '/firebase.json'],
    isLockFileFixCommitType: true,
    prepare: async () => {
      const functionsExists = await fs.exists(
        pathLib.join(this.cwd, 'functions'),
      );

      if (functionsExists) {
        await fs.copyFile(
          pathLib.join(this.cwd, '.npmrc'),
          pathLib.join(this.cwd, 'functions', '.npmrc'),
        );

        await execaCommand('pnpm install', {
          cwd: pathLib.join(this.cwd, 'functions'),
        });

        await fs.copyFile(
          pathLib.join(this.cwd, 'tsconfig.json'),
          pathLib.join(this.cwd, 'functions', 'tsconfig.json'),
        );
      }

      const indexesExists = await fs.exists(
        pathLib.join(this.cwd, 'firestore.indexes.json'),
      );

      const rulesExists = await fs.exists(
        pathLib.join(this.cwd, 'firestore.rules'),
      );

      await fs.outputFile(
        pathLib.join(this.cwd, 'firebase.json'),
        `${JSON.stringify(
          {
            ...((indexesExists || rulesExists) && {
              firestore: {
                ...(indexesExists && { indexes: 'firestore.indexes.json' }),
                ...(rulesExists && { rules: 'firestore.rules' }),
              },
            }),
            ...(functionsExists && {
              functions: { predeploy: ['pnpm prepublishOnly'] },
            }),
            ...((await fs.exists(pathLib.join(this.cwd, 'public'))) && {
              hosting: {
                ignore: ['firebase.json', '**/.*', '**/node_modules/**'],
                public: 'public',
              },
            }),
            ...((await fs.exists(pathLib.join(this.cwd, 'storage.rules'))) && {
              storage: { rules: 'storage.rules' },
            }),
          },
          undefined,
          2,
        )}\n`,
      );
    },
  };
});
