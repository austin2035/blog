---
layout: '../../layouts/MarkdownPost.astro'
title: '数据结构笔记 03 - 链式栈'
pubDate: 2021-11-08
description: '栈（stack）是一种后进先出（Last In First Out, LIFO）的线性表，表尾有特殊含义，称为栈顶（top）。'
author: 'Austin'
cover:
    url: 'https://image.5050520.xyz/i/2023/02/27/1194dq4.png'
    square: 'https://image.5050520.xyz/i/2023/02/27/1194dq4.png'
    alt: 'cover'
tags: ["数据结构", "C", "栈", "链栈"]
theme: 'light'
featured: true
---

![数据结构之链式栈](https://image.5050520.xyz/i/2023/02/27/1194dq4.png)

## 什么是栈  

栈（stack）是一种后进先出（Last In First Out, LIFO）的线性表，表尾有特殊含义，称为栈顶（top）。

## 栈的操作  

栈最常用的操作有两种，一种是在表尾插入元素的操作称为入栈（push），也叫压栈；另一种是在表尾删除元素的操作称为出栈（pop）, 也叫弹栈。  

![栈|inline][1]

## 栈的表示  

栈有可以用数组表示，也即顺序栈，也可以用链表表示，叫做链式栈，简称链栈（本文主要讨论对象）。  
单链表可以在表头、表尾或者其他任意合法位置插入元素，如果只能在单链表的表尾插入和删除元素，那么就可以将其视为链栈。  
因此，在单链表的基础上，我们再维护一个**top**指针即可。  

![链式栈的表示|inline][2]

**注意**  
图中每个节点的指针域`next`指针指向下一个节点，而非下一个节点的指针域。

## 栈的节点定义与top指针  

定义表示链栈节点的结构体

```c
typedef struct stack_node {
    struct stack_node *next;
    void *data;
}stack_node;
```

定义表示链栈的结构体  

```c
typedef struct stack {
    struct stack_node *top;
    int length; // 表示栈的高度
}stack;
```

注意，**top**指针指向的是一个表示栈的节点的结构体。

## 函数清单  

下面是用于操作栈的函数名及其作用与复杂度  

|函数|作用|算法复杂度|
|----|----|----|
|stack_create|创建新的链式栈|O(1)|
|stack_release|释放栈，以及栈中的节点|O(N)|
|stack_push|入栈|O(1)|
|stack_pop|出栈|O(1)|
|stack_empty|释放栈中所有节点，但不释放栈本身|O(N)|

## 创建栈  

```c
/* 创建栈 */
stack *stack_create()
{
    stack *stack =  (struct stack*)malloc(sizeof(struct stack));
    /* 等价写法：
    stack *s =  (stack*)malloc(sizeof(stack)); */
    if(stack==NULL) return NULL;
    /* 初始化 */
    stack->length = 0;
    stack->top = NULL;
    return stack;
}
```

## 入栈  

```c
/* 入栈 */
stack *stack_push(stack *stack, void *data)
{
    /* 创建一个节点 */
    stack_node *node = (struct stack_node*)malloc(sizeof(struct stack_node));
    if(node==NULL) return NULL;
    node->data = data;

    /* 插入 */
    node->next = stack->top;
    stack->top = node;

    stack->length++;
    return stack;
}
```

在有元素入栈时，首先创建一个节点，然后执行插入操作，将新节点的后继节点`next`指向栈顶节点，接着移动栈顶指针至指向新节点`node`。最后，栈的高度自增1。

![入栈操作][3]

## 出栈  

```c
/* 出栈 */
void *stack_pop(stack *stack)
{
    /* 临时保存栈顶元素 */
    stack_node *curr = stack->top;
    if(curr==NULL) return NULL;
    void *data = curr->data;
    stack->top = stack->top->next;

    free(curr);
    stack->length--;
    return data;
}
```

出栈时，首先临时保存栈顶节点指针，用于在返回栈顶节点数据域的值之前的释放操作。接着移动栈顶指针至栈顶节点的下一个节点。最后释放临时保存的节点，栈的高度自减1，返回数据，出栈操作完成。

## 清空栈  

```c
/* 清空栈中所有元素，但不释放栈本身 */
void stack_empty(stack *stack)
{
    int length = stack->length;
    stack_node *curr, *next;
    curr = stack->top;

    /* 根据栈的高度确定删除节点的次数 */
    while (length--)
    {
        next = curr->next;
        free(curr);
        curr = next; 
    }
    
    stack->length = 0;
    stack->top = NULL;
}
```

## 清除栈  

```c
/* 清空栈中所有元素并删除栈 */
void stack_release(stack *stack)
{
    stack_empty(stack);
    free(stack);
}
```

## 测试  

同样的，我们在main函数中测试。

```c
int main()
{
    char a = 'a';
    char b = 'b';
    char c = 'c';

    /* 创建一个栈 */
    stack *stack = stack_create();

    printf("%p\n", stack_pop(stack));

    /* 压栈 */
    stack_push(stack, &a);
    stack_push(stack, &b);
    stack_push(stack, &c);
    /* 出栈 */
    while (stack->length > 0)
    {
        printf("%c\n", *(char *)stack_pop(stack));
    }

    /* 压栈 */
    stack_push(stack, &a);
    stack_empty(stack);
    printf("%p\n", stack_pop(stack));

    /* 释放栈 */
    stack_release(stack);
    return 0;
}
```

编译并输出  

```bash
# gcc -fsanitize=address -fno-omit-frame-pointer  -g stack.c  && ./a.out
(nil)
c
b
a
(nil)
```

## 完整代码  

完整代码，详见代码清单。  


  [1]: https://image.5050520.xyz/i/usr/uploads/2021/11/3955121569.png
  [2]: https://image.5050520.xyz/i/usr/uploads/2021/11/4263534373.png
  [3]: https://image.5050520.xyz/i/usr/uploads/2021/11/3021582.png