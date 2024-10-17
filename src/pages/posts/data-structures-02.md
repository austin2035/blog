---
layout: '../../layouts/MarkdownPost.astro'
title: '数据结构笔记 02 - 单链表'
pubDate: 2021-11-07
description: '当你学会了用C语言描述单链表的时，后面的堆、栈、双向链表、哈希表等用C描述将不在话下。'
author: 'Austin'
cover:
    url: 'https://image.5050520.xyz/i/2023/02/27/1194dq4.png'
    square: 'https://image.5050520.xyz/i/2023/02/27/1194dq4.png'
    alt: 'cover'
tags: ["数据结构", "C", "链表"]
theme: 'light'
featured: true
---

![数据结构之链表](https://image.5050520.xyz/i/2023/02/27/1194dq4.png)

## 本节的重要性

因为单链表是非常基础的链式结构，所以当你学会了用 C 语言描述单链表的时，后面的堆、栈、双向链表、哈希表等用 C 描述将不在话下。  
如果你是一名初学者，那更应该仔细阅读本篇，**强烈建议**自己敲一遍代码。

## 单链表的节点

![单链表的节点表示|inline][1]
如图所示，单链表的节点分为数据域和指针域，可以将它们视为一个整体，称之为**节点**，稍后我们会用结构体来表示节点。  
**数据域**，顾名思义，就是存放数据的地方。  
**指针域**，是用来存放指针变量的地方，指针指向下一个节点的地址。

## 单链表的表示

单链表是线性表的**链式**表示和实现。把节点链接起来，就形成了单链表。

![单链表示意图|wide][2]

## 定义表示节点的结构体

如何用 C 语言描述节点？这里我们用到了`struct`。

```c
struct node {
    /* 后继节点 */
    struct node *next;
    /* 值 */
    int data;
};
```

首先我们定义了一个结构体，结构体的标记为`node`。  
其次，它具有两个属性，一个是`int`类型的`data`，也就是上文提到的数据域。还一个是指针域。
**如何理解`struct node *next`呢？**  
要知道，指针域是存放指针变量的，这个变量名叫做 `next`,又因为这个指针是指向下一个节点的地址的，换句话说，这个指针指向的是一个我们定义的用来表示节点的结构体。所以这个指针变量的类型为 `struct node`。星号`*`表示它是指针变量。所以合起来就是`struct node *next`。
最后，为了方便，我们可以使用`typedef`关键字为`struct node`取一个别名。

```c
typedef struct node {
    /* 后继节点 */
    struct node *next;
    /* 值 */
    int data;
}list;
```

这样，在后面的代码书写中, `list`就等价于`struct node`了。
比如我们使用这个结构体创建一个新的节点， `list *new_node`就等价于`struct node *new_node`。

## 单链表的创建

```c
list * create_list()
{
    /* 创建一个新的节点，由于使用了typedef关键字，此处 node *head与struct node *head等价    */
    list *head = (list *)malloc(sizeof(list));
    if(head==NULL) return NULL;
    /* 初始化节点 */
    head->data = 0; // 头结点数据域，我们用来表示链表长度
    head->next = NULL;
    return head;
}
```

![头指针|inline][3]

此函数会创建一个单链表，并返回头指针。
头指针是指向头结点地址的指针，和节点中指向下一个节点的指针是相同类型。  
首先，我们用`malloc`函数开辟了一块`list`大小的内存，并返回了指向该内存块首地址的指针，同时将此指针赋值给头指针变量。  
接着，判断此指针是否为空，为空，则说明内存申请失败（一般不会）。  
然后，对该节点进行初始化。  
最后，函数返回头指针，结束。

**为什么设置头节点？**  
头节点的数据域一般无意义，这里为了方便后面的插入和删除操作而设置，头节点并非链表所必须。  
头节点后面的第一个元素节点，称为首元节点。

## 单链表的插入

试想如下情况，一个新的节点`n`，要插入到`x`节点后。

![单链表的插入][4]

图中虚线表示断开连接，下同。  
按照一般思路可能是:

```c
x->next = n;
n->next = x->next;
```

显然，这是错误的，因为执行`x->next = n`之后，`n->next = x->next`等价于`n->next = n` ，所以正确的做法应该是这样；

```c
n->next = x->next;
x->next = n;
```

完整版插入函数：
插入函数接受三个参数，被插入节点的链表的指针`head`，新结点的数据`data`，和要插入的位置`pos`;

```c
list * list_insert_node(list *head, int data, int pos)
{
    int i;
    list *curr = head;

    /* 如果要插入的位置比链表长，则属于非法操作 */
    if(pos > curr->data) return NULL;

    /* 创建一个节点，并初始化 */
    list *node = (list *)malloc(sizeof(list));
    if(node==NULL) return NULL;
    node->data = data;
    node->next = NULL;

    /* 遍历链表，找到要插入的位置 */
    for(i=0;i<pos;i++){
        curr = curr->next;
    }

    /* 插入 */
    node->next = curr->next;
    curr->next = node;

    /* 链表长度+1 */
    head->data++;
    return head;
}
```

可以在 main 函数中调用测试：

```c
list *l = create_list();
printf("当前链表长度：%d\n", l->data);
list_insert_node(l, 1, 0);
printf("当前链表长度：%d\n", l->data);
```

使用 gcc 编译:

```bash
gcc -fsanitize=address -fno-omit-frame-pointer  -g linked_list.c  && ./a.out
```

输出正常且无内存报错信息：

```
当前链表长度：0
当前链表长度：1
```

## 单链表的遍历

较为简单，不再解释

```c
/* 打印链表数据，但不包括头结点的数据*/
void print_list(list *head)
{
    list *curr = head->next;
    while (curr)
    {
        printf("%d \t", curr->data);
        curr = curr->next;
    }
    printf("\n");
}
```

## 单链表的删除

![单链表的删除][5]
假设要删除 head 后的节点，那么直接让`head->next = head->next->next`即可，但不要忘记释放被删除的节点。
基于此思路：

```c
list *list_delete_data(list *head, int pos)
{
    int i;
    list *curr = head;

    /* 如果要删除的位置比链表长，则属于非法操作 */
    if(pos > curr->data) return NULL;

    /* 遍历链表，找到要删除的节点的前一个节点的指针 */
    for(i=0;i<pos;i++){
        curr = curr->next;
    }
    // 临时记录将被删除的节点
    list *temp = curr->next;
    // 删除节点
    curr->next = curr->next->next;

    //释放掉被删除节点的内存
    free(temp);
    head->data--;
    return head;
}
```

## 单链表的测试

这样，一个基础的链表就写好了，可以在`main`函数中测试。

```c
int main()
{
    int i;
    list *l = create_list();
    // 多次插入数据
    for(i=0;i<5;i++){
        list_insert_node(l, i, 0);
        print_list(l);
    }
    list_delete_data(l, 0);
    print_list(l);
    return 0;
}
```

编译与输出：

```c
# gcc -fsanitize=address -fno-omit-frame-pointer  -g linked_list.c  && ./a.out
0
1       0
2       1       0
3       2       1       0
4       3       2       1       0
3       2       1       0
```

## 完整代码

完整代码，详见代码清单。

[1]: https://image.5050520.xyz/i/usr/uploads/2021/11/1747607747.png
[2]: https://image.5050520.xyz/i/usr/uploads/2021/11/3633212832.png
[3]: https://image.5050520.xyz/i/usr/uploads/2021/11/2905050129.png
[4]: https://image.5050520.xyz/i/usr/uploads/2021/11/689852720.png
[5]: https://image.5050520.xyz/i/usr/uploads/2021/11/1797261647.png
