在Vue中，计算属性（Computed Properties）和侦听器（Watchers）是两种重要的响应式特性，它们允许开发者以声明性的方式描述组件的行为。

#### 计算属性（Computed Properties）
计算属性是基于它们的依赖进行缓存的属性。只有当计算属性依赖的响应式数据发生变化时，计算属性才会重新计算。计算属性非常适合用于描述数据的派生状态。

**特点**：

+ 响应式：计算属性依赖于响应式数据，只有当依赖项变化时，计算属性才会重新计算。
+ 缓存：计算属性的结果会被缓存，如果依赖项没有变化，直接返回缓存结果，提高性能。
+ 只读：通常计算属性应该是只读的，Vue 推荐不直接修改计算属性的值。

**示例**：

```vue
<template>
  <div>{{ fullName }}</div>
</template>

<script>
export default {
  data() {
    return {
      firstName: 'John',
      lastName: 'Doe'
    };
  },
  computed: {
    fullName() {
      return this.firstName + ' ' + this.lastName;
    }
  }
};
</script>
```

在这个示例中，`fullName` 是一个计算属性，它依赖于 `firstName` 和 `lastName`。只有当 `firstName` 或 `lastName` 发生变化时，`fullName` 才会重新计算。



#### 侦听器（Watchers）
侦听器允许你观察和响应Vue实例上的数据变化。当被侦听的数据发生变化时，侦听器会自动触发回调函数。

**特点**：

+ 响应式：侦听器侦听的数据是响应式的，可以是组件的data、computed或props。
+ 执行回调：当侦听的数据变化时，侦听器的回调函数会被执行。
+ 可执行异步操作：侦听器的回调函数中可以执行异步操作。

**示例**：

```vue
<template>
  <div>{{ message }}</div>
</template>

<script>
export default {
  data() {
    return {
      message: 'Hello World'
    };
  },
  watch: {
    message(newValue, oldValue) {
      console.log(`Message changed from "${oldValue}" to "${newValue}"`);
    }
  }
};
</script>
```

在这个示例中，我们为 `message` 数据定义了一个侦听器。当 `message` 的值发生变化时，侦听器的回调函数会被触发，并打印出变化前后的值。



#### 计算属性 vs 侦听器
+ **使用场景**：计算属性适用于描述数据的派生状态，侦听器适用于在数据变化时执行操作或异步操作。
+ **性能**：计算属性具有缓存机制，只有依赖项变化时才会重新计算；侦听器每次数据变化时都会执行回调。
+ **声明方式**：计算属性在组件的 `computed` 选项中声明，侦听器在组件的 `watch` 选项中声明。

