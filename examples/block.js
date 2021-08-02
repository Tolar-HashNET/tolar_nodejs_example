const grpc = require('@grpc/grpc-js');
const util = require('../common/util')

async function main() {
    try {
        const accountClient = util.promisifyClient(new util.account.service.AccountServiceClient(
            "127.0.0.1:9300",
            grpc.credentials.createInsecure())
        );

        await util.prepareKeyStore(accountClient);

        const blockchainClient = util.promisifyClient(new util.blockchain.service.BlockchainServiceClient(
            "127.0.0.1:9300",
            grpc.credentials.createInsecure())
        );

        // Get Block
        const blockByIndexRequest = new util.blockchain.msg.GetBlockByIndexRequest().setBlockIndex(3);
        const blockByIndexResponse = await blockchainClient.getBlockByIndex().sendMessage(blockByIndexRequest);

        console.log("block index: " + blockByIndexResponse.getBlockIndex());
        console.log("block hash: " + Buffer.from(blockByIndexResponse.getHash()).toString('utf8'));
        console.log("block previous hash: " + Buffer.from(blockByIndexResponse.getPreviousBlockHash()).toString('utf8'));

        for (const transactionHash of blockByIndexResponse.getTransactionHashesList()) {
            console.log("block transaction hash: " + Buffer.from(transactionHash).toString('utf8'));
        }

        console.log("block confirmation timestamp: " + blockByIndexResponse.getConfirmationTimestamp());

        // Get Transaction List
        const transactionListRequest = new util.blockchain.msg.GetTransactionListRequest();
        transactionListRequest.addAddresses(Buffer.from('5406ce41b2510285961dac9a6a60132af3cfbf26e5bc97a4ad', 'utf8'));
        transactionListRequest.addAddresses(Buffer.from('54dc9193107c598d4586220ea5a30588518ddcaa8381c4c7a3', 'utf8'));

        transactionListRequest.setLimit(1000);
        transactionListRequest.setSkip(0);

        const transactionListResponse = await blockchainClient.getTransactionList().sendMessage(transactionListRequest);

        for (const transaction of transactionListResponse.getTransactionsList()) {
            console.log("transaction:");
            console.log("\ttransaction hash: " + Buffer.from(transaction.getTransactionHash()).toString('utf8'));
            console.log("\tblock hash: " + Buffer.from(transaction.getBlockHash()).toString('utf8'));
            console.log("\ttransaction index: " + transaction.getTransactionIndex());
            console.log("\tsender address: " + Buffer.from(transaction.getSenderAddress()).toString('utf8'));
            console.log("\treceiver address: " + Buffer.from(transaction.getReceiverAddress()).toString('utf8'));
            console.log("\tvalue: " + util.toNumberTolar(transaction.getValue()));
            console.log("\tgas: " + util.toNumberAttoTolar(transaction.getGas()));
            console.log("\tgas price: " + util.toNumberAttoTolar(transaction.getGasPrice()));
            console.log("\tnonce: " + util.toNumberAttoTolar(transaction.getGasPrice()));
            console.log("\tconfirmation timestamp: " + transaction.getConfirmationTimestamp());
            console.log("\tgas used: " + util.toNumberAttoTolar(transaction.getGasUsed()));
            console.log("\tgas refunded: " + util.toNumberAttoTolar(transaction.getGasRefunded()));
            console.log("\tnew address: " + Buffer.from(transaction.getNewAddress()).toString('utf8'));
            console.log("\toutput: " + Buffer.from(transaction.getOutput()).toString('hex'));
            console.log("\texcepted: " + transaction.getExcepted());
        }
    } catch (e) {
        console.error(e);
    }
}

main();
