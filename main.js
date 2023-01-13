const axios = require('axios');
const util = require('./common/util');

const Web3 = require('@tolar/web3');
const web3 = new Web3();

function removeHexPrefix(str) {
    if (!str.startsWith('0x')) {
        return str;
    }

    return str.substr(2, str.length);
}

function calculateTransactionHashStr(transactionBody) {
    const serializedTransaction = transactionBody.serializeBinary();
    return removeHexPrefix(web3.utils.sha3(Buffer.from(serializedTransaction)));
}

function normalizeSignature(ethSignature) {
    let raw_signature = removeHexPrefix(ethSignature.signature).substr(0, 128)
        .concat('0')
        .concat(removeHexPrefix(ethSignature.v));

    if(raw_signature.length < 130) {
        raw_signature += '0';
    }

    return Buffer.from(raw_signature, 'utf8');
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
            .setValue(util.toU256(1000003432))
            .setGas(util.toU256(210000))
            .setGasPrice(util.toU256(1000000000000))
            .setData(Buffer.from('test data', 'utf-8'))
            .setNetworkId(util.NetworkId.StageNet)
            .setNonce(util.toU256(nonce));

        const hashStr = calculateTransactionHashStr(transactionBody);
        const ethSignature = web3.tolar.accounts
            .privateKeyToAccount(sender_private_key.toString())
            .sign("0x" + hashStr);

        const signature = normalizeSignature(ethSignature);
        const signatureData = new util.common.msg.SignatureData()
            .setHash(Buffer.from(hashStr, 'utf8'))
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

        console.log('transaction hash: ', signedTransactionResponse.data.result);
    } catch (error) {
        console.error("Failed to send signed transaction with error:", error);
    }
}

main();

