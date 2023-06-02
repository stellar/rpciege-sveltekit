// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		interface Platform {
			env?: {
				EMAILS: KVNamespace;
				REFERRAL_CODES: KVNamespace;

				SG_SECRET: string;
				SG_VALIDATION: string;
				JWT_SECRET: string;
				CF_SECRET: string;
				DISCORD_CLIENT_ID: string;
				DISCORD_CLIENT_SECRET: string;

				ENVIRONMENT: development|production;
				HORIZON_URL: string;
				STELLAR_NETWORK: TESTNET|PUBLIC;

				FCA00C_PK: string;
				FCA00C_SK: string;
				RPCIEGE_PK: string;
				RPCIEGE_SK: string;
				POSTER_1_PK: string;
				POSTER_2_PK: string;
				POSTER_3_PK: string;
				POSTER_4_PK: string;
				POSTER_5_PK: string;
			}
		}
	}
}

export {}