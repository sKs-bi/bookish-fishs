const axios = require('axios');

const callQianwen = async (prompt, apiKey, context = '') => {
  try {
    const response = await axios.post(
      'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
      {
        model: 'qwen-max',
        messages: [
          { role: 'system', content: '你是资产管理系统的AI助手，帮助用户查询资产、分析数据、回答问题。请用简洁友好的方式回答用户问题。' },
          { role: 'user', content: context ? `${context}\n\n用户问题：${prompt}` : prompt }
        ]
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );
    return response.data.choices[0].message.content;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.message || 'AI服务调用失败');
    }
    throw error;
  }
};

module.exports = { callQianwen };
