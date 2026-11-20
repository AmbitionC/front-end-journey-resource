export const meta = {
  name: 'spring-mvc-request-routing-dispatch-v1',
  article: 'knowledge/backend/java/spring-mvc-request-routing.md',
  alt: 'Servlet 容器把请求交给 DispatcherServlet，后者先经 HandlerMapping 找处理器，再让 HandlerAdapter 解析参数并调用控制器；控制器返回值经消息转换写回响应',
};
export default (k) => k.figure({
  h: 760,
  title: 'Spring MVC：先匹配处理器，再适配调用',
  subtitle: 'Servlet 栈普通同步请求的主干；错误、拦截和异步分派未展开',
  body: [
    k.box({x:180,y:120,w:600,h:66,title:'Servlet 容器与 Filter 链',sub:'接收 HTTP，按 Servlet 映射进入 MVC',tone:'info'}),
    k.arrow({points:[[480,186],[480,216]]}),
    k.box({x:180,y:216,w:600,h:66,title:'DispatcherServlet',sub:'统一组织请求处理，委派具体策略',tone:'accent'}),
    k.arrow({points:[[480,282],[480,312]]}),
    k.box({x:180,y:312,w:600,h:66,title:'查询 HandlerMapping',sub:'找出目标 Bean 的方法及适用拦截器',tone:'accent'}),
    k.arrow({points:[[480,378],[480,408]]}),
    k.box({x:180,y:408,w:600,h:66,title:'选择 HandlerAdapter',sub:'解析与转换参数，按合同准备调用',tone:'accent'}),
    k.arrow({points:[[480,474],[480,504]]}),
    k.box({x:180,y:504,w:600,h:66,title:'调用 Controller 方法',sub:'执行应用的业务逻辑',tone:'accent'}),
    k.arrow({points:[[480,570],[480,600]]}),
    k.box({x:180,y:600,w:600,h:66,title:'处理返回值并完成响应',sub:'响应体经消息转换；视图分支另行解析',tone:'info'}),
    k.note({x:40,y:700,w:880,h:42,text:'箭头表示处理阶段顺序；Mapping 与 Adapter 由 DispatcherServlet 协调。'}),
  ].join(''),
});
