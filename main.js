import axios from 'axios';

async function request(method, params) {
    const response = await axios.post(
        'https://jsongw.stagenet.tolar.io/jsonrpc',
        {jsonrpc: "2.0", id: "1", method: method, params: params},
        {headers: {'content-type': 'application/json'}}
    );

    if('error' in response.data) {
        throw Error("Call to " + method +
            " failed with error code: " + response.data.error.code +
            "; error message: " + response.data.error.message);
    }

    return response.data.result;
}

async function CreateAddress(existingAddressBalances, addressName, lockPassword) {
    const addressIndex = existingAddressBalances.findIndex(addressBalance => addressBalance.address_name === addressName);

    return addressIndex !== -1 ?
        existingAddressBalances[addressIndex].address :
        await request("account_createNewAddress", {
            name: addressName,
            lock_password: lockPassword,
            lock_hint: ""
        });
}

async function main() {
    try {
        const accountMasterPassword = 'account_pass.1234';

        const isNewlyCreated = await request('account_create', {
            master_password: accountMasterPassword,
            mnemonic: "total media expose arch copy immense volume rail owner pluck clever bottom"
        });

        if(!isNewlyCreated) {
            // If account already exists open it
            await request("account_open", {master_password: accountMasterPassword});
        }

        const addressBalances = await request("account_listBalancePerAddress", null);
        console.log("addressBalances: ", addressBalances);

        const senderPassword = 'sender_pass.1234';
        const senderAddress = await CreateAddress(addressBalances, 'sender', senderPassword);
        const receiverAddress = await CreateAddress(addressBalances, 'receiver', 'receiver_pass.1234');

        const nextNonce = await request("tol_getNonce", {address: senderAddress});

        const transaction = {
            sender_address: senderAddress,
            receiver_address: receiverAddress,
            amount: "123456",
            sender_address_password: senderPassword,
            gas: "21000",
            gas_price: "1",
            data: "",
            nonce: nextNonce,
            network_id: 0
        };

        transaction.gas = await request("tol_getGasEstimate", transaction);
        const transactionHash = await request("account_sendRawTransaction", transaction);
        console.log("transaction hash: " + transactionHash);

        await new Promise(resolve => setTimeout(resolve, 10000));
    } catch (e) {
        console.error(e);
    }
}

main();
