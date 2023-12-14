import type { APIContext } from "astro"

export async function GET({}: APIContext) {
  return {
    body: 'export const search = () => {return {results: []}}'
  }
}