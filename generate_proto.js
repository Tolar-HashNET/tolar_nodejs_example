const execFileSync = require('child_process').execFileSync;
const path = require('path');
const fs = require('fs');

const in_dir_path = path.join(__dirname, 'tolar', 'proto');
const out_dir_path = path.join(__dirname, 'gen');

fs.readdirSync(in_dir_path).forEach(file => {
    const proto_file_path = path.join(in_dir_path, file);

    if(!fs.statSync(proto_file_path).isFile() || !proto_file_path.endsWith(".proto")) {
        return;
    }

    execFileSync('npx',
        ['grpc_tools_node_protoc', `--proto_path=${__dirname}`, `--js_out=import_style=commonjs,binary:${out_dir_path}`, `--grpc_out=grpc_js:${out_dir_path}`, proto_file_path]);
});
