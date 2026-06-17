Vue.js 中的生命周期 Hooks 是一系列特殊的函数，它们在组件的不同阶段被调用。这些 Hooks 允许开发者在组件的创建、更新、销毁等关键时刻执行代码。

#### Vue 生命周期 Hooks 列表
+ **beforeCreate**
    - 在组件实例初始化之后被调用，此时组件的数据观测和事件/侦听器的配置尚未完成。
+ **created**
    - 在组件实例创建完成后被调用，此时组件的数据观测和事件/侦听器已经配置好，但是组件尚未挂载到DOM上。
+ **beforeMount**
    - 在组件挂载到DOM之前被调用，此时组件的模板已经编译，但是尚未添加到DOM树中。
+ **mounted**
    - 在组件挂载到DOM之后被调用，此时可以访问到DOM元素。
+ **beforeUpdate**
    - 在组件更新之前被调用，此时组件的数据已经更新，但是DOM还未重新渲染。
+ **updated**
    - 在组件更新之后被调用，此时DOM已经重新渲染，可以执行依赖于DOM更新的代码。
+ **beforeDestroy**
    - 在组件销毁之前被调用，此时实例仍然完全可用。
+ **destroyed**
    - 在组件销毁之后被调用，此时组件和它的所有子组件都已被销毁。



#### 举例说明
假设我们正在开发一个显示用户列表的Vue组件，我们可能会在不同的生命周期阶段执行以下操作：

```vue
<template>
  <ul>
    <li v-for="user in users" :key="user.id">
      {{ user.name }}
    </li>
  </ul>
</template>

<script>
export default {
  data() {
    return {
      users: []
    };
  },
  created() {
    // 组件创建后，可以开始获取数据
    this.fetchUsers();
  },
  methods: {
    fetchUsers() {
      // 假设这是一个API调用，获取用户数据
      fetch('https://api.example.com/users')
        .then(response => response.json())
        .then(data => {
          this.users = data;
        });
    }
  },
  mounted() {
    // 组件挂载后，可以执行依赖于DOM的操作
    console.log('The component is mounted!');
  },
  beforeDestroy() {
    // 组件销毁前，可以执行清理工作，例如取消API请求
    console.log('The component is about to be destroyed!');
  }
};
</script>
```

在这个例子中：

+ `created()` 钩子用于在组件实例创建后立即执行数据获取逻辑。
+ `mounted()` 钩子确保在组件渲染到DOM后再执行相关操作。
+ `beforeDestroy()` 钩子用于在组件销毁前进行清理工作，如取消网络请求、移除事件监听器等。

