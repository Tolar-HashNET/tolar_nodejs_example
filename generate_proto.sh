#!/bin/bash

set -e

CURRENT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
PROTO_DIR="$CURRENT_DIR"/tolar/proto
GEN_DIR="$CURRENT_DIR"/gen

for proto_file in "$PROTO_DIR"/*.proto
do
  grpc_tools_node_protoc --proto_path="$CURRENT_DIR" --js_out=import_style=commonjs,binary:"$GEN_DIR" --grpc_out=grpc_js:"$GEN_DIR" "$proto_file"
done
