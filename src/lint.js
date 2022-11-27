import { execaCommand } from 'execa'

export default async () => {
  try {
    await execaCommand(
      'eslint --fix --ext .js,.json --ignore-path .gitignore .',
      { all: true }
    )
  } catch (error) {
    throw new Error(error.all)
  }
}
