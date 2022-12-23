const axios = require('axios');
const util = require('./common/util');

const Web3 = require('web3');
const web3 = new Web3();

function removeHexPrefix(str) {
    if (!str.startsWith('0x')) {
        return str;
    }

    return str.substr(2, str.length);
}

function calculateTransactionHash(transactionBody) {
    const serializedTransaction = transactionBody.serializeBinary();
    return removeHexPrefix(web3.utils.sha3(Buffer.from(serializedTransaction)));
}

async function main() {
    try {
        const sender_address = Buffer.from('5412c347d6570bcdde3a89fca489f679b8b0ca22a5d4e3b6ca', 'utf8');
        const sender_private_key = Buffer.from('67f3c68cedd11ef77ed6b92ca9fd82c699ccfc5f1fd96fa485b0ffeb2cf60fdf', 'utf8');
        const sender_public_key = Buffer.from('6b34bc5b6d71f867128614ca9635e6764ff899f0d0076ea97226fc5e8b40a29c1f2e5713d2dda42afd08ec58be77439d65054705c43d9935bdc4b2640ce7935a', 'utf8');

        const nonceResponse = await axios.post('https://jsongw.stagenet.tolar.io/jsonrpc', {
            jsonrpc: '2.0',
            id: 1,
            method: 'tol_getNonce',
            params: [sender_address.toString()]
        });

        if('error' in nonceResponse.data) {
            throw nonceResponse.data.error;
        }

        const nonce = parseInt(nonceResponse.data.result);

        const transactionBody = new util.tx.msg.Transaction()
            // Set to genesis address, always has some tolars
            .setSenderAddress(sender_address)
            .setReceiverAddress(Buffer.from('549f86338b7967c20acfaf816b27ecdb4e87fe94355185c614', 'utf8'))
            .setValue(util.toU256(1000000000))
            .setGas(util.toU256(21000))
            .setGasPrice(util.toU256(1000000000000))
            .setData(Buffer.from('test data', 'utf-8'))
            .setNetworkId(util.NetworkId.StageNet)
            .setNonce(util.toU256(nonce));

        const hash = calculateTransactionHash(transactionBody);
        const ethSignature = web3.eth.accounts.sign(hash, sender_private_key.toString());
        const signature = Buffer.from(removeHexPrefix(ethSignature.signature), 'utf8');

        const signatureData = new util.common.msg.SignatureData()
            .setHash(hash)
            .setSignature(signature)
            .setSignerId(sender_public_key);

        const signedTransaction = new util.tx.msg.SignedTransaction()
            .setBody(transactionBody)
            .setSigData(signatureData);

        const signedTransactionResponse = await axios.post('https://jsongw.stagenet.tolar.io/jsonrpc', {
            jsonrpc: '2.0',
            id: 1,
            method: 'tx_sendSignedTransaction',
            params: [Buffer.from(signedTransaction.serializeBinary()).toString('hex')]
        });

        if('error' in signedTransactionResponse.data) {
            throw signedTransactionResponse.data.error;
        }

        console.log(signedTransactionResponse);
    } catch (error) {
        console.error("Failed to send signed transaction with error:", error);
    }
}

main();

