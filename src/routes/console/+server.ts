import { redirect } from '@sveltejs/kit';

/** @type {import('./$types').RequestHandler} */
export async function GET() {
    throw redirect(301, `https://gitpod.io/#https://github.com/tyvdh/soroban-cli-online`)
}