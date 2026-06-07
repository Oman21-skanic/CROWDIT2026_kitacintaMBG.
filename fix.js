const fs = require('fs');
let code = fs.readFileSync('temp.js', 'utf8');
if (code.startsWith('"')) {
    code = JSON.parse(code);
}
fs.writeFileSync('script.js', code);
