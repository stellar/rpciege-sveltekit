import { error } from "@sveltejs/kit";

/** @type {import('./$types').RequestHandler} */
export async function GET({ fetch, params }) {
    if (params.file === 'booklet')
        throw error(404, { message: 'Not Found'})
    
    return fetch(`https://assets.rpciege.com/static/${params.file}.pdf`);
}