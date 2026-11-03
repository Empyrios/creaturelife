/** CreatureLife: deterministic, local-first game rules. No network, timers or DOM. */
export const SCHEMA = 1;
export const STORAGE_KEY = 'empyrios-creaturelife-v1';
export const BIOMES = Object.freeze({
  grove:{name:'Mosswood',short:'Grove',icon:'🌿',description:'A gentle forest of moss and moonlit branches',bonus:'Berries',resources:{berries:3,nectar:1}},
  tide:{name:'Glasswater',short:'Tide',icon:'💧',description:'Tidal pools shimmering beneath glassy cliffs',bonus:'Nectar',resources:{berries:1,nectar:3}},
  mesa:{name:'Emberfall',short:'Mesa',icon:'✦',description:'Warm amber stone and a sky full of sparks',bonus:'Shards',resources:{berries:1,nectar:1}}
});
export const LOCI = Object.freeze({coat:5,ears:3,tail:3,pattern:3,glow:2,affinity:3});
export const COATS = Object.freeze([
 {name:'Fern',fill:'#94d8a8',shade:'#4d9271'},
 {name:'Lagoon',fill:'#8acded',shade:'#438baa'},
 {name:'Bloom',fill:'#efb1d8',shade:'#b875a5'},
 {name:'Amber',fill:'#eebd7e',shade:'#b47650'},
 {name:'Amethyst',fill:'#b8a0ef',shade:'#7865b5'}
]);
export const WEATHERS = Object.freeze(['Clear skies','Gentle rain','Stardust','Warm breeze','Fog banks']);
const NAMES=['Pip','Nori','Bram','Lumi','Mira','Kiko','Tavi','Ori','Sumi','Piko','Mallow','Nova','Fenn','Sora','Tula','Rumi','Mika','Bibi','Quill','Vela'];
const KEYS=Object.keys(LOCI);
const MAX_CREATURES=24,MAX_EGGS=8,MAX_EVENTS=160;
export function clamp(n,min=0,max=100){return Math.max(min,Math.min(max,n));}
export function isId(v){return typeof v==='string' && /^[a-z0-9][a-z0-9-]{0,59}$/i.test(v);}
export function safeName(v){const s=String(v??'').trim().replace(/\s+/g,' ');if(!s||s.length>28)throw Error('Names must contain 1 to 28 characters.');return s;}
export function seedValue(n){if(!Number.isSafeInteger(Number(n)))throw Error('Seed must be a whole number.');return (Number(n)>>>0)||0x6d2b79f5;}
/** xorshift32, explicit state, no Math.random. */
export function draw(s,max){if(!Number.isInteger(max)||max<=0)throw Error('Invalid random bound.');let x=s.rng>>>0;x^=x<<13;x^=x>>>17;x^=x<<5;s.rng=x>>>0;return s.rng%max;}
function nextId(s,prefix){s.serial++;return `${prefix}-${s.serial.toString(36)}`;}
function freshDna(s){const dna={};for(const key of KEYS){const max=LOCI[key];dna[key]=[draw(s,max),draw(s,max)];}return dna;}
function preferred(dna){const n=express(dna).affinity;return Object.keys(BIOMES)[n];}
export function express(dna){if(!validateDna(dna))throw Error('Invalid DNA.');return Object.fromEntries(KEYS.map(key=>{const [a,b]=dna[key];return [key,key==='coat'?Math.round((a+b)/2):Math.max(a,b)];}));}
export function validateDna(dna){return !!dna && typeof dna==='object' && KEYS.every(k=>Array.isArray(dna[k])&&dna[k].length===2&&dna[k].every(a=>Number.isInteger(a)&&a>=0&&a<LOCI[k]));}
function makeCreature(s,dna,parents=[],name){const id=nextId(s,'cr');return {id,name:name??NAMES[draw(s,NAMES.length)],dna,parents:[...parents],biome:preferred(dna),bornDay:s.day,age:0,stage:0,branch:null,hunger:74,energy:76,mood:79,bond:18,health:100,lastExploreDay:0,lastCareDay:0};}
function log(s,message,type='world'){s.events.unshift({id:nextId(s,'ev'),day:s.day,type,message});s.events=s.events.slice(0,MAX_EVENTS);}
function earn(s,key){if(!s.achievements.includes(key))s.achievements.push(key);}
export function stageName(creature){return creature.stage===0?'Hatchling':creature.stage===1?'Youngling':creature.branch==='Luminous'?'Luminous adult':'Wild adult';}
export function titleFor(c){const affinity=BIOMES[c.biome]?.short||'Wanderer';return `${COATS[express(c.dna).coat].name} ${affinity}`;}
export function createWorld(seed=20261103){const s={schema:SCHEMA,seed:seedValue(seed),rng:seedValue(seed),serial:0,day:1,weather:'Clear skies',resources:{berries:14,nectar:8,shards:0},creatures:[],eggs:[],selectedId:'',events:[],achievements:[],stats:{fed:0,played:0,rested:0,explored:0,hatched:0,bred:0,days:0}};
 const c=makeCreature(s,freshDna(s),[],'Pip');s.creatures.push(c);s.selectedId=c.id;log(s,`Pip hatched in ${BIOMES[c.biome].name}. Your sanctuary has begun.`,'birth');return s;}
function copy(s){return structuredClone(s);}
function one(s,id){const c=s.creatures.find(x=>x.id===id);if(!c)throw Error('Select a real creature first.');return c;}
function pay(s,key,cost){if(s.resources[key]<cost)throw Error(`Not enough ${key}. You need ${cost}.`);s.resources[key]-=cost;}
function reward(s,source,kind,amount){s.resources[kind]+=amount;log(s,`${source}: +${amount} ${kind}.`,'resource');}
function evolve(s,c){if(c.stage===0&&c.age>=3){c.stage=1;log(s,`${c.name} grew into a youngling!`,'growth');earn(s,'first-growth');}
 if(c.stage===1&&c.age>=8){c.stage=2;c.branch=c.bond>=56&&c.mood>=55?'Luminous':'Wild';log(s,`${c.name} became a ${c.branch.toLowerCase()} adult.`,'growth');earn(s,'first-adult');}}
export function areCloseFamily(a,b){return a.id===b.id||a.parents.includes(b.id)||b.parents.includes(a.id)||a.parents.some(id=>b.parents.includes(id));}
export function combineDna(s,a,b){if(!validateDna(a)||!validateDna(b))throw Error('Invalid parental DNA.');const child={};for(const key of KEYS){const max=LOCI[key];const aAllele=a[key][draw(s,2)];const bAllele=b[key][draw(s,2)];const mutate=value=>draw(s,100)<6?draw(s,max):value;child[key]=[mutate(aAllele),mutate(bAllele)];}return child;}
export function canBreed(s,a,b){return a.id!==b.id&&a.stage===2&&b.stage===2&&a.bond>=40&&b.bond>=40&&!areCloseFamily(a,b)&&s.eggs.length<MAX_EGGS&&s.resources.nectar>=8;}
function capResources(s){for(const k of Object.keys(s.resources))s.resources[k]=clamp(s.resources[k],0,9999);}
export function transition(input,action,payload={}){
 const s=copy(input);if(!validateState(s))throw Error('Saved world is invalid. Restore a backup or start over.');
 if(action==='feed'){
  const c=one(s,payload.id??s.selectedId);pay(s,'berries',2);c.hunger=clamp(c.hunger+31);c.health=clamp(c.health+2);c.energy=clamp(c.energy+4);c.bond=clamp(c.bond+4);c.lastCareDay=s.day;s.stats.fed++;log(s,`You fed ${c.name}. A little more trust grew.`,'care');earn(s,'first-care');
 } else if(action==='play'){
  const c=one(s,payload.id??s.selectedId);if(c.energy<16)throw Error(`${c.name} is too tired to play.`);c.energy-=16;c.hunger=clamp(c.hunger-7);c.mood=clamp(c.mood+24);c.bond=clamp(c.bond+8);c.lastCareDay=s.day;s.stats.played++;log(s,`${c.name} played beneath the lanterns.`,'care');earn(s,'first-care');
 } else if(action==='attune'){
  const c=one(s,payload.id??s.selectedId);pay(s,'shards',3);c.bond=clamp(c.bond+15);c.mood=clamp(c.mood+10);log(s,`You channelled three starshards into ${c.name}'s spirit. Your bond brightened.`,'care');
 } else if(action==='rest'){
  const c=one(s,payload.id??s.selectedId);c.energy=clamp(c.energy+32);c.hunger=clamp(c.hunger-6);c.mood=clamp(c.mood+4);c.health=clamp(c.health+2);s.stats.rested++;log(s,`${c.name} took a peaceful rest.`,'care');
 } else if(action==='explore'){
  const c=one(s,payload.id??s.selectedId),biome=payload.biome??c.biome;if(!BIOMES[biome])throw Error('Unknown expedition destination.');if(c.energy<20)throw Error(`${c.name} needs 20 energy to explore.`);if(c.lastExploreDay===s.day)throw Error(`${c.name} already explored today. Advance to tomorrow.`);
  c.energy-=20;c.hunger=clamp(c.hunger-12);c.mood=clamp(c.mood+7);c.bond=clamp(c.bond+3);c.lastExploreDay=s.day;s.stats.explored++;
  const affinity=preferred(c.dna)===biome;const kind=draw(s,100)<(affinity?58:47)?'berries':'nectar';const amount=2+draw(s,5)+(affinity?2:0);reward(s,c.name,kind,amount);
  if(biome==='mesa'&&draw(s,100)<70)reward(s,c.name,'shards',1+draw(s,2));
  const chance=draw(s,100);if(chance<21&&s.eggs.length<MAX_EGGS){const egg={id:nextId(s,'egg'),dna:freshDna(s),parents:[],foundDay:s.day,biome,origin:'found'};s.eggs.push(egg);log(s,`${c.name} found a mysterious egg in ${BIOMES[biome].name}!`,'discovery');earn(s,'egg-finder');}else log(s,`${c.name} returned safely from ${BIOMES[biome].name}.`,'explore');earn(s,'first-expedition');
 } else if(action==='day'){
  s.day++;s.stats.days++;s.weather=WEATHERS[draw(s,WEATHERS.length)];s.resources.berries+=3;s.resources.nectar+=2;if(s.weather==='Stardust')s.resources.shards++;
  for(const c of s.creatures){c.age++;c.energy=clamp(c.energy+24);c.hunger=clamp(c.hunger-13);c.mood=clamp(c.mood-(c.hunger<25?10:4)+(c.biome===preferred(c.dna)?2:0));c.health=clamp(c.health+(c.hunger<20?-9:c.hunger<40?-3:2));if(c.health===0){c.health=1;c.energy=0;log(s,`${c.name} needs attention. Feed them soon.`,'warning');}evolve(s,c);}
  log(s,`Day ${s.day}: ${s.weather.toLowerCase()}. The sanctuary grows.`,'world');if(s.day>=10)earn(s,'ten-days');
 } else if(action==='select'){
  one(s,payload.id);s.selectedId=payload.id;
 } else if(action==='rename'){
  const c=one(s,payload.id??s.selectedId);const prev=c.name;c.name=safeName(payload.name);log(s,`${prev} is now called ${c.name}.`,'care');
 } else if(action==='move'){
  const c=one(s,payload.id??s.selectedId);if(!BIOMES[payload.biome])throw Error('Unknown habitat.');c.biome=payload.biome;log(s,`${c.name} moved to ${BIOMES[c.biome].name}.`,'world');if(new Set(s.creatures.map(x=>x.biome)).size===3)earn(s,'three-habitats');
 } else if(action==='breed'){
  const a=one(s,payload.first),b=one(s,payload.second);if(!canBreed(s,a,b))throw Error('Breeding requires two unrelated bonded adults, 8 nectar, and an available egg slot.');pay(s,'nectar',8);const egg={id:nextId(s,'egg'),dna:combineDna(s,a.dna,b.dna),parents:[a.id,b.id],foundDay:s.day,biome:a.biome,origin:'bred'};s.eggs.push(egg);s.stats.bred++;log(s,`${a.name} and ${b.name} created a new egg with inherited traits.`,'birth');earn(s,'first-breeding');
 } else if(action==='hatch'){
  const i=s.eggs.findIndex(x=>x.id===payload.id);if(i<0)throw Error('Egg not found.');if(s.creatures.length>=MAX_CREATURES)throw Error('Sanctuary full. The maximum is 24 creatures.');const egg=s.eggs[i];if(s.day<egg.foundDay+2)throw Error('This egg needs two full days before hatching.');const baby=makeCreature(s,egg.dna,egg.parents);baby.biome=egg.biome;s.eggs.splice(i,1);s.creatures.push(baby);s.selectedId=baby.id;s.stats.hatched++;log(s,`${baby.name} hatched! Another life joins your sanctuary.`,'birth');if(s.creatures.length>=3)earn(s,'three-creatures');
 } else throw Error('Unknown action.');
 capResources(s);if(!validateState(s))throw Error('World transition produced an invalid state.');return s;
}
export function overview(s){return {creatures:s.creatures.length,adults:s.creatures.filter(c=>c.stage===2).length,eggs:s.eggs.length,happiness:Math.round(s.creatures.reduce((n,c)=>n+c.mood,0)/s.creatures.length),bond:Math.round(s.creatures.reduce((n,c)=>n+c.bond,0)/s.creatures.length)};}
export function validateState(s){if(!s||typeof s!=='object'||s.schema!==SCHEMA||!Number.isInteger(s.day)||s.day<1||s.day>1e7||!Number.isInteger(s.serial)||s.serial<1||!Number.isInteger(s.rng)||s.rng<0||s.rng>0xffffffff)return false;
 if(!s.resources||!['berries','nectar','shards'].every(k=>Number.isInteger(s.resources[k])&&s.resources[k]>=0&&s.resources[k]<=9999))return false;
 if(!Array.isArray(s.creatures)||s.creatures.length<1||s.creatures.length>MAX_CREATURES||!Array.isArray(s.eggs)||s.eggs.length>MAX_EGGS||!Array.isArray(s.events)||s.events.length>MAX_EVENTS||!Array.isArray(s.achievements)||s.achievements.length>30)return false;
 const ids=new Set();for(const c of s.creatures){if(!isId(c.id)||ids.has(c.id)||typeof c.name!=='string'||!c.name.trim()||c.name.length>28||!validateDna(c.dna)||!BIOMES[c.biome]||!Array.isArray(c.parents)||c.parents.length>2||!c.parents.every(isId)||!Number.isInteger(c.age)||c.age<0||c.age>1e7||![0,1,2].includes(c.stage)||!['Wild','Luminous',null].includes(c.branch)||!['hunger','energy','mood','bond','health'].every(k=>Number.isInteger(c[k])&&c[k]>=0&&c[k]<=100)||!Number.isInteger(c.lastExploreDay)||c.lastExploreDay<0||c.lastExploreDay>s.day) return false;ids.add(c.id);}
 if(!ids.has(s.selectedId))return false;
 const eggIds=new Set();for(const egg of s.eggs){if(!isId(egg.id)||ids.has(egg.id)||eggIds.has(egg.id)||!validateDna(egg.dna)||!Number.isInteger(egg.foundDay)||egg.foundDay<1||egg.foundDay>s.day||!BIOMES[egg.biome]||!Array.isArray(egg.parents)||egg.parents.length>2||!egg.parents.every(isId))return false;eggIds.add(egg.id);}
 const eventIds=new Set();for(const ev of s.events){if(!isId(ev.id)||eventIds.has(ev.id)||!Number.isInteger(ev.day)||ev.day<1||ev.day>s.day||!['birth','care','discovery','explore','resource','growth','world','warning'].includes(ev.type)||typeof ev.message!=='string'||ev.message.length>300)return false;eventIds.add(ev.id);}
 const st=['fed','played','rested','explored','hatched','bred','days'];if(!s.stats||!st.every(k=>Number.isInteger(s.stats[k])&&s.stats[k]>=0&&s.stats[k]<=1e8)||!s.achievements.every(x=>typeof x==='string'&&x.length<50)||!WEATHERS.includes(s.weather))return false;
 return true;
}
export function importWorld(text){if(typeof text!=='string'||text.length>2_000_000)throw Error('Backup is too large.');let obj;try{obj=JSON.parse(text)}catch{throw Error('Invalid JSON backup.');}if(!validateState(obj))throw Error('Backup schema or values are invalid.');return obj;}
export function exportWorld(s){if(!validateState(s))throw Error('Cannot export invalid data.');return JSON.stringify(s,null,2);}
export function escapeHtml(input){return String(input??'').replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));}
