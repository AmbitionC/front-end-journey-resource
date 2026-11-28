export const meta={name:'llm-token-context-paged-block-map-v1',article:'knowledge/llm/basics/llm-token-context.md',alt:'七个Token以四个一块划成逻辑块0和1，经块表映射到物理块5和2；位置6读取物理块2的偏移2，最后一块仍有一个空槽'};
export default k=>k.figure({h:650,title:'分页 KV：逻辑顺序由块表映射到物理位置',subtitle:'教学例子：7 个 Token，每块 4 槽；数字是位置，K/V 表示缓存数据',body:[
k.panel({x:40,y:112,w:880,h:340,label:'物理块编号不表示 Token 时间顺序'}),
k.box({x:65,y:174,w:300,h:72,title:'逻辑块 0',sub:'Token 位置 0、1、2、3',tone:'info'}),
k.text({x:560,y:158,text:'物理块 5',size:'heading',tone:'info'}),
k.cells({x:560,y:178,values:['K/V 0','K/V 1','K/V 2','K/V 3'],cw:80,ch:60,indices:false}),
k.arrow({points:[[365,210],[535,210]],label:'块表 0 → 5',tone:'info'}),
k.box({x:65,y:338,w:300,h:72,title:'逻辑块 1',sub:'Token 位置 4、5、6',tone:'accent'}),
k.text({x:560,y:322,text:'物理块 2',size:'heading',tone:'accent'}),
k.cells({x:560,y:342,values:['K/V 4','K/V 5','K/V 6','空槽'],cw:80,ch:60,indices:false,mark:{2:'accent'},dim:[3]}),
k.arrow({points:[[365,374],[535,374]],label:'块表 1 → 2',tone:'accent'}),
k.text({x:600,y:428,text:'偏移 0',size:'note',anchor:'middle',tone:'muted'}),
k.text({x:680,y:428,text:'偏移 1',size:'note',anchor:'middle',tone:'muted'}),
k.text({x:760,y:428,text:'偏移 2',size:'note',anchor:'middle',tone:'accent'}),
k.text({x:840,y:428,text:'偏移 3',size:'note',anchor:'middle',tone:'muted'}),
k.box({x:65,y:482,w:815,h:72,title:'位置 6 → 逻辑块 1 → 物理块 2，偏移 2',sub:'floor(6 / 4) = 1；6 mod 4 = 2；最后一块仍空 1 槽',tone:'accent'}),
k.note({x:40,y:580,w:880,h:50,text:'按实际长度增配块，减少预留浪费；每个 Token 的 K/V 数据量并未因此减少。'})].join('')});
