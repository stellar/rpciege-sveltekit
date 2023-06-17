<script lang="ts">
    import { page } from '$app/stores'

    const skirmishes = new Array(7)
    const fields = [
        'timestamp',
        'transaction_bytes',
        'instructions',
        'read_bytes',
        'write_bytes',
        'extended_metadata_size_bytes',
        'fee_charged',
    ]

    let leaderboard: any[] = []
    let skirmish = Number($page.url.searchParams.get('skirmish') || skirmishes.length)
    let field = $page.url.searchParams.get('field') || 'timestamp'
    
    $: {
        updateURLParams('field', field)
        updateURLParams('skirmish', skirmish.toString())
    }
    
    lookupLeaderboard()    

    async function lookupLeaderboard() {
        const resLeaderboard: any = await fetch(`https://futurenet.rpciege.com/leaderboard?skirmish=${skirmish}&field=${field}`).then((res) => res.json())

        if (resLeaderboard?.length)
            leaderboard = resLeaderboard
        else
            leaderboard = []
    }
    function updateURLParams(key: string, value: string) {
        let url = new URL(location.href)

        if ($page.url.searchParams.get(key) !== value)
            url.searchParams.set(key, value)

        url.search = url.searchParams.toString()

        history.pushState('', '', url.href)
    }
</script>

<div class="m-2">
    <div class="inline-flex flex-col">
        <select class="mb-2" bind:value={skirmish} on:change={lookupLeaderboard}>
            {#each skirmishes as _, i}
                <option value={i + 1}>Skirmish {i + 1}</option>
            {/each}
        </select>
        
        <select class="mb-2 capitalize" bind:value={field} on:change={lookupLeaderboard}>
            {#each fields as field}
                <option value={field}>{field.replace(/_/gmi, ' ')}</option>
            {/each}
        </select>
    </div>
    
    <table class="bg-white text-left [&>thead>tr>th]:border [&>thead>tr>th]:border-black [&>thead>tr>th]:px-2 [&>thead>tr>th]:py-1 [&>tbody>tr>td]:px-2 [&>tbody>tr>td]:border">
        <thead class="bg-black text-white">
            <tr>
                <th>#</th>
                {#if leaderboard.length}
                    {#each Object.keys(leaderboard[0]) as key}
                        <th class="capitalize">{key.replace(/_/gmi, ' ')}</th>
                    {/each}
                {:else}
                    <th>Address</th>
                    <th>Score</th>
                {/if}
        </thead>
        <tbody>
            {#if leaderboard.length}
                {#each leaderboard as {address, ...fields}, i}
                    <tr>
                        <td>{i + 1}</td>
                        <td>{address.substring(0, 5)}...{address.substr(-5)}</td>
                        {#each Object.entries(fields) as [_, value]}
                            <td>{value}</td>
                        {/each}
                    </tr>
                {/each}
            {:else}
                <tr>
                    <td>N/A</td>
                    <td>N/A</td>
                    <td>N/A</td>
                </tr>
            {/if}
        </tbody>
    </table>
</div>