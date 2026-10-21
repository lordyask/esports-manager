import {parentPort} from 'node:worker_threads';
globalThis.postMessage=data=>parentPort.postMessage(data);
await import('../lib/worker.ts');
parentPort.on('message',data=>globalThis.onmessage({data}));
parentPort.postMessage({ready:true});
