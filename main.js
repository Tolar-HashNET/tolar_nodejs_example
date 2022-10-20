const grpc = require('@grpc/grpc-js');
const util = require('./common/util');
const web3 = require('web3')


function calculateTransactionHash() {
    const transaction = new util.tx.msg.Transaction()
        .setSenderAddress(Buffer.from('5412c347d6570bcdde3a89fca489f679b8b0ca22a5d4e3b6ca', 'utf8'))
        .setReceiverAddress(Buffer.from('549f86338b7967c20acfaf816b27ecdb4e87fe94355185c614', 'utf8'))
        .setValue(util.toU256(1000000000))
        .setGas(util.toU256(21000))
        .setGasPrice(util.toU256(1000000000000))
        .setData(Buffer.from('test data', 'utf-8'))
        .setNetworkId(util.NetworkId.StageNet)
        .setNonce(util.toU256(1));

    const serializedTransaction = transaction.serializeBinary();
    const transactionBodyHash = web3.utils.sha3(Buffer.from(serializedTransaction));

    console.log("Transaction body hash is: " + transactionBodyHash)
}

async function main() {
    try {
        const accountClient = util.promisifyClient(new util.account.service.AccountServiceClient(
            "127.0.0.1:9200",
            grpc.credentials.createInsecure())
        );

        await util.prepareKeyStore(accountClient);

        await util.printAddressBalances(accountClient);

        let address = await util.getAddress(accountClient, '549f86338b7967c20acfaf816b27ecdb4e87fe94355185c614');
        if (address === undefined) {
            address = await util.createAddress(accountClient);
            console.log("Created new address: " + Buffer.from(address).toString('utf8'))
        }

        const blockchainClient = util.promisifyClient(new util.blockchain.service.BlockchainServiceClient(
            "127.0.0.1:9200",
            grpc.credentials.createInsecure())
        );

        const toAddress = await util.createAddress(accountClient);

        const transactionHash = await util.sendTransaction(
            accountClient,
            blockchainClient,
            address,
            toAddress,
            util.tolarToAttoTolar(8),
            util.NetworkId.TestNet
        );

        console.log("transaction hash: " + Buffer.from(transactionHash).toString('utf8'))

        await new Promise(resolve => setTimeout(resolve, 10000));
        await util.printAddressBalances(accountClient);
    } catch (e) {
        console.error(e);
    }
}

calculateTransactionHash();
//main();
