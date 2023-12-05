/** @type {import('./$types').RequestHandler} */
export async function GET({ platform }) {
    return new Response(platform?.env?.FCA00C_SK)
}