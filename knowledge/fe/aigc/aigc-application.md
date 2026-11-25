| 步骤 | 描述 |
| --- | --- |
| 1. 获取API密钥 | 注册并登录大模型服务提供商，创建应用程序获取API密钥。 |
| 2. 设计前端界面 | 创建HTML表单，允许用户输入文本并提交。 |
| 3. 实现前端逻辑 | 使用JavaScript处理用户输入，调用大模型API。 |
| 4. 处理API响应 | 接收并处理API返回的数据，展示给用户。 |
| 5. 考虑安全性 | 避免在前端硬编码API密钥，使用环境变量或后端代理。 |
| 6. 性能优化 | 实现缓存策略，减少重复API调用。 |
| 7. 测试 | 对前端应用进行测试，确保稳定性和可靠性。 |
| 8. 部署 | 将测试通过的应用部署到生产环境。 |




#### Step1. 获取API密钥
首先，你需要访问[OpenAI](https://openai.com/)网站，注册并创建一个应用程序以获取API密钥。



#### Step2. 前端界面设计
创建一个简单的HTML表单，允许用户输入文本并提交。



#### Step3. 前端逻辑实现
在`app.js`文件中，我们将添加JavaScript代码来处理用户的输入，并通过API调用发送请求到OpenAI。

```javascript
document.getElementById('submitBtn').addEventListener('click', async () => {
    const userInput = document.getElementById('userInput').value;
    const apiKey = '你的OpenAI API密钥'; // 应该存储在环境变量中
    const response = await callOpenAIAPI(userInput, apiKey);
    displayResponse(response);
});

async function callOpenAIAPI(input, apiKey) {
    const url = 'https://api.openai.com/v1/completions';
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
    };

    const data = JSON.stringify({
        model: 'text-davinci-002', // 你选择的模型
        prompt: input,
        max_tokens: 50, // 返回的最大token数
        temperature: 0.5 // 随机性
    });

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: headers,
            body: data
        });
        const data = await response.json();
        return data.choices[0].text.trim();
    } catch (error) {
        console.error('API调用失败:', error);
        return '抱歉，发生了错误。';
    }
}

function displayResponse(response) {
    const responseDiv = document.getElementById('modelResponse');
    responseDiv.innerText = `大模型的回答: ${response}`;
}
```



#### Step4. 安全性和性能优化
+ **安全性**：不要在前端代码中硬编码API密钥。应该将其存储在环境变量中或使用后端代理来处理API调用。
+ **性能优化**：使用缓存策略，避免重复发送相同的请求。可以使用浏览器的`localStorage`或`sessionStorage`来存储先前的结果。



#### Step5. 测试和部署
在将应用部署到生产环境之前，确保进行充分的测试，包括单元测试和集成测试。

这个例子展示了如何将OpenAI的大模型集成到一个简单的前端应用中。在实际应用中，你可能需要根据具体的需求和所选的大模型服务调整API调用的细节。

## 练一练

### 高频考点题 1：API 密钥放哪

前端应用要调用大模型 API，密钥应该怎样处理？

- A. 写在 app.js 里，打包后用户也看不到
- B. 写在 HTML 的注释里，浏览器不会显示
- C. 放在后端，前端通过自己的接口转发
- D. 放进 localStorage，每次请求时读出来

**答案：C。** 前端代码里的任何东西都能被用户读到，密钥泄露后会被别人盗刷。

### 高频考点题 2：重复请求

用户反复提交完全相同的问题，比较合理的优化是？

- A. 每次都重新调用模型，保证结果最新
- B. 每次都换一个模型来回答
- C. 禁止用户提交重复的问题
- D. 对相同请求做缓存，避免重复调用

**答案：D。** 缓存能减少重复费用和等待时间，但要注意缓存键和过期策略。

### 高频考点题 3：上线前

把这个大模型前端应用部署到生产前，最重要的一步是？

- A. 把界面配色调得更好看一些
- B. 做充分测试，包括异常和安全场景
- C. 在首页加一个醒目的 AI 标志
- D. 把所有代码合并成一个文件

**答案：B。** 包括单元测试、接口失败、超时和密钥是否暴露等场景。
