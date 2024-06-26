import { sleep } from './sleep'

export async function waitUntil(fn: () => Promise<boolean>, interval = 100) {
  while (!(await fn())) {
    await sleep(interval)
  }
}
