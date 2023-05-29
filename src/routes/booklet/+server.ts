/** @type {import('./$types').RequestHandler} */
export async function GET({ fetch }) {
    return fetch(`/skirmish-2.pdf`);
}