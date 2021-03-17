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
### grpc-tools
Grpc tools are used for generating stubs and messages from protobuf definitions. It can be installed running:
```sh
npm install -g grpc-tools
```
### node-gyp
Build automation tool used for building `bigint-buffer`. It can be installed running:
```sh
npm install -g node-gyp
```

## Build And Run
Run from this directory:
```sh
# 1. Install grpc-tools:
npm install -g grpc-tools

# 2. Generate js code from proto files:
bash generate_proto.sh

# 3. Install node-gyp:
npm install -g node-gyp

# 4. Install all project dependencies:
npm install

# 5. Start thin_node if not started:
sudo systemctl start tolar-thin-node.service

# 6. Run application:
npm main.js
```
