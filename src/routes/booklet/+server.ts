/** @type {import('./$types').RequestHandler} */
export async function GET({ fetch }) {
    return fetch(`/booklet.pdf`);
}