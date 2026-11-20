export const meta = {
  name: 'os-process-thread-launch-exec-v1',
  article: 'knowledge/cs/os/os-process-thread.md',
  alt: 'shell 通过 fork 创建具有新 PID 的子进程，子进程 execve 装入 Python 后保持 PID，由解释器在该进程内执行脚本；父 shell 可等待退出',
};
export default (k) => k.figure({
  h: 470,
  title: '创建进程与替换程序映像是两件事',
  subtitle: 'Linux/POSIX 经典 fork + exec 路径示意；不规定所有 shell 的实现',
  body: [
    k.box({x:40,y:150,w:240,h:100,title:'父进程：shell',sub:'PID 100 · 解析命令',tone:'info'}),
    k.box({x:360,y:150,w:240,h:100,title:'子进程：shell 映像',sub:'PID 101 · fork 返回后',tone:'accent'}),
    k.box({x:680,y:150,w:240,h:100,title:'子进程：Python',sub:'PID 101 · 新程序映像',tone:'accent'}),
    k.arrow({points:[[280,200],[360,200]],label:'fork',labelAt:[320,183]}),
    k.arrow({points:[[600,200],[680,200]],label:'execve',labelAt:[640,183]}),
    k.box({x:40,y:310,w:240,h:74,title:'父 shell 可等待',sub:'取得子进程退出状态',tone:'info'}),
    k.arrow({points:[[160,250],[160,310]],tone:'info'}),
    k.box({x:680,y:310,w:240,h:74,title:'解释器执行 app.py',sub:'运行时与脚本在同一进程',tone:'accent',titleSize:'body'}),
    k.arrow({points:[[800,250],[800,310]],tone:'accent'}),
    k.text({x:360,y:320,text:'fork：新 PID',size:'body',tone:'accent'}),
    k.text({x:360,y:350,text:'exec：PID 保持不变',size:'body',tone:'accent'}),
    k.note({x:40,y:410,w:880,h:42,text:'脚本不是天然独立进程；CPU 执行解释器、本地库等机器指令。'}),
  ].join(''),
});
