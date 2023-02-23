---
layout: '../../layouts/MarkdownPost.astro'
title: 'Golang net/http & HTTP Serve 源码分析'
pubDate: 2035-06-01
description: '很多Go web框架都通过封装 net/http 来实现核心功能，因此学习 net/http 是研究 Gin等框架的基础。'
author: 'Austin'
cover:
    url: 'https://lookcos.cn/usr/uploads/2022/04/2067928922.png'
    square: 'https://lookcos.cn/usr/uploads/2022/04/2067928922.png'
    alt: 'cover'
tags: ["源码研究", "标准库", "golang", "gin"]
theme: 'light'
featured: false
---

![Go HTTP Server的大致处理流程|wide](https://lookcos.cn/usr/uploads/2023/02/3697706570.png)

服务器在收到请求时，首先进入路由 Router，接着路由会根据 request 请求的路径，找到对应的处理器(Handler)，处理器再根据 request 进行处理并构造 response 进行返回。

## 利用标准库实现一个简单HTTP Server

向**main.go**文件写入如下内容：

```go
package main

import (
    "fmt"
    "net/http"
)

// 方法一
type HelloContext struct {
    content string
}

func(h *HelloContext) ServeHTTP(w http.ResponseWriter, r *http.Request) {
    fmt.Fprintf(w, h.content)
}

// 方法二
func helloHandler(w http.ResponseWriter, r *http.Request) {
    fmt.Fprintf(w, "Hello, net/http! v2\n")
}

func main() {
    http.Handle("/v1", &HelloContext{content: "Hello, net/http! v1\n"})
    http.HandleFunc("/v2", helloHandler)
    http.ListenAndServe(":8080", nil)
}
```

运行后，可以用 curl 工具进行测试：

```bash
mac:~ $ curl 127.0.0.1:8080/v1
Hello, net/http! v1
mac:~ $ curl 127.0.0.1:8080/v2
Hello, net/http! v2
```

这段代码我们用 http.Handle 和 http.HandleFunc 两种方法分别在路径 /v1 和 /v2 上注册了两个 http.Handler。注意：Handle 和 Handler 是两个东西。  
这两个 Handler 都对 request 进行了处理，并且通过 fmt.Fprintf 方法写入并返回数据。

## 处理器

### http.Handler

先来了解一下 http.Handler (处理器)，

```go
type Handler interface {
 ServeHTTP(ResponseWriter, *Request)
}
```

它被定义为一个拥有 ServeHTTP 方法的接口，也就是说任何类型，只要实现了 ServeHTTP 方法，就实现了 http.Handler 接口。

ServeHTTP 方法会读取 *Request 信息，并且向 ResponseWriter 写入 header 与 body 内容。

## 路由注册

### http.Handle

从 main函数出发，来看 http.Handle 函数源码:

```go
func Handle(pattern string, handler Handler) { 
  DefaultServeMux.Handle(pattern, handler) 
}
```

可以看到，http.Handle 函数调用了 DefaultServeMux.Handle 方法。

### http.HandleFunc

再来看 http.HandleFunc 的源码：

```go
func HandleFunc(pattern string, handler func(ResponseWriter, *Request)) {
 DefaultServeMux.HandleFunc(pattern, handler)
}
```

它也调用了 DefaultServeMux.HandleFunc 方法，再看此方法源码：

```go
func (mux *ServeMux) HandleFunc(pattern string, handler func(ResponseWriter, *Request)) {
 if handler == nil {
  panic("http: nil handler")
 }
 mux.Handle(pattern, HandlerFunc(handler))
}
```

不难看出，http.Handle 和 http.HandleFunc 都调用了一个和 ServeMux 对象的 Handle 方法有关。

这两个方法的作用都是将传入的处理器 (Handler) 注册到对应的路由规则 (pattern)上。

比如，倒数第三行将 处理器 helloHandler 注册到了路由规则 (路径) /v2 上。这样，当 HTTP 请求的地址是 /v2的时候，就由处理器 helloHandler 来负责处理请求，并且响应。

mux.Handle 方法中还有一个 http.HandlerFunc ，注意不是 HandleFunc。

## 适配器与处理器

### http.HandlerFunc

```go
type HandlerFunc func(ResponseWriter, *Request)
```

HandlerFunc 可以理解为一个适配器，它允许使用普通的函数成为处理器 Handler 对象，前提是这个普通函数拥有 func(ResponseWriter, *Request) 签名。

上文说到，任何类型只要实现了 ServeHTTP 方法，那它就实现了 Handler接口，它就是一个 Handler 类型。

```go
func (f HandlerFunc) ServeHTTP(w ResponseWriter, r *Request) {
 f(w, r)
}
```

这里呢，非常的巧妙，HandlerFunc 类型实现了 ServeHTTP 方法，并且又将 ServeHTTP方法的参数传给了自身。

也就是说：

1. 一个普通的函数，只要参数是 ResponseWriter 和 *Request，或者换种标准点的说法，它的函数签名为 func(ResponseWriter,*Request)，那么它就是 HandlerFunc 类型。
2. 由于 HandlerFunc 自身实现了 ServeHTTP方法，所以这个普通函数又实现了 Handler 接口，成了 Handler 类型。

到这里，如何注册、DefaultServeMux 和 ServeMux 是什么，我们暂时还不知道，为了便于理解，这个下文再说。

## 监听与服务

### http.ListenAndServe

接着往下走，看一下 http.ListenAndServe 做了哪些事情：

```go
// ListenAndServe listens on the TCP network address addr and then calls
// Serve with handler to handle requests on incoming connections.
// Accepted connections are configured to enable TCP keep-alives.
//
// The handler is typically nil, in which case the DefaultServeMux is used.
//
// ListenAndServe always returns a non-nil error.
func ListenAndServe(addr string, handler Handler) error {
 server := &Server{Addr: addr, Handler: handler}
 return server.ListenAndServe()
}
```

不难看出，http.ListenAndServe 负责监听 TCP 网络地址 addr, 代码中写的是`:8080` 也即是监听 8080 端口，并且处理相关的请求。

这里传入的第二个参数是 Handler 类型，根据注释可以看出：如果传入值为 nil ，那么将会使用 DefaultServeMux 。

## 服务复用器

### DefaultServeMux

```go
// DefaultServeMux is the default ServeMux used by Serve.
var DefaultServeMux = &defaultServeMux

var defaultServeMux ServeMux
```

说白了，DefaultServeMux 是 ServeMux 类型的一个实例，由标准库创建。

下面看 ServeMux 结构体的源码。

### ServeMux

ServeMux 是一个结构体，它的作用是服务复用器。

```go
type ServeMux struct {
 mu    sync.RWMutex
 m     map[string]muxEntry
 es    []muxEntry // slice of entries sorted from longest to shortest.
 hosts bool       // whether any patterns contain hostnames
}
```

因为涉及并发，所以这里有个读写锁 mu，主要用于保护下面的 map 类型的成员 m。

es 与 hosts 和路由规则匹配有关。

这里重点关注一下 m，它是一个 map ，key 是 string 类型的路由表达式，val 是 muxEntry 类型的结构体。

```go
type muxEntry struct {
 h       Handler
 pattern string
}
```

muxEntry 结构体，描述了路由规则 pattern 对应的处理器  h。

### mux.Handle

上文中，http.Handle 和 http.HandleFunc 都调用了 mux.Handle 方法。

它是结构体 ServeMux 的方法，也就是说，此方法主要把 Handler 对象注册到给定的 pattern 上，也即**路由注册**。

```go
// Handle registers the handler for the given pattern.
// If a handler already exists for pattern, Handle panics.
func (mux *ServeMux) Handle(pattern string, handler Handler) {
  // 为了保护 ServeMux 成员 map 类型的 m 的读写，分别在方法开始和结束的时候进行加锁和解锁的操作。
 mux.mu.Lock()
 defer mux.mu.Unlock()
 // 如果路由规则 pattern 为空，则直接 panic。
 if pattern == "" {
  panic("http: invalid pattern")
 }
  // 如果 http.Handler 类型的处理器 handler 为空，则panic。
 if handler == nil {
  panic("http: nil handler")
 }
  // 如果路由规则 pattern 已经存在，则直接 panic。
 if _, exist := mux.m[pattern]; exist {
  panic("http: multiple registrations for " + pattern)
 }
 // 如果成员 m 为空，则 make 一个新的 map。
 if mux.m == nil {
  mux.m = make(map[string]muxEntry)
 }
  // 创建一个 muxEntry，并将 pattern 对应的 Handler 放进去。
 e := muxEntry{h: handler, pattern: pattern}
  // 写入 m， key 为 pattern ，value 为新建的 muxEntry 类型的 e ，也即新增一个路由规则。
 mux.m[pattern] = e
  // 如果路由规则以字符 / 结尾，则给将新建的 muxEntry 类型的 e 放到成员 es 中。
  // es 是一个切片，使用 http.appendSorted 方法加入元素，以确保 es 中的元素(路由)是从最长到最短。
 if pattern[len(pattern)-1] == '/' {
  mux.es = appendSorted(mux.es, e)
 }
  // 最后，如果路由规则不是以字符 / 开头，那么给成员 hosts 赋值 true 。
 if pattern[0] != '/' {
  mux.hosts = true
 }
}
```

### mux.ServeHTTP

我把 ServeMux 的 ServeHTTP 方法简称为 mux.ServeHTTP，下文也是一样。

```go
func (mux *ServeMux) ServeHTTP(w ResponseWriter, r *Request) {
 if r.RequestURI == "*" {
  if r.ProtoAtLeast(1, 1) {
   w.Header().Set("Connection", "close")
  }
  w.WriteHeader(StatusBadRequest)
  return
 }
 h, _ := mux.Handler(r)
 h.ServeHTTP(w, r)
}
```

ServeMux 结构体同样实现了 ServeHTTP 方法，也即它也实现了 Handler 接口，是一个 Handler 类型的对象。

但它并不负责处理具体的请求，篇幅有限，这里给出，调用的 mux.Handler 方法签名：

```go
func (mux *ServeMux) handler(host, path string) (h Handler, pattern string)
```

总的来说，mux.ServeHTTP  调用了 mux.Handler 方法，通过 host 和 path 找到具体的 处理器 Handler 和路由规则 pattern ，然后让对应的 Handler 的 ServeHTTP 方法去处理请求。

## 连接与请求的处理

其实搞懂上面方法以及其之间的关系，对于进一步的学习 Go Web 框架 (比如 Gin ) 就已经有很大的帮助了。从监听与服务开始，代码更加底层，这里我主要关心的是，一次请求是如何到达 ServeHTTP 的。

http.ListenAndServe 方法中，使用传入的监听地址 addr 和处理器 handler 初始化一个 HTTP 服务器 http.Server。

Server 结构体，主要定义了需要跑一个 HTTP Server 所需要的参数：

### Server

```go
type Server struct {
 Addr string
 Handler Handler // handler to invoke, http.DefaultServeMux if nil
  
 TLSConfig *tls.Config
 ReadTimeout time.Duration
 ReadHeaderTimeout time.Duration
 WriteTimeout time.Duration
 IdleTimeout time.Duration
 MaxHeaderBytes int
 TLSNextProto map[string]func(*Server, *tls.Conn, Handler)
 ConnState func(net.Conn, ConnState)
 ErrorLog *log.Logger
 BaseContext func(net.Listener) context.Context
 ConnContext func(ctx context.Context, c net.Conn) context.Context
 inShutdown atomicBool // true when server is in shutdown
 disableKeepAlives int32     // accessed atomically.
 nextProtoOnce     sync.Once // guards setupHTTP2_* init
 nextProtoErr      error     // result of http2.ConfigureServer if used
  
 mu         sync.Mutex
 listeners  map[*net.Listener]struct{}
 activeConn map[*conn]struct{}
 doneChan   chan struct{}
 onShutdown []func()
}
```

这些参数不是重点，接着往下。

### server.ListenAndServe

```go
func (srv *Server) ListenAndServe() error {
 if srv.shuttingDown() {
  return ErrServerClosed
 }
 addr := srv.Addr
 if addr == "" {
  addr = ":http"
 }
 ln, err := net.Listen("tcp", addr)
 if err != nil {
  return err
 }
 return srv.Serve(ln)
}
```

Server 结构体的 ListenAndServe 方法会监听 TCP 网络地址 addr ，然后调用 srv.Serve 处理传入连接的请求。

### srv.Serve

```go
func (srv *Server) Serve(l net.Listener) error {
 // ...省略部分
 for {
    // 循环监听 TCP 连接
  rw, err := l.Accept()
  if err != nil {
    ...省略部分 
  connCtx := ctx
  if cc := srv.ConnContext; cc != nil {
   connCtx = cc(connCtx, rw)
   if connCtx == nil {
    panic("ConnContext returned nil")
   }
  }
  tempDelay = 0
  c := srv.newConn(rw)
  c.setState(c.rwc, StateNew, runHooks) // before Serve can return
  go c.serve(connCtx)
 }
}
```

Serve 方法在 Listenner l 上接受传入的连接，并且为每一个连接创建 goroutine 。这些 gorutines 会读取请求并且调用 srv.Handler 去响应它们。

### c.Serve

```go
// Serve a new connection.
func (c *conn) serve(ctx context.Context) {
  // ...
 for {
    // 循环接受请求，一个连接可以处理多个请求
  w, err := c.readRequest(ctx)
  if c.r.remain != c.server.initialReadLimitSize() {
   // If we read any bytes off the wire, we're active.
   c.setState(c.rwc, StateActive, runHooks)
  }
  // 这行代码是重点
  serverHandler{c.server}.ServeHTTP(w, w.req)
  inFlightResponse = nil
  w.cancelCtx()
  if c.hijacked() {
   return
  }
 }
}
```

### serverHandler

serverHandler 结构体是一个代理，它会代理 server 的 Handler 或 DefaultServeMux 。

```go
type serverHandler struct {
 srv *Server
}

func (sh serverHandler) ServeHTTP(rw ResponseWriter, req *Request) {
  // 这个 handler 就是最初 http.ListenAndServe 传入的 Handler 类型的 handler 。
 handler := sh.srv.Handler
  // 如果 http.ListenAndServe 第二个参数是 nil，那么使用 DefaultServeMux 。
 if handler == nil {
  handler = DefaultServeMux
 }
 if req.RequestURI == "*" && req.Method == "OPTIONS" {
  handler = globalOptionsHandler{}
 }
  
 if req.URL != nil && strings.Contains(req.URL.RawQuery, ";") {
  var allowQuerySemicolonsInUse int32
  req = req.WithContext(context.WithValue(req.Context(), silenceSemWarnContextKey, func() {
   atomic.StoreInt32(&allowQuerySemicolonsInUse, 1)
  }))
  defer func() {
   if atomic.LoadInt32(&allowQuerySemicolonsInUse) == 0 {
    sh.srv.logf("http: URL query contains semicolon, which is no longer a supported separator; parts of the query may be stripped when parsed; see golang.org/issue/25192")
   }
  }()
 }
  // 调用 handler 的 ServeHTTP 方法处理请求。
 handler.ServeHTTP(rw, req)
}
```

到这里，连接中的请求，就交给了 handler.ServeHTTP 也即 mux.ServeHTTP 方法来处理。

然后 mux.ServeHTTP 方法中，mux.Handler 方法，会根据 request 中的 host 和 path 信息，找到对应的 Handler， 这个 Handler 再处理信息。

### 总结

Go net/http 标准库，能让我们轻易地写出一个高性能的 HTTP Server，但肯定不能满足实际业务开发，比如动态路由、中间件、鉴权等这是标准库所不具有的。  

很多重复性的工作和常用的工具与特性要由框架来封装和实现，go 很多高性能框架 比如 Gin 都是直接封装了 net/http，这一点难能可贵，由此可见 Go 标准库的价值。  

所以学习优秀 Go web 框架的前提就是弄清楚 net/http Server 部分的源码，同时，也能方便更好的去使用和优化框架。  
本文所使用的源码均来自 go 1.18.3，部分方法说明翻译自官方注释。  

如有不当之处，请批评指出。
