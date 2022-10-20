const path = require('path')

const bigintBuffer = require('bigint-buffer')
const grpc = require('@grpc/grpc-js');
const grpcPromise = require('grpc-promise');

const NetworkId = {
    MainNet: 1,
    TestNet: 2,
    StageNet: 3
};


function loadProtoDefinitions(protoName) {
    const genDirPath = `..${path.sep}gen${path.sep}tolar${path.sep}proto${path.sep}`

    return {
        service: require(`${genDirPath}${protoName}_grpc_pb.js`),
        msg: require(`${genDirPath}${protoName}_pb.js`)
    };
}

const account = loadProtoDefinitions('account');
const blockchain = loadProtoDefinitions('blockchain');
const tx = loadProtoDefinitions('transaction');

function toU256(amount) {
    const result = bigintBuffer.toBufferBE(BigInt(amount), 256);
    const indexOf0 = result.findIndex(byte => byte !== 0x00);

    return result.slice(indexOf0, result.length);
}

function tolarToAttoTolar(tolar) {
    const decimalCount = Math.floor(tolar) === tolar ? 0 : (tolar.toString().split('.')[1].length || 0);
    const decimalMultiplier = Math.pow(10, decimalCount);

    return BigInt(Math.round(tolar * decimalMultiplier)) * (BigInt('1000000000000000000') / BigInt(decimalMultiplier));
}

function attoTolarToTolar(attoTolar) {
    const numberLength = attoTolar.toString().length;
    const numberDivider = 1000000000000000; // only 10^15
    const isSafeInteger = Number.isSafeInteger(Number(attoTolar));

    let numberValue = 0;
    let finalNumber = 0;

    if (numberLength < 18) {
        numberValue = isSafeInteger
            ? Number(attoTolar) / 1000
            : Number(attoTolar / BigInt(1000));
        finalNumber = numberValue / numberDivider;
    } else {
        numberValue = Number(attoTolar / BigInt(1000000));
        finalNumber = numberValue / (numberDivider / 1000);
    }

    return Number(finalNumber.toFixed(4));
}

function toNumberTolar(attoTolar) {
    return attoTolarToTolar(bigintBuffer.toBigIntBE(Buffer.from(attoTolar)));
}

function toNumberAttoTolar(attoTolar) {
    return bigintBuffer.toBigIntBE(Buffer.from(attoTolar));
}

function promisifyClient(client){
    const meta = new grpc.Metadata();
    meta.add('key', 'value');
    grpcPromise.promisifyAll(client, {metadata: meta, timeout: 10000});

    return client;
}

async function prepareKeyStore(accountClient) {
    const keyStoreMasterPass = 'some_sample_pass';

    await accountClient.create()
        .sendMessage(new account.msg.CreateRequest().setMasterPassword(keyStoreMasterPass))
        .catch(e => {
            if (e.code !== grpc.status.ALREADY_EXISTS) throw e;
        });

    await accountClient.open()
        .sendMessage(new account.msg.OpenRequest().setMasterPassword(keyStoreMasterPass))
        .catch(e => {
            if (e.code !== grpc.status.ALREADY_EXISTS) throw e;
        });
}

async function getAddress(accountClient, address_utf8_encoded) {
    const addresses = await accountClient.listAddresses().sendMessage(new account.msg.ListAddressesRequest());
    return addresses.getAddressesList().find(address => {
        return address_utf8_encoded === Buffer.from(address).toString('utf8');
    });
}

async function createAddress(accountClient) {
    const address = await accountClient.createNewAddress()
        .sendMessage(new account.msg.CreateNewAddressRequest());

    return address.getAddress();
}

async function sendTransaction(accountClient, blockchainClient, from, to, amountInAttoTolar, network_id) {
    const nonce = await blockchainClient.getNonce()
        .sendMessage(new blockchain.msg.GetNonceRequest().setAddress(from));

    const transactionToEstimate = new tx.msg.Transaction()
        .setSenderAddress(from)
        .setReceiverAddress(to)
        .setValue(toU256(amountInAttoTolar))
        .setGas(toU256(21000))
        .setGasPrice(toU256(1000000000000))
        .setData(Buffer.from('tolar node example app comment', 'utf-8'))
        .setNetworkId(network_id)
        .setNonce(nonce.getNonce());

    const gasEstimation = await blockchainClient.getGasEstimate().sendMessage(transactionToEstimate);

    const transaction = new account.msg.SendRawTransactionRequest()
        .setSenderAddress(transactionToEstimate.getSenderAddress())
        .setReceiverAddress(transactionToEstimate.getReceiverAddress())
        .setAmount(transactionToEstimate.getValue())
        .setGas(toU256(gasEstimation.getGasEstimate()))
        .setGasPrice(transactionToEstimate.getGasPrice())
        .setData(transactionToEstimate.getData())
        .setNonce(transactionToEstimate.getNonce());

    const transactionResponse = await accountClient.sendRawTransaction()
        .sendMessage(transaction);

    return transactionResponse.getTransactionHash();
}

async function printAddressBalances(accountClient) {
    const balances = await accountClient.listBalancePerAddress().sendMessage(new account.msg.ListBalancePerAddressRequest());

    for (const balance of balances.getAddressesList()) {
        console.log("address: " + Buffer.from(balance.getAddress()).toString('utf8')
            + " balance: " + toNumberTolar(balance.getBalance()));
    }
}

module.exports = {
    account,
    blockchain,
    tx,
    toU256,
    tolarToAttoTolar,
    attoTolarToTolar,
    toNumberTolar,
    toNumberAttoTolar,
    promisifyClient,
    prepareKeyStore,
    getAddress,
    createAddress,
    sendTransaction,
    printAddressBalances,
    NetworkId
}
