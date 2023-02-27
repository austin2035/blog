---
layout: '../../layouts/MarkdownPost.astro'
title: '浅谈 Go 1.18.1的切片扩容机制'
pubDate: 2022-04-17
description: '从Go源码分析切片的扩容机制。'
author: 'Austin'
cover:
    url: 'https://pic.lookcos.cn/i/usr/uploads/2023/02/1277661091.png'
    square: 'https://pic.lookcos.cn/i/usr/uploads/2023/02/1277661091.png'
    alt: 'cover'
tags: ["源码研究", "标准库", "golang", "slice"]
theme: 'dark'
featured: false
---

![golang 吉祥物](https://pic.lookcos.cn/i/usr/uploads/2023/02/1277661091.png)

Go 1.18.1的源码大小为439Mib

```bash
root@ubuntu:/home/lookcos/go# du -sh
439M	.
```

用`grep`命令可以在3秒内找到目标代码所在文件以及行数。

```bash
root@ubuntu:/home/lookcos/go# grep -rn "type slice struct" .
./src/runtime/slice.go:15:type slice struct {
./src/cmd/compile/internal/types/size.go:20://	type slice struct {
```

在`src/runtime/slice.go`的第十五行，可以看到对`slice`的定义：

```bash
15 type slice struct {
	      // 切片底层数组指针
16        array unsafe.Pointer
	      // 切片长度
17        len   int
	      // 切片容量
18        cap   int
19 }
```

### Go slice的扩容：

```go
nums := []int{1, 2}
nums = append(nums, 2, 3, 4)
```

对于上面的代码：

1. `nums`初始化时，cap大小为2。

2. 在进行`append`操作时，添加了3个元素。

此时`old.cap = 2`，容量至少为`cap=5`，那么就简单的扩容让`cap=5`了吗？



在 `src/runtime/slice.go`的166行处定义了扩容`slice`的函数。

```bash
166 func growslice(et *_type, old slice, cap int) slice {
...
188         newcap := old.cap
189         doublecap := newcap + newcap
190         if cap > doublecap {
191                 newcap = cap
192         } else {
193                 const threshold = 256
194                 if old.cap < threshold {
195                         newcap = doublecap
196                 } else {
197                         // Check 0 < newcap to detect overflow
198                         // and prevent an infinite loop.
199                         for 0 < newcap && newcap < cap {
200                                 // Transition from growing 2x for small slices
201                                 // to growing 1.25x for large slices. This formula
202                                 // gives a smooth-ish transition between the two.
203                                 newcap += (newcap + 3*threshold) / 4
204                         }
205                         // Set newcap to the requested cap when
206                         // the newcap calculation overflowed.
207                         if newcap <= 0 {
208                                 newcap = cap
209                         }
210                 }
211         }
...
```



#### 计算预估容量newcap

| 变量      | 含义                     | 说明                           |
| --------- | ------------------------ | ------------------------------ |
| old.cap   | 扩容前切片容量           |                                |
| newcap    | 预估容量                 | 默认为扩容前切片容量(old.cap)  |
| cap       | 扩容后至少需要的最小容量 | `old.cap` + 本次新增的元素数量 |
| doublecap | 扩容前切片的2倍容量      | old.cap * 2                    |

大致规则如下：

![https://pic.lookcos.cn/i/usr/uploads/2022/04/573066505.png](https://pic.lookcos.cn/i/usr/uploads/2022/04/573066505.png)

其中,当扩容前容量 >= 256时，会按照公式进行扩容，

```go
newcap += (newcap + 3*threshold) / 4
```

相较于1.7版本时，固定按照1.25倍的速率扩容，在1.81版本中改为了

> // Transition from growing 2x for small slices
> // to growing 1.25x for large slices. This formula
> // gives a smooth-ish transition between the two.

大概意思为：这个公式，对于容量小的切片，按照2倍的速率扩容和对于容量大的切片，按照1.25倍的速度扩容，为两者提供了平滑的过渡。



回到刚才的代码，按照这个规则，old.cap = 2, cap = 2 + 3 = 5，那么由于 cap > old.cap *2 ，所以**预估容量** newcap = cap = 5



### 内存对齐，进一步调整newcap

经过预估，得到了newcap = 5，但这并不是最终结果。

```go
    219         switch {
    220         case et.size == 1:
		...
    226         case et.size == goarch.PtrSize:
    ...
    232         case isPowerOfTwo(et.size):
    ...
    245         default:
    246                 lenmem = uintptr(old.len) * et.size
    247                 newlenmem = uintptr(cap) * et.size
    248                 capmem, overflow = math.MulUintptr(et.size, uintptr(newcap))
    249                 capmem = roundupsize(capmem)
    250                 newcap = int(capmem / et.size)
    251         }
```

`et`代表元素类型，所以这一步和元素类型有关。

以整型为例，预估容量 * 元素类型的大小，也即是 5 * 8 = 40 bytes （64位环境下）。

那么经过roundupsize函数调整，得到结果为 48 bytes，而48 bytes可以装下6个元素，对应调整代码为:

```go
newcap = int(capmem / et.size)
```

所以，最终容量的大小被调整为6。



其中`roundupsize`函数位于在`./src/runtime/msize.go`文件中。

它的作用是：返回mallocgc将分配的内存块的大小。

也就是，由Go语言的内存管理模块返回给你需要的内存块，通常这些内存块都是预先申请好，并且被分为常用的规格，比如8，16， 32， 48， 64等。

这里我们需要的内存是40 bytes，所以会分配一个足够用，且最接近的内存块。所以给48bytes，这时，重新调整后的容量 newcap就为6。



