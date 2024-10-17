---
layout: '../../layouts/MarkdownPost.astro'
title: '数据结构笔记 05 - 双链表'
pubDate: 2021-11-10
description: '双端链表也叫双向链表或双链表，它是一种非常实用的数据结构。'
author: 'Austin'
cover:
    url: 'https://image.5050520.xyz/i/2023/02/27/1194dq4.png'
    square: 'https://image.5050520.xyz/i/2023/02/27/1194dq4.png'
    alt: 'cover'
tags: ["数据结构", "C", "双链表"]
theme: 'light'
featured: true
---

![数据结构之双端链表](https://image.5050520.xyz/i/2023/02/27/1194dq4.png)

## 关于双端链表  

双端链表也叫双向链表或双链表，它是一种非常实用的数据结构。单链表的节点只有一个指针域，且指向下一个节点，而双链表则有两个指针域，分别指向直接前驱和直接后继。同时也意味着，表头和表尾都能方便的进行插入和删除的操作，进而能轻易同时实现**栈**和**队列**的功能。

## 双端链表的实现

### 双链表的表示  

双链表可以用表示链表节点的`list_node`和表示链表本身的`list`两个结构体来表示。**下面的代码，参考了redis的双端链表**。

![双链表的表示|wide][1]

```c
/* 链表节点 */
typedef struct list_node 
{   
    /* 前驱节点 */
    struct list_node *prev;
    /* 后继节点 */
    struct list_node *next;
    /* 值 */
    void *value;
} list_node;

/* 链表 */
typedef struct list
{   
    /* 表长度 */
    unsigned long length;
    /* 表头 */
    list_node *head;
    /* 表尾 */
    list_node *tail;
} list;
```

- 链表节点(list_node)带有**prev**和**next**两个指针，这意味着，可以从表头到表尾或表尾到表头两个方向遍历或迭代链表。  
- 链表本身(list)和队列(queue)类似，维护**head**和**tail**两个指针，这意味着，在表头或者表尾的插入的复杂度为O(1)，而单链表在表尾执行插入操作时，需要从表头遍历到表尾后插入，复杂度为O(n)。  

### 函数清单  

下面是用于操作队列的函数名及其作用与复杂度  

|函数|作用|算法复杂度|
|----|----|----|
|list_create|创建新链表|O(1)|
|list_empty|清空链表节点，但不清除链表本身|O(N)|
|list_release|清除整个链表|O(N)|
|list_add_node_head|在表头添加一个节点|O(1)|
|list_add_node_tail|在表尾添加一个节点|O(1)|
|list_get_value_head|获取表头节点数据|O(1)|
|list_get_value_tail|获取表尾节点数据|O(1)|
|list_del_node|删除一个节点|O(1)|
|list_get_iterator|创建一个迭代器|O(1)|
|list_release_iterator|释放迭代器|O(1)|
|list_next|获取迭代器下一个节点值|O(1)|

### 双链表的创建  

```c
/* 创建链表 */
list *list_create(void)
{
    /* 创建链表 */
    list *list = (struct list *)malloc(sizeof(struct list));
    if(list==NULL) return NULL;
    
    /* 初始化链表 */
    list->head = list->tail = NULL;
    list->length = 0;
    
    return list;
}
```

![双端链表的创建|inline][2]  


### 表头插入操作  

```c
/* 添加一个节点在链表头部 */
list * list_add_node_head(list *list, void *value)
{   
    /* 新建一个链表节点 */
    list_node *node = (list_node *)malloc(sizeof(list_node));
    if(node==NULL) return NULL;
    node->value = value;
    /* 如果链表为空 */
    if(list->length == 0) {
        list->head = list->tail = node;
        node->prev = node->next = NULL;
    }else {
        /* 设置新节点 */
        node->prev = NULL;
        node->next = list->head;
        /* 设置链表 */
        list->head->prev = node;
        list->head = node;
    }
    list->length++;
    return list;
}
```

首先，创建一个新的链表节点。  
然后，判断双链表的长度，也即判断双链表是否为空。  
如果为空，则让链表的头尾指针`head`与`tail`都指向该新节点，且新节点(node)指向前驱节点的指针`prev`和指向后继节点的指针`next`都设置为**NULL**。

![list_insert2.png][3]

如果不为空，则说明链表中已有节点存在。  
此时，先设置新节点，指针`prev`置为`NULL`，指针`next`指向链表头指针(head)指向的节点，也即表头节点。  
然后让头指针指向的节点的`prev`指针指向新节点。  
最后，将指针`head`指向新节点。

![list_insert.png][4]

执行完节点的插入操作后，别忘了让链表长度自增1。

### 表尾插入操作  

```c
/* 添加一个节点在链表尾部 */
list * list_add_node_tail(list *list, void *value)
{
    /* 新建一个链表节点 */
    list_node *node = (list_node *)malloc(sizeof(list_node));
    if(node==NULL) return NULL;
    node->value = value;
    if(list->length==0) {
        list->head = list->tail = node;
        node->prev = node->next = NULL;
    } else {
        node->prev = list->tail;
        node->next = NULL;
        list->tail->next = node;
        list->tail = node;
    }
    list->length++;
    return list;
}
```

首先，也要创建一个新的链表节点。  
接着也需要判断链表是否为空，如果是，则与链表为空时表头的插入操作相同。  
否则，让新节点`prev`指向链表表尾节点，`next`置为`NULL`。  
然后，链表的`tail->next`指向新节点，表尾指针`tail`指向新节点。  
最后，插入完成，链表长度自增1。  

![链表插入|wide][5]

### 节点的删除

```c
/* 删除一个节点 */
void list_del_node(list *list, list_node *node)
{   
    /* 判断该节点是否有直接前驱 */
    if (node->prev)
        node->prev->next = node->next;
    else
        list->head = node->next;
    
    /* 判断该节点是否有直接后继 */
    if (node->next)
        node->next->prev = node->prev;
    else
        list->tail = node->prev;
    
    /* 释放该节点 */
    free(node);
    list->length--;
}
```

该方法主要用于从表头或者表尾获取数据后对其节点的删除操作。  

首先判断该节点是否有直接前驱，如果有，则将直接前驱的`next`指针指向该节点的直接后继。如果没有，则说明该节点是首元节点，位于表头，将表头指针指向该节点的直接后继即可。  

接着是判断该节点是否有直接后继，如果有，则将该节点的直接后继的`prev`指针指向该节点的直接前驱。如果没有，则说明该节点位于表尾，将表尾指针指向该节点的直接前驱即可。 、

最后释放该节点的内存，并将链表长度自减1。

### 返回表头或表尾数据  

```c
/* 获取表头数据 */
void *list_get_value_head(list *list)
{
    if(list->head == NULL) return NULL;
    /* 临时创建一个变量保存数据 */
    void *value = list->head->value;
    /* 删除该节点 */
    list_del_node(list, list->head);
    return value;
}

/* 获取表尾数据 */
void *list_get_value_tail(list *list)
{
    if(list->tail == NULL) return NULL;
    void *value = list->tail->value;
    list_del_node(list, list->tail);
    return value;
}
```

由于`list`有表头和表尾指针，所以获得其数据也非常方便。

### 链表的释放与清除  

```c
/* 清空链表中所有的节点但是不删除链表本身 */
void list_empty(list *list)
{
    unsigned long length;
    list_node *current, *next;
    current = list->head;
    length = list->length;
    while (length--)
    {
        next = current->next;
        free(current);
        current = next;
    }
    list->head = list->tail = NULL;
    list->length = 0;
}

/* 释放整个链表 */
void list_release(list *list)
{
    list_empty(list);
    free(list);
}

```

在清除链表所有节点时，我们从表头根据链表长度遍历到表尾逐个清除，最后使链表`head`与`tail`指针为**NULL**。  
释放整个链表只需要先清除该链表节点，再释放该链表本身即可。

# 链表迭代器的实现

### 宏定义迭代器方向

```c
#define LIST_START_HEAD 0
#define LIST_START_TAIL 1
```

其中`LIST_START_HEAD`表示沿着节点的`next`指针前进，从表头到表尾遍历。  
`LIST_START_TAIL`则表示，沿着节点的`prev`指针前进，从表尾到表头遍历。  

### 迭代器的表示  

```c
/* 迭代器结构 */
typedef struct list_iter
{
    /* 下一个节点 */
    list_node *next;
    /* 方向 */
    int direction;
}list_iter;
```

迭代器定义了两个成员，其中`next`是表示指向下一个节点的指针，`direction`表示迭代方向，对应上方的宏定义。  

### 迭代器的创建  

```c
/* 创建一个迭代器 */
list_iter *list_get_iterator(list *list, int direction)
{
    list_iter *iter = (list_iter *) malloc(sizeof(list_iter));
    if(iter==NULL) return NULL;
    /* 判断迭代方向 */
    if(direction == LIST_START_HEAD)
        iter->next = list->head;
    else 
        iter->next = list->tail;
    iter->direction = direction;
    return iter;
}
```

在初始化迭代器时，接受两个参数，分别是需要迭代的链表，和迭代的方向。  
判断给定参数，如果从表头遍历到尾遍历，则将迭代器的`next`指针指向链表的表头，反之则指向表尾。

### 获取迭代器的下一个数据  

```c
/* 返回链表下一个节点值 */
void *list_next(list_iter *iter)
{
    list_node *current = iter->next;
    if (current==NULL) return NULL;

    if(iter->direction == LIST_START_HEAD)
        iter->next = current->next;
    else 
        iter->next = current->prev;

    return current->value;
}
```

在获取迭代器的下一个数据时，首先判断当前迭代器`next`指针指向的节点是否为空，如果空，则返回**NULL**。  
接着迭代器`next`指针根据迭代方向指向下一个节点。  
最后返回数据。

### 迭代器的释放  

```c
/* 释放迭代器内存 */
void list_release_iterator(list_iter *iter)
{
    free(iter);
}
```

释放迭代器，还是挺简单的。

## 在main方法中测试  

```c
int main() 
{   
    /* 测试数据 */
    char a = 'A';
    char b = 'B';
    char c = 'C';

    /* 创建链表 */
    list *list = list_create(); 
    
    /* 测试空表是否报错 */
    printf("-----测试空链表是否报错\n");
    printf("%p\n", list_get_value_head(list));
    printf("%p\n", list_get_value_tail(list));

    /* 表头添加数据 */
    list_add_node_head(list, &a);
    list_add_node_head(list, &b);
    /* 表尾添加数据 */
    list_add_node_tail(list, &c);
    list_add_node_tail(list, &a);

    printf("-----此时链表长度：%d\n", list->length);
    printf("-----测试表头出队-----\n");
    /* 先出队两次，测试表头出队 */
    while (list->length>2)
    {   
        printf("%c\n", *(char*)list_get_value_head(list));
    }
    printf("-----测试表尾出队-----\n");
    /* 测试表尾出队 */
    while (list->length)
    {   
        printf("%c\n", *(char*)list_get_value_tail(list));
    }

    /* 添加数据 */
    list_add_node_head(list, &a);
    list_add_node_head(list, &b);
    list_add_node_head(list, &c);

    /* 创建一个正向迭代器迭代器 */
    list_iter *iter = list_get_iterator(list, LIST_START_HEAD);
    /* 测试迭代器 */
    printf("-----测试迭代器-------\n");
    printf("%c\n", *(char *)list_next(iter));
    printf("%c\n", *(char *)list_next(iter));

    /* 释放迭代器 */
    list_release_iterator(iter);

    /* 清除链表节点 */
    list_empty(list);
    
    printf("-----测试空链表是否报错\n");
    printf("%p\n", list_get_value_head(list));
    printf("%p\n", list_get_value_tail(list));

    /* 释放链表 */
    list_release(list);

    return 0;
}
```

编译并输出：

```bash
# gcc -fsanitize=address -fno-omit-frame-pointer  -g list.c  && ./a.out
-----测试空链表是否报错
(nil)
(nil)
-----此时链表长度：4
-----测试表头出队-----
B
A
-----测试表尾出队-----
A
C
-----测试迭代器-------
C
B
-----测试空链表是否报错
(nil)
(nil)
```

## 完整代码  

详见代码清单。


  [1]: https://image.5050520.xyz/i/usr/uploads/2021/11/2300058278.png
  [2]: https://image.5050520.xyz/i/usr/uploads/2021/11/266091259.png
  [3]: https://image.5050520.xyz/i/usr/uploads/2021/11/2570152105.png
  [4]: https://image.5050520.xyz/i/usr/uploads/2021/11/3710691052.png
  [5]: https://image.5050520.xyz/i/usr/uploads/2021/11/3281861290.png