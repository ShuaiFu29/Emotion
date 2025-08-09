/**
 * Vercel API路由 - 豆包文生图API代理
 * 处理AI头像生成请求
 */

export default async function handler(req, res) {
  // 只允许POST请求
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 从环境变量获取API密钥
    const apiKey = process.env.VITE_ARK_API_KEY;
    
    if (!apiKey) {
      console.error('VITE_ARK_API_KEY environment variable not set');
      return res.status(500).json({ 
        error: 'API密钥未配置，请在Vercel环境变量中设置VITE_ARK_API_KEY' 
      });
    }

    // 转发请求到豆包API
    const response = await fetch('https://ark.cn-beijing.volces.com/api/v3/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json'
      },
      body: JSON.stringify(req.body)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('豆包API调用失败:', response.status, response.statusText, errorText);
      return res.status(response.status).json({
        error: `豆包API调用失败: ${response.status} ${response.statusText}`,
        details: errorText
      });
    }

    const data = await response.json();
    
    // 返回成功响应
    res.status(200).json(data);
    
  } catch (error) {
    console.error('API路由处理错误:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}