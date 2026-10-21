import {spawn} from 'node:child_process';
// Accept the common preview --host/--port flags and pass Next's own names.
const args=process.argv.slice(2),value=(flag,fallback)=>{const i=args.indexOf(flag);return i>=0?args[i+1]:fallback;};
const child=spawn(process.execPath,['node_modules/next/dist/bin/next','dev','--webpack','--hostname',value('--host','0.0.0.0'),'--port',value('--port','4173')],{stdio:'inherit'});
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>child.kill(signal));
child.on('exit',code=>process.exit(code??0));
