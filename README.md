# Simple implementation of Tolar Hashnet using nodejs

## About
A simple program that uses Tolar Hashnet network. All communication is done using GRPC.
Program connects to `tolar_thin_node` which proxies calls to main network.
Execution:
```
1. Open local keystore.
2. Print state of addresses stored in local keystore.
3. Send Tolars to newly created local address.
4. Print new state of local addresses.
```

## Prerequisites
### nodejs
This project is tested using nodejs v18.16.0.
### npm
This project is tested using npm 9.5.1.

## Build And Run
Run from this directory:
```sh
# 1. Install all project dependencies:
npm install

# 4. Run application:
node main.js
```
