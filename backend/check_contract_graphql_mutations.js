const axios = require('axios');

async function introspectMutations() {
    const URL = 'https://contract.resilientdb.com/graphql';

    const GET_SCHEMA_QUERY = `
    query {
        __schema {
            mutationType {
                name
            }
            types {
                name
                fields {
                    name
                    args {
                        name
                        type {
                            name
                            kind
                            ofType {
                                name
                                kind
                            }
                        }
                    }
                }
            }
        }
    }`;

    try {
        const res = await axios.post(URL, { query: GET_SCHEMA_QUERY }, { timeout: 10000 });

        // Guard against unexpected response shapes
        if (!res?.data?.data?.__schema) {
            console.error(`\nURL: ${URL}`);
            console.error('Unexpected response shape - missing __schema in res.data.data');
            if (res?.data?.errors) {
                console.error('GraphQL errors:', JSON.stringify(res.data.errors, null, 2));
            }
            return;
        }

        const data = res.data.data.__schema;

        console.log(`\nURL: ${URL}`);

        // Guard: mutationType may be null if the schema has no mutations
        if (!data.mutationType) {
            console.log('No Root Mutation Type found (schema has no mutations).');
            return;
        }

        const mutationTypeName = data.mutationType.name;
        const mutationType = data.types && data.types.find(t => t.name === mutationTypeName);

        if (!mutationType || !Array.isArray(mutationType.fields) || mutationType.fields.length === 0) {
            console.log(`No Root Mutation Fields found for type: ${mutationTypeName}`);
            return;
        }
        console.log(`Root Mutation Fields (${mutationTypeName}):`);
        mutationType.fields.forEach(f => {
            const args = Array.isArray(f.args) ? f.args.map(a => `${a.name}`) : [];
            console.log(` - ${f.name}(${args.join(', ')})`);
        });
    } catch (e) {
        console.error(`\nURL: ${URL}`);
        console.error(e.message);
    }
}
introspectMutations();
