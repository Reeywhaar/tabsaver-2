import { readFile } from './readFile'

export async function readJson() {
  return JSON.parse(await readFile())
}
