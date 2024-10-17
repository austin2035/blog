---
layout: '../../layouts/MarkdownPost.astro'
title: '数据结构笔记 04 - 队列'
pubDate: 2021-11-09
description: '队列（queue）是一种先进先出（First In First Out， FIFO）的线性表。
'
author: 'Austin'
cover:
    url: 'https://image.5050520.xyz/i/2023/02/27/1194dq4.png'
    square: 'https://image.5050520.xyz/i/2023/02/27/1194dq4.png'
    alt: 'cover'
tags: ["数据结构", "C", "C指针"]
theme: 'light'
featured: true
---

![数据结构之队列](https://image.5050520.xyz/i/2023/02/27/1194dq4.png)

## 什么是队列

队列（queue）是一种先进先出（First In First Out， FIFO）的线性表。

![queue.png][1]

## 队列的表示  

队列也有顺序和链式两种表示方法。同样，我们可以将链式队列理解为一种特殊的链表，只允许在表头删除，在表尾插入。

```c
/* 队列节点 */
typedef struct queue_node {
    /* 后继节点 */
    struct queue_node *next;
    /* 值 */
    void *data;
}queue_node;

/* 队列本身 */
typedef struct queue {
    /* 队头 */
    struct queue_node *head;
    /* 队尾 */
    struct queue_node *tail;
    /* 队列长度 */
    int length;
}queue;
```

## 队列的操作  
  
通常来说，队列常用的操作也是插入和删除两种。为了方便理解，可以将执行删除的一端称为队头（head），执行插入操作的一端称为队尾（tail）。

## 函数清单  

下面是用于操作队列的函数名及其作用与复杂度  

|函数|作用|算法复杂度|
|----|----|----|
|queue_create|创建新队列|O(1)|
|queue_release|释放队列，以及队列中的节点|O(N)|
|queue_push_data|入队|O(1)|
|queue_pull_data|出队|O(1)|
|queue_empty|释放队列中节点(头节点除外)，但不释放队列本身|O(N)|

## 创建新队列  

```c
/* 创建队列 */
queue *queue_create()
{
    /* 创建一个队列 */
    queue *queue = (struct queue*)malloc(sizeof(struct queue));
    
    /* 为了方便操作，队列默认创建一个队列节点 */
    queue_node *node = (struct queue_node*)malloc(sizeof(struct queue_node));
    if(queue==NULL || node==NULL) return NULL;

    node->data = NULL;
    node->next = NULL;
    
    /* 初始化队列 */
    queue->head = queue->tail = node;
    queue->length = 0;

    return queue;
}
```

在创建新队列时，首先创建队列本身，接着，创建一个队列节点（头节点），并将队列的`head`和`tail`指针都指向这个节点。最后，队列的长度设置为0。  

![queue_create.png|inline][2]

## 入队  

```c
/* 入队 */
queue *queue_push_data(queue *queue, void *data)
{
    /* 创建一个节点 */
    queue_node *node = (struct queue_node*)malloc(sizeof(struct queue_node));
    if(node==NULL) return NULL;
    node->data = data;

    /* 在队尾插入元素 */
    queue->tail->next = node;
    queue->tail = queue->tail->next;

    queue->length++;
    return queue;
}
```

在有元素需要入队的时候，执行在表尾的插入操作。  
首先创建一个新的节点，接着让最后一个节点，也即队尾指针`tail`指向的节点的`next`指针指向新的节点，然后，队尾指针`tail`也指向新的节点。最后，队列长度自增1。

![queue_push1.png][3]
![queue_push2.png][4]

## 出队  

```c
/* 出队 */
void* queue_pull_data(queue *queue)
{
    queue_node *curr = queue->head->next;
    
    /* 判断队列中是否有数据 */
    if(curr==NULL) return NULL;

    void *data = curr->data;
    
    queue->head->next = curr->next;
    
    /* 判断队列中除头结点外，是否只有一个节点，避免尾指针丢失 */
    if(queue->tail==curr) {
        queue->tail = queue->head;
    }

    free(curr);
    queue->length--;
    return data;
}
```

有元素出队时，首先判断队列是否有数据，如果没有，则返回**NULL**，如果没有，则返回头节点的下一个节点（首元节点）的数据。  
接着，**判断队列中除头结点外，是否只有一个节点**。如果只有首元节点，那么下一步释放首元节点的内存时，`tail`指针将会被一同释放，进而造成尾指针的丢失。  
最后，释放出队的节点内存，队列长度自减1。

![queue_pop.png][5]

## 清空队列

```c
// 释放队列中所有节点，但不释放队列本身
void queue_empty(queue *queue)
{   
    int length = queue->length;
    queue_node *curr, *next;

    // 注意这里不释放头节点
    curr = queue->head->next;
    while (length--)
    {   
        next = curr->next;
        free(curr);
        curr = next;
    }
    
    queue->head->next = NULL;
    queue->head->data = NULL;
    queue->tail = queue->head;
    queue->length = 0;
}
```

释放队列的所有数据节点，但不释放头节点，所有循环从`head->next`开始。  
因为，`head->next`被`free`过，所以再次设置为`NULL`。  
最后，设置队列长度为0，释放完毕。

## 清除队列  

```c
// 释放队列，包括队列中节点
void queue_release(queue *queue)
{
    queue_empty(queue);
    /* 注意，头节点也要释放 */
    free(queue->head);
    free(queue);
}
```

在释放队列本身及其节点的时候，我们只需要调用`queue_empty`函数，再释放头节点和队列本身即可。

## 测试  

```c
int main()
{
    char a = 'a';
    char b = 'b';
    char c = 'c';
    
    queue *queue = queue_create();
    printf("%p\n", queue_pull_data(queue));
    
    queue_push_data(queue, &a);
    queue_push_data(queue, &b);
    queue_push_data(queue, &c);

    while (queue->length)
    {
        printf("%c\n", *(char *)queue_pull_data(queue));
    }
    
    queue_push_data(queue, &c);
    queue_push_data(queue, &c);
    
    /* 释放队列中节点 */
    queue_empty(queue);
    printf("%p\n", queue_pull_data(queue));
    
    /* 释放队列 */
    queue_release(queue);
    return 0;
}
```

## 完整代码  

完整代码，详见代码清单。  

  [1]: https://image.5050520.xyz/i/usr/uploads/2021/11/4225409542.png
  [2]: https://image.5050520.xyz/i/usr/uploads/2021/11/4225494174.png
  [3]: https://image.5050520.xyz/i/usr/uploads/2021/11/2259588738.png
  [4]: https://image.5050520.xyz/i/usr/uploads/2021/11/3257292485.png
  [5]: https://image.5050520.xyz/i/usr/uploads/2021/11/1603936778.png
