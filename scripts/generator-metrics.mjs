// Reproducible measurements using synthetic data only. No owner database.
import fs from 'node:fs';import {generators,pilotVariants} from '../src/domain/generators/index.ts';
import {emptyState} from '../src/domain/progress.ts';import {startQuick,answerQuick,moveQuick,quickDefaults} from '../src/domain/quick-practice.ts';import {serializeBackup,parseBackup} from '../src/domain/backup.ts';
const topics=[...new Map(generators.map(g=>[g.topic,{id:g.topic,subject:g.subject,materialStatus:'ready'}])).values()],qs=pilotVariants(topics.map(t=>t.id)),now=new Date('2026-10-12T00:00:00.000Z'),prefs={...quickDefaults(emptyState('0.5.0'),topics),topics:topics.map(t=>t.id),count:30,generatedVariants:true};
const rows=[];for(const count of [100,500,1000]){let state=emptyState('0.5.0'),done=0;
 while(done<count){const batch=Array.from({length:Math.min(30,count-done)},(_,i)=>qs[(done+i)%qs.length]),id='synthetic-'+done;state=startQuick(state,prefs,batch,id,now);
  for(let i=0;i<batch.length;i++){state=moveQuick(state,id,i,false,now);state=answerQuick(state,id,batch[i].answer,true,'attempt-'+(done+i),now);}state=moveQuick(state,id,0,true,now);done+=batch.length;}
 const backup=serializeBackup(state,now);if(JSON.stringify(parseBackup(backup).data)!==JSON.stringify(state))throw Error('Backup mismatch');rows.push({solved:count,uniqueSnapshots:Object.keys(state.quickPractice.snapshots).length,pooledSnapshotsBytes:Buffer.byteLength(JSON.stringify(state.quickPractice.snapshots)),backupBytes:Buffer.byteLength(backup),sessions:state.quickPractice.sessions.length});
}
const inventory=dir=>{const inv=JSON.parse(fs.readFileSync(dir+'/offline-inventory.json'));return {resources:inv.files.length,bytes:inv.files.reduce((n,f)=>n+fs.statSync(dir+'/'+f.path).size,0),inventoryVersion:inv.version};};
const result={growth:rows,beforeB:inventory('outputs/c2b-completed-prefix'),pilot:inventory(process.argv[2]??'outputs/generators-final-prefix'),published050:inventory('outputs/release050-prefix')};fs.writeFileSync('outputs/GENERATORS-METRICS.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
