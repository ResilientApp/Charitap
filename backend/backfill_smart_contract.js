const mongoose = require('mongoose');
require('dotenv').config(); // Load env first

const Transaction = require('./models/Transaction');
const Charity = require('./models/Charity');
const resContract = require('./services/rescontract-client');

async function backfillSmartContract() {
    console.log('--- Backfill Smart Contract Receipt IDs ---');
    console.log(`Contract: ${process.env.RESCONTRACT_CONTRACT_ADDRESS || 'MISSING'}`);

    // Explicitly check for the string 'true' to avoid treating "false" as truthy
    if (process.env.RESCONTRACT_ENABLED !== 'true') {
        console.error('Error: RESCONTRACT_ENABLED must be set to exactly "true" in .env to run backfill');
        return;
    }

    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ MongoDB connected');

        // Find transactions that are missing contractReceiptId
        // We can process ALL transactions, or just the ones already synced to blockchain.
        // Let's process all validated transactions (amount > 0).
        const query = {
            $or: [
                { contractReceiptId: { $exists: false } },
                { contractReceiptId: null },
                { contractReceiptId: '' }
            ]
        };

        // Use a cursor for memory-efficient processing instead of loading all records at once
        const cursor = Transaction.find(query).cursor();
        let successCount = 0;
        let failCount = 0;
        let totalCount = 0;

        for await (const tx of cursor) {
            totalCount++;
            console.log(`\nProcessing TX ${tx._id} (Amount: $${tx.amount}, Charity: ${tx.charity})...`);

            try {
                // 1. Derive charityNumericId - use numericId from Charity model if available,
                //    otherwise log a skip. The slice/parseInt approach is collision-prone.
                let charityNumericId = 0;
                if (tx.charity) {
                    const charityDoc = await Charity.findById(tx.charity).select('numericId');
                    if (charityDoc && charityDoc.numericId) {
                        charityNumericId = charityDoc.numericId;
                    } else {
                        // Fallback: deterministic but collision-possible (log warning)
                        const charityIdStr = tx.charity.toString();
                        charityNumericId = parseInt(charityIdStr.slice(-8), 16) || 0;
                        console.warn(`  Warning: Charity ${tx.charity} has no numericId - using derived ID (collision-prone)`);
                    }
                }

                // 2. Convert Amount (Dollars -> Cents) with NaN guard
                const parsedAmount = parseFloat(tx.amount);
                if (Number.isNaN(parsedAmount)) {
                    console.log(`  Skipping: tx.amount is NaN (raw value: ${tx.amount})`);
                    failCount++;
                    continue;
                }
                const amountCents = Math.round(parsedAmount * 100);

                if (charityNumericId === 0 || Number.isNaN(amountCents) || amountCents <= 0) {
                    console.log(`  Skipping: Invalid data (CharityID=${charityNumericId}, amountCents=${amountCents})`);
                    failCount++;
                    continue;
                }

                // 3. Call Smart Contract
                console.log(`  Minting Receipt: Charity=${charityNumericId}, Amount=${amountCents}`);
                const receiptId = await resContract.mintReceipt(charityNumericId, amountCents);

                if (receiptId) {
                    console.log(`  ✅ Success! Backfilled Receipt ID: ${receiptId}`);

                    // 4. Update Database
                    tx.contractReceiptId = receiptId;
                    // Ensure blockchainVerified is set if it wasn't already
                    if (!tx.blockchainVerified) {
                        tx.blockchainVerified = true;
                        tx.blockchainTimestamp = new Date();
                        // Note: blockchainTxId might still be missing if syncBlockchain hasn't run,
                        // but this script is just for the smart contract aspect.
                    }

                    await tx.save();
                    successCount++;
                } else {
                    console.error(`  ❌ Failed: Contract returned null`);
                    failCount++;
                }

            } catch (err) {
                console.error(`  ❌ Error processing tx: ${err.message}`);
                failCount++;
            }
        }

        console.log('\n--- Backfill Complete ---');
        console.log(`Processed: ${totalCount}`);
        console.log(`Success: ${successCount}`);
        console.log(`Failed:  ${failCount}`);

    } catch (err) {
        console.error('Fatal Error:', err);
    } finally {
        await mongoose.disconnect();
        console.log('✅ MongoDB disconnected');
    }
}

backfillSmartContract().catch(err => {
    console.error('Unhandled Rejection:', err);
    process.exitCode = 1;
});
