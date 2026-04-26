import { spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const args = process.argv.slice(2)

if (args.length === 0) {
  console.error('Usage: node scripts/run-with-env.mjs <command> [...args]')
  process.exit(1)
}

const repoRoot = path.resolve(import.meta.dirname, '..')
const workingDirectory = process.cwd()

const envFiles = [path.join(repoRoot, '.env'), path.join(workingDirectory, '.env')]

function parseEnvFile(contents) {
  const parsed = {}

  for (const rawLine of contents.split(/\r?\n/u)) {
    const line = rawLine.trim()

    if (!line || line.startsWith('#')) {
      continue
    }

    const separatorIndex = line.indexOf('=')

    if (separatorIndex === -1) {
      continue
    }

    const key = line.slice(0, separatorIndex).trim()
    let value = line.slice(separatorIndex + 1).trim()

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }

    parsed[key] = value
  }

  return parsed
}

for (const envFile of envFiles) {
  if (!fs.existsSync(envFile)) {
    continue
  }

  const parsed = parseEnvFile(fs.readFileSync(envFile, 'utf8'))

  for (const [key, value] of Object.entries(parsed)) {
    process.env[key] = value
  }
}

const child = spawn(args[0], args.slice(1), {
  cwd: workingDirectory,
  env: process.env,
  stdio: 'inherit',
  shell: false,
})

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal)
    return
  }

  process.exit(code ?? 0)
})
