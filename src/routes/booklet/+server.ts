/** @type {import('./$types').RequestHandler} */
export async function GET({ fetch }) {
    return fetch(`https://assets.rpciege.com/static/booklet.pdf`);
}