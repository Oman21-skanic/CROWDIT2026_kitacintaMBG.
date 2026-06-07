const fs = require('fs');
const readline = require('readline');

async function extract() {
    const fileStream = fs.createReadStream('C:\\Users\\oman\\.gemini\\antigravity\\brain\\66341bc6-8a68-4540-8c3a-b1af502ae0a0\\.system_generated\\logs\\transcript.jsonl');
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    let lastCode = '';
    for await (const line of rl) {
        if (line.includes('"name":"write_to_file"') && line.includes('script.js')) {
            try {
                const data = JSON.parse(line);
                const calls = data.tool_calls || [];
                for (const call of calls) {
                    if (call.name === 'write_to_file' && call.args.TargetFile && call.args.TargetFile.includes('script.js')) {
                        lastCode = call.args.CodeContent;
                    }
                }
            } catch (e) {}
        }
    }
    
    if (lastCode) {
        fs.writeFileSync('script.js.backup', lastCode);
        console.log('Saved to script.js.backup');
    } else {
        console.log('Not found');
    }
}
extract();
