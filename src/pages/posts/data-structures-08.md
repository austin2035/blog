---
layout: '../../layouts/MarkdownPost.astro'
title: '数据结构笔记 08 - 二叉搜索树'
pubDate: 2021-11-13
description: '二叉搜索树（Binary Search Tree， BST），也称为二叉查找树、二叉有序树或者排序二叉树。'
author: 'Austin'
cover:
    url: 'https://pic.lookcos.cn/i/2023/02/27/1194dq4.png'
    square: 'https://pic.lookcos.cn/i/2023/02/27/1194dq4.png'
    alt: 'cover'
tags: ["数据结构", "C", "二叉树", "二叉搜索树"]
theme: 'light'
featured: true
---

![数据结构之二叉搜索树](https://pic.lookcos.cn/i/2023/02/27/1194dq4.png)

### 什么是二叉搜索树？

二叉搜索树（Binary Search Tree， BST），也称为二叉查找树、二叉有序树或者排序二叉树。

它是一棵空树或者有如下性质的二叉树：

1. 若任意节点的左子树不空，则左子树所有结点的值均小于它的根节点的值；
2. 若任意节点的右子树不空，则右子树上所有节点的值均大于它的根节点的值；
3. 任意节点的左、右子树也分别为二叉查找树；

### 简单理解二叉搜索树

上面提到了二叉搜索树的特质，如何理解呢？其实很简单，别忘了前面提到的重要思想：树的定义是递归的。

假设有如下二叉搜索树：

![](https://pic.lookcos.cn/i/usr/uploads/2021/12/4071927410.png)

不难看出：

- 根节点8，它的左子树3比它小，右子树10比他大。
- 右子树中所有节点都比它8要大，同理左子树中所有节点都比它小。
- 不光是根节点，对于任意非终端节点都是如此。

### 二叉搜索树的节点

```c
/* BST的节点 */
typedef struct bst_node
{
    /* 关键字项 */   
    int key;
    /* 左孩子 */
    struct bst_node *left;
    /* 右孩子 */
    struct bst_node *right;
    /* 这里还可以带上其他数据，比如 void *value */
}bst_node;
```

### 二叉搜索树本身

```c
/* BST本身 */
typedef struct bst {
    /* 树的根节点 */
    struct bst_node *root;
    /* 树的节点数量 */
    int size;
}bst;

```

### 创建树与树的节点

```c
/* 创建一棵空二叉排序树 */
bst *bst_create(void) {
    bst *bst = (struct bst*)malloc(sizeof(struct bst));
    if(bst==NULL) return NULL;
    bst->root = NULL;
    bst->size = 0;
    return bst;
}

/* 创建一个BST的节点 */
bst_node *bst_create_node(int key) {
    bst_node *node = (struct bst_node*)malloc(sizeof(struct bst_node));
    if(node==NULL) return NULL;
    node->left = NULL;
    node->right = NULL;
    node->key = key;
    return node;
}
```

### 二叉搜索树的搜索

以上图二叉树为例，搜索key = 7的节点，如何搜索？

- 指针从根节点8开始，key <  8，要搜索的节点肯定在节点8的左子树；
- 指针移动到节点3， key > 3，要搜索的节点肯定在节点3的右子树；
- 指针移动到节点5， key > 5， 要搜索的节点肯定在节点5的右子树；
- 指针移动到节点7，key = 7，这便是我们要找的节点。

![二叉搜索树的搜索过程](https://pic.lookcos.cn/i/usr/uploads/2021/12/2168214795.png)

C语言实现如下：

```c
/*定义是搜索某个节点（child）还是搜索这个节点的双亲结点（parent）*/
#define BST_NODE_CHILD 0
#define BST_NODE_PARENT 1

/* Return：一个节点指针
 * Args:
 *   bst：在此树或子树中查找
 *   type：节点类型：
 *      BST_NODE_CHILD：叶子节点
 *      BST_NODE_PARENT：父节点 
 *   key：要查找的节点key值
 * 
 * 注意：在查找给定参数key的父节点时，即便在树中没有任何节点的key等于给定的参数key
 * (说明树中没有这个节点)，也会返回一个它的理论父节点。
 */

bst_node *bst_search_node(bst_node *node, int type, int key)
{

    bst_node *current = node;
    bst_node *parent = NULL;

    if(current==NULL) return NULL;
    while (current != NULL)
    {
        if(key < current->key) {
            parent = current;
            current = current->left;
        } else if(key == current->key) {
            break;
        } else{
            parent = current;
            current = current->right;
        }
    }

    if(type == BST_NODE_CHILD) return current;
    return parent;
}
```

### 二叉搜索树的插入（非递归）

我不太喜欢递归（太绕），而且很多人介绍二叉树的插入是递归法，个人觉得不优雅，讲一讲非递归的方法：

还以上图中的二叉树为例子，假如要插入一个节点15。

第一步是搜索。假如节点15已经存在于该二叉树，从二叉树的根节点开始搜索，搜索节点15。

显然，要真搜索还真搜索不到，但是我说了，是假如有节点15，那一路走下去，应该是节点8 -> 节点10 -> 节点14。

![二叉树的插入](https://pic.lookcos.cn/i/usr/uploads/2021/12/321526085.png)

去除假设来看，节点14是叶子节点，没有左右子树，那么我们把要插入的节点15放到节点14的右子树不就行了？  

所以，实际上，我们是在搜索要插入节点的父节点，返回该父节点，然后再接上要插入的节点就行了。

![动态演示|inline](https://pic.lookcos.cn/i/usr/uploads/2021/12/2986928687.gif)

C语言实现如下(其中找到要插入节点的父节点，已经在上面实现)：

```c
/* 插入一个节点 */
bst *bst_insert_node(bst *bst, int key)
{
    bst_node *current = bst->root;
    bst_node *parent = NULL;
    /* 如果是空二叉搜索树，则直接新建节点作为根节点即可 */
    if (current==NULL) {
        bst->root = bst_create_node(key);
    } else {
        /* 找到要插入节点的父节点 */
        parent = bst_search_node(bst->root, BST_NODE_PARENT, key);
        if(parent==NULL) return NULL;
        /* 与父节点比大小，看应该在父节点的左子树还是右子树 */
        if(key < parent->key) {
            parent->left = bst_create_node(key);
        } else if(key == parent->key)  {
            /* 如果key重复则取消插入 */
            return NULL;
        } else {
            parent->right = bst_create_node(key);
        }
    }
    /* 二叉搜索树的节点数增加1 */
    bst->size ++;
    return bst;
}
```

### 二叉搜索树的删除

删除一个节点，存在三种情况

1. 该节点是终端节点，删除后不影响树的结构，直接删除即可
2. 该节点有父节点，但只有一个分支，删除后不影响结构，直接删除。
3. 该节点有两个分支，删除后需要重建树。重建的思路有两个，第一种是寻找该节点左子树中key值最大的节点，并替换该节点。第二种是，寻找该节点右子树中key值最小的节点，并替换改节点，以使树的结构保持不变。

删除节点14（情况2）动图演示：

![删除节点 14|inline](https://pic.lookcos.cn/i/usr/uploads/2021/12/711358893.gif)

删除节点3（情况3）动图演示：

![删除节点 3|inline](https://pic.lookcos.cn/i/usr/uploads/2021/12/3764915767.gif)

下面是具体代码实现：

```c
void bst_delete_node(bst *bst, int key)
{
    bst_node *parent = bst_search_node(bst->root, BST_NODE_PARENT, key);
    bst_node *current, *temp, *max;
    current = bst_search_node(parent, BST_NODE_CHILD, key);

    /* 如果这是一颗只有根节点的树 (情况 1)*/
    if(parent==NULL && current==NULL) {
        temp = bst->root;
        bst->root = NULL;
    }
    /* 如果该节点是终端节点 （情况 1） */
    else if(current->left==NULL && current->right==NULL) {
        /* 易错点，可能会写成parent->left->key == current->key */
        if(current->key < parent->key) {
            temp = parent->left;
            parent->left = NULL;
        } else {
            temp = parent->right;
            parent->right = NULL;
        }
    }
    /* 如果该节点左子树为空（情况 2） */ 
    else if(current->left==NULL) {
        temp = current->right;
        current->key = current->right->key;
        current->left = current->right->left;
        current->right = current->right->right;
    }
    /* 如果该节点右子树为空（情况 2） */ 
    else if(current->right==NULL) {
        temp = current->left;
        current->key = current->left->key;
        current->left = current->left->left;
        current->right = current->left->right;
    }
    /* 如果该节点左右子树都不为空（情况 3） */
    else {
        max = bst_find_max_node(current->left, BST_NODE_PARENT);
        /* 如果被删除的节点，其左子树中最大的节点的父节点为空，则说明该节点左子树中最大的节点为此被删除节点的左孩子。 */
        if (max==NULL) {
            temp = current->left;
            current->key = current->left->key;
            current->left = current->left->left;
        } else {
            temp = max->right;
            current->key = max->right->key;
            max->right = max->right->left;
        }
    }
    free(temp);
    bst->size--;
    return ;
}
```

### 二叉搜索树的遍历与测试

中序遍历与别的二叉树无异，测试我们同样写在main函数中

```c
/* 中序遍历 */
void bst_inorder_traversal(bst_node *node) {
    if(node != NULL) {
        bst_inorder_traversal(node->left);
        printf("%d\t", node->key);
        bst_inorder_traversal(node->right);
    } 
}

int main() {
    bst *bst = bst_create();
    int arr[] = {21, 3, 5, 26, 29, 50, 18, 53, 8, 67, 1, 78, 6};
    //int arr[] = {5, 6, 4};
    int length = sizeof(arr) / sizeof(int);
    int i;
    
    for(i=0;i<length;i++) {
        bst_insert_node(bst, arr[i]);
        printf("size: %d ", bst->size);
        printf("Inorder Traversal: ");
        bst_inorder_traversal(bst->root);
        printf("\n");
    }

    for(i=length-1;i>=0;i--) {
        bst_delete_node(bst, arr[i]);
        printf("size: %d ", bst->size);
        printf("Inorder Traversal: ");
        bst_inorder_traversal(bst->root);
        printf("\n");
    }
    /* 释放这棵二叉树 */
    free(bst);
    return 0;
}
```

编译并运行：

```bash
#  gcc bst.c && ./a.out
size: 1 Inorder Traversal: 21
size: 2 Inorder Traversal: 3    21
size: 3 Inorder Traversal: 3    5       21
size: 4 Inorder Traversal: 3    5       21      26
size: 5 Inorder Traversal: 3    5       21      26      29
size: 6 Inorder Traversal: 3    5       21      26      29      50
size: 7 Inorder Traversal: 3    5       18      21      26      29      50
size: 8 Inorder Traversal: 3    5       18      21      26      29      50      53
size: 9 Inorder Traversal: 3    5       8       18      21      26      29      50      53
size: 10 Inorder Traversal: 3   5       8       18      21      26      29      50      53      67
size: 11 Inorder Traversal: 1   3       5       8       18      21      26      29      50      53      67
size: 12 Inorder Traversal: 1   3       5       8       18      21      26      29      50      53      67   78
size: 13 Inorder Traversal: 1   3       5       6       8       18      21      26      29      50      53   67       78
size: 12 Inorder Traversal: 1   3       5       8       18      21      26      29      50      53      67   78
size: 11 Inorder Traversal: 1   3       5       8       18      21      26      29      50      53      67
size: 10 Inorder Traversal: 3   5       8       18      21      26      29      50      53      67
size: 9 Inorder Traversal: 3    5       8       18      21      26      29      50      53
size: 8 Inorder Traversal: 3    5       18      21      26      29      50      53
size: 7 Inorder Traversal: 3    5       18      21      26      29      50
size: 6 Inorder Traversal: 3    5       21      26      29      50
size: 5 Inorder Traversal: 3    5       21      26      29
size: 4 Inorder Traversal: 3    5       21      26
size: 3 Inorder Traversal: 3    5       21
size: 2 Inorder Traversal: 3    21
size: 1 Inorder Traversal: 21
size: 0 Inorder Traversal: 
```
