---
layout: '../../layouts/MarkdownPost.astro'
title: '数据结构笔记 01 - C 基础'
pubDate: 2021-11-06
description: '指针是 C 语言的精华部分，同时也是表示链式存储结构的关键所在。理解了指针的基础概念，再理解单链表等链式数据结构就不再是个难题。'
author: 'Austin'
cover:
    url: 'https://pic.lookcos.cn/i/2023/02/27/1194dq4.png'
    square: 'https://pic.lookcos.cn/i/2023/02/27/1194dq4.png'
    alt: 'cover'
tags: ["数据结构", "C", "C指针"]
theme: 'light'
featured: true
---

![封面](https://pic.lookcos.cn/i/2023/02/27/1194dq4.png)


## 关于指针

指针是C语言的精华部分，同时也是表示链式存储结构的关键所在。理解了指针的基础概念，再理解单链表等链式数据结构就不再是个难题。

## 理解指针和指针变量  

变量是用来存放数据的，指针是内存地址，指针变量就是用来存放内存地址的变量。

```c
    // 声明一个整型变量age，值是17
    int age = 17;
    // 声明一个整型指针，指向变量age的地址， &符号可以理解为 <取地址符号>
    int *p = &age;
    printf("age的值：%d\n", age);
    printf("*p的值：%d\n", *p);
    printf("变量 age的地址：%p\n", &age);
    printf("指针p指向的地址：%p\n", p);
    printf("指针p自身的地址：%p\n", &p);
```

输出如下：  

```bash
    age的值：17  
    *p的值：17  
    变量 age的地址：000000000062FE1C  
    指针p指向的地址：000000000062FE1C  
    指针p自身的地址：000000000062FE10  
```

## 指针图解

![C 语言指针][1]

## 关于内存  

你可能会对内存地址产生疑惑，可以大致这样理解。

|变量名|  内存地址   | 值  |
|  ---- |  ----  | ----  |
|age| 000000000062FE1C   | 17 |
|p| 000000000062FE10   | 000000000062FE1C |

整型指针变量p，存储的值是整型变量age的内存地址。  
符号`&`是取地址符，那么&age = 000000000062FE1C;由于指针变量本身也是一个变量，所以p也有一个自己的地址，对其取地址操作&p=000000000062FE10;
而`*p`则是获取指针变量p存储的值对应内存地址中存储的值。

[1]: https://pic.lookcos.cn/i/usr/uploads/2021/11/3435806864.png


## struct的声明

**结构体**（struct）在C编程中经常用到，对于学过面向对象编程语言的同学可以不严谨的理解为只有属性没有方法的对象。**结构体声明**描述了一个对象的组成布局。

声明一个用于描述学生的struct：  

```c
struct student {
    char name[64];
    int age;
    int class;
}
```

其中`student`称为**结构体标记**。试着把`struct student`理解成一种类似`int`的变量类型。就可以开始使用这个结构体了：  

## struct的初始化  

### 可以一次性初始化所有属性  

```c
struct student stu = {"austin", 19, 3};
```

**注意：**  
大括号里值的顺序，要与声明结构体的属性顺序保持一致。

### 也可以先声明再分别初始化  

```c
struct student stu;
strcpy(stu.name, "austin");
stu.age = 19;
stu.class = 3;
```

**关于strcpy函数**  
strcpy函数来自C标准库 <string.h>, 使用时不要忘记`include`。由于C语言中没有类似`String`的变量类型，我们想要使用字符串一般使用字符数组来表示，但是字符数组不能被字符串直接赋值，而`strcpy`函数可以解决此问题。

### struct的属性声明与变量声明可以合并

```c
struct student {
    char name[64];
    int age;
    int class;
}stu;
/* 然后就可以初始化这个结构体了
strcpy(stu.name, "austin");
stu.age = 19;
stu.class = 3; */
```

### 初始化也能写在一起  

```c
struct student {
    char name[64];
    int age;
    int class;
}stu = {"austin", 19, 3};
```

可以是多个变量一起初始化：

```c
struct student {
    char name[64];
    int age;
    int class;
}stu = {"austin", 19, 3},
stu2 = {"tim", 78, 100};
```

### 结构体的标记可以省略  

假如你只需要一个`struct student`的变量`stu`,那么可以省略结构体的标记`student`：  

```c
struct {
    char name[64];
    int age;
    int class;
}stu;
```

这样有一个坏处，那就是你不能像 `struct student stu`这样声明别的变量了。

## struct 的使用  

定义结构体变量，访问成员时就用.
定义结构体指针，访问成员时就用->

```c
struct student {
    char name[64];
    int age;
    int class;
}stu;

// 初始化结构体变量
strcpy(stu.name, "austin");
stu.age = 19;
stu.class = 3;

struct student *stu_ptr = &stu;

// 使用 . 访问结构体变量成员
printf("age: %d\n", stu.age);
// 使用 -> 访问
printf("age: %d\n", stu_ptr->age);
```

## 使用typedef  

比如有这样一个结构体：

```c
struct student {
    char name[64];
    int age;
    int class;
}
```

如上述，使用此结构体时，我们这样声明变量 `struct student stu`。
可以用`typedef`关键字为`struct student`指定一个别名：

```c
typedef struct student s;
```

上面的代码，我们将`struct student`指定为别名`s`，那么语句`s stu;`就等价于`struct student stu;`，显然更加简洁和方便。
我们可以在定义结构体时就加上`typedef`关键字,就可以将上面的代码合并为：

```c
typedef struct student {
    char name[64];
    int age;
    int class;
}s;
```

## 小结  

尽管`struct`的使用方法多种多样，但理解起来不算困难。建议熟练掌握`struct`的使用，它是学习数据结构体的基础语法。
