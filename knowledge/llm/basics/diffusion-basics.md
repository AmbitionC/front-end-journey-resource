扩散模型通过学习不同噪声强度下的去噪任务，构造从噪声生成样本的过程。理解它时先分开训练与采样：训练需要真实数据和监督信号，采样使用已经训练好的参数逐步更新当前样本。

本文以连续、噪声预测式 DDPM 为入门例子。它不能代表所有扩散模型的目标、采样器和网络结构，也不把某个面试项目补成特定产品实现。

## 前置概念

把一张图像暂时看成数值数组 $x_0$。独立高斯噪声记为 $\epsilon$，时间步 $t$ 表示噪声日程中的位置，而不是现实世界经过几秒。网络还需知道 $t$，因为低噪声输入与高噪声输入需要不同的处理。

设每步加噪强度为 $\beta_t$，并记 $\alpha_t=1-\beta_t$、$\bar\alpha_t=\prod_{s=1}^t\alpha_s$。常见 DDPM 前向构造可写成：

$$
x_t=\sqrt{\bar\alpha_t}\,x_0+\sqrt{1-\bar\alpha_t}\,\epsilon
$$

这使训练可以直接构造某个时间步的带噪样本。[Diffusers 训练教程](https://huggingface.co/docs/diffusers/tutorials/basic_training)实际使用随机时间步、加噪调度器和噪声预测损失组织训练。

## 训练：学会给定时间步的去噪任务

一次教学训练步骤可以概括为：取真实样本，抽取时间步与噪声，构造带噪输入，再让模型预测噪声，与本次实际加入的噪声比较并更新参数。噪声预测式目标常用均方误差表示：

$$
\mathcal L=\mathbb E\big[\|\epsilon-\epsilon_\theta(x_t,t)\|^2\big]
$$

这里写的是一个常见目标；实际训练可能有条件输入、不同预测参数化、权重或其他损失。不能把它当成所有扩散模型都必须照抄的唯一公式。

![训练从真实样本构造带噪输入并学习预测噪声，采样从随机噪声开始用固定模型和调度器循环生成](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/diffusion-basics-train-sample-archify-v1.png)
*图：训练抽取监督任务，采样走生成日程；采样循环不是每一步重新训练模型。*

## 采样：模型预测与调度器更新分工

这里讨论从随机噪声起步的基础生成，没有一张必须恢复的原图；图生图、修复等任务可以另有参考输入和约束。先取得初始噪声，模型根据当前样本、时间步和可选条件给出预测，再由调度器计算下一步状态，重复到日程结束。[自定义 Diffusers 管线教程](https://huggingface.co/docs/diffusers/using-diffusers/write_own_pipeline)展示了模型预测与 `scheduler.step` 的分工。

下面是表达职责的伪代码，不是某个库版本的可直接运行接口：

```python
x = sample_initial_noise()
for t in sampling_schedule:
    prediction = trained_model(x, t, condition)
    x = scheduler_update(prediction, t, x)
result = decode_if_needed(x)
```

调度器更新不仅是从数组中直接减去预测噪声；它还依赖时间步、噪声日程及所选采样方法。减少步数可能改善耗时，也可能改变质量与输出，必须在固定任务、条件和资源下比较。

## 像素扩散与潜空间扩散

像素扩散直接处理图像表示。潜空间扩散先使用编码器把图像映射为潜变量，在潜空间中训练与采样，最后用解码器恢复图像；因此还存在编码器、解码器及潜变量约定。[Diffusers 管线教程](https://huggingface.co/docs/diffusers/using-diffusers/write_own_pipeline)分别说明调度循环与 Stable Diffusion 的 VAE 路径。

文本条件可以影响生成，但条件怎样进入网络取决于模型设计，不能把某一种注意力或编码方式说成所有扩散模型的定义。基础区别可参照[多模态模型基础](./llm-multimodal-basics.md)。

## 怎样判断是否真正理解

应能解释“真实噪声从哪里来”“为什么模型需要时间步”“训练与采样分别是否更新参数”，以及模型输出和调度器各负责什么。评估时分开看生成质量、条件遵循、覆盖与多样性、时延和资源消耗，单个示例不能证明整体能力。

常见错误包括把加噪理解成每条训练数据必须完整跑完生成链、把去噪理解成知道原图后的确定恢复、把推理步数与训练轮次混为一谈，以及忽略潜空间模型的编码和解码边界。

## 出现于（热度来源）

<!-- interview-source-history:start -->
- [快手大模型应用算法社招一面：Diffusion 与二分基础](../../../interview/kuaishou/ai/kuaishou-ai-19.md)
- [饿了么 AIGC 实习一面：Attention、训练与扩散模型](../../../interview/alibaba/ai/alibaba-ai-23.md)
<!-- interview-source-history:end -->

## 参考资料

- [Hugging Face Diffusers：基础训练教程](https://huggingface.co/docs/diffusers/tutorials/basic_training)（滚动文档，核验于 2026-10-31）。
- [Hugging Face Diffusers：编写自己的生成管线](https://huggingface.co/docs/diffusers/using-diffusers/write_own_pipeline)（滚动文档，核验于 2026-10-31）。

