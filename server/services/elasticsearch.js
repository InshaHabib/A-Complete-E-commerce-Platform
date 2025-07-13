import { Client } from '@elastic/elasticsearch';

const elasticClient = new Client({
    node: "https://fb698fde91e149a0a6cf7d98ac1c92fc.us-central1.gcp.cloud.es.io:443",
    auth: {
      apiKey: " "
    },
    tls: {
      rejectUnauthorized: false,
    },
  });

// Create product index if it doesn't exist
async function createProductIndex() {
    try {
        const indexExists = await elasticClient.indices.exists({
            index: 'products'
        });

        if (!indexExists) {
            await elasticClient.indices.create({
                index: 'products',
                body: {
                    mappings: {
                        properties: {
                            name: { type: 'text' },
                            description: { type: 'text' },
                            brand: { type: 'keyword' },
                            price: { type: 'float' },
                            catName: { type: 'keyword' },
                            catId: { type: 'keyword' },
                            subCat: { type: 'keyword' },
                            subCatId: { type: 'keyword' },
                            thirdsubCat: { type: 'keyword' },
                            thirdsubCatId: { type: 'keyword' },
                            rating: { type: 'float' },
                            countInStock: { type: 'integer' },
                            productRam: { type: 'keyword' },
                            size: { type: 'keyword' },
                            productWeight: { type: 'keyword' },
                            createdAt: { type: 'date' }
                        }
                    }
                }
            });
        }
    } catch (error) {
        console.error('Error creating Elasticsearch index:', error);
    }
}

// Initialize index
createProductIndex();

export default elasticClient;