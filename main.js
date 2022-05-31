const grpc = require('@grpc/grpc-js');
const util = require('./common/util')


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

main();
