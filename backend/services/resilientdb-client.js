const axios = require('axios');
const crypto = require('crypto');

/**
 * ResilientDB Client - Cloud-based Integration (GraphQL)
 * Connects to ResilientDB cloud network using GraphQL API
 * Provides transparent, immutable ledger functionality
 */
class ResilientDBClient {
  constructor() {
    this.enabled = process.env.RESILIENTDB_ENABLED === 'true';
    this.graphqlUrl = process.env.RESILIENTDB_GRAPHQL_URL || 'https://cloud.resilientdb.com/graphql';
    this.failSilently = process.env.RESILIENTDB_FAIL_SILENTLY === 'true';

    // Generate a deterministic keypair for transactions
    this.systemKeypair = this.generateSystemKeypair();

    console.log(`[ResilientDB] Client initialized - ${this.enabled ? 'ENABLED' : 'DISABLED'}`);
    if (this.enabled) {
      console.log(`[ResilientDB] GraphQL Endpoint: ${this.graphqlUrl}`);
    }
  }

  /**
   * Use fixed pre-registered keypair provided by ResilientDB team
   * These keys are authorized and work for all Charitap transactions
   */
  generateSystemKeypair() {
    // Pre-registered keys from ResilientDB backend team
    // Provided by: ResilientDB team member
    // Date: 2026-01-19
    // Purpose: Authorized Charitap system keys for all transactions
    return {
      publicKey: 'AB9qzSf3XDRN1MnPyzHyat8DifbmvLfCn3KwfpiigsXB',
      privateKey: '89PygFrin8LFshpTPV8YZouyborMahsHhxybgZjwb1He'
    };
  }

  /**
   * Write a transaction to ResilientDB ledger using GraphQL
   * 
   * @param {string} key - Unique identifier for the transaction
   * @param {object|string} value - Data to store (will be stringified if object)
   * @returns {Promise<string|null>} Transaction ID or null if failed
   */
  async set(key, value) {
    if (!this.enabled) {
      console.log('[ResilientDB] Disabled - skipping set');
      return null;
    }

    try {
      const assetData = typeof value === 'string' ? value : JSON.stringify(value);

      // GraphQL mutation matching documentation format
      const mutation = {
        query: `
          mutation PostTransaction($data: PrepareAsset!) {
            postTransaction(data: $data) {
              id
            }
          }
        `,
        variables: {
          data: {
            operation: "CREATE",
            amount: 1,
            signerPublicKey: this.systemKeypair.publicKey,
            signerPrivateKey: this.systemKeypair.privateKey,
            recipientPublicKey: this.systemKeypair.publicKey,
            asset: {
              data: JSON.parse(assetData) // Parse to object for GraphQL
            }
          }
        }
      };

      console.log(`[ResilientDB] Writing transaction via GraphQL, key: ${key}`);

      const response = await axios.post(this.graphqlUrl, mutation, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });

      // Check for GraphQL errors
      if (response.data.errors) {
        throw new Error(`GraphQL errors: ${JSON.stringify(response.data.errors)}`);
      }

      if (response.data.data && response.data.data.postTransaction) {
        const transactionId = response.data.data.postTransaction.id || key;
        console.log(`[ResilientDB] OK Transaction committed via GraphQL, ID: ${transactionId}`);
        return transactionId;
      } else {
        throw new Error('No transaction ID returned');
      }

    } catch (error) {
      console.error('[ResilientDB] ERROR GraphQL set failed:', error.message);
      if (error.response && error.response.data) {
        console.error('[ResilientDB] GraphQL response:', JSON.stringify(error.response.data, null, 2));
      }

      if (!this.failSilently) {
        throw error;
      }
      return null;
    }
  }

  /**
   * Read a transaction from ResilientDB ledger
   * Note: For now, reads are not implemented in GraphQL endpoint
   * This returns null - ledger is write-only for transparency
   * 
   * @param {string} key - Transaction ID to retrieve
   * @returns {Promise<object|null>} Transaction data or null
   */
  async get(key) {
    if (!this.enabled) {
      console.log('[ResilientDB] Disabled - skipping get');
      return null;
    }

    console.log('[ResilientDB] WARNING  Read operations not yet implemented in GraphQL API');
    console.log('[ResilientDB] Ledger is write-only for transparency proof');
    return null;
  }

  /**
   * Generate a consistent ledger key with namespace prefix
   * Pattern: charitap:{type}:{id}
   * 
   * @param {string} type - Type of record (donation, distribution, charity)
   * @param {string} id - Unique identifier
   * @returns {string} Formatted ledger key
   */
  generateKey(type, id) {
    return `charitap:${type}:${id}`;
  }

  /**
   * Hash sensitive data before storing on public ledger
   * Used for user identification while preserving privacy
   * 
   * @param {string} data - Data to hash (e.g., email)
   * @returns {string} SHA-256 hash (first 16 characters)
   */
  hashSensitiveData(data) {
    return crypto
      .createHash('sha256')
      .update(data)
      .digest('hex')
      .substring(0, 16);
  }

  /**
   * Check if ResilientDB GraphQL service is available
   * @returns {Promise<boolean>}
   */
  async healthCheck() {
    if (!this.enabled) return false;

    try {
      const introspectionQuery = {
        query: '{ __schema { types { name } } }'
      };

      await axios.post(this.graphqlUrl, introspectionQuery, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 3000
      });

      console.log('[ResilientDB] OK GraphQL service is available');
      return true;
    } catch (error) {
      console.error('[ResilientDB] WARNING  GraphQL service unavailable:', error.message);
      return false;
    }
  }
}

// Export singleton instance
module.exports = new ResilientDBClient();
