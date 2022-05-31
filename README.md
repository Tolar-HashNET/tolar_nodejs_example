# Simple implementation of Tolar Hashnet using nodejs

## About
Simple program that uses Tolar Hashnet network. All communication is done using GRPC.
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
This project is tested using nodejs v10.19.0.
### npm
This project is tested using npm 6.14.4.
### node-gyp
Build automation tool used for building `bigint-buffer`. It can be installed running:
```sh
npm install -g node-gyp
```
### git submodules
Project contains git submodule so initialization is required.
```
git submodule update --init
```

## Build And Run
Run from this directory:
```sh

# 1. Install node-gyp:
npm install -g node-gyp

# 2. Install all project dependencies:
npm install

# 3. Start thin_node if not started:
sudo systemctl start tolar-thin-node.service

# 4. Run application:
npm main.js
```
