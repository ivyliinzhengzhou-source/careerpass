// Vercel Serverless Function - Career Compass Backend
// 文件路径：api/jobs.js

export default async function handler(req, res) {
  // 允许跨域请求
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // 处理预检请求
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 只接受 POST 请求
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed. Use POST.' 
    });
  }

  try {
    // 获取前端发来的数据
    const { jobTitle, location } = req.body;
    
    // 验证参数
    if (!jobTitle || !location) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: jobTitle and location' 
      });
    }

    console.log(`Searching for: ${jobTitle} in ${location}`);

    // Mino API 配置
    const MINO_API_KEY = 'sk-mino-7kTEmnjHbeei1foVnEpuR-b64m6JOXH9';
    
    // 构建 LinkedIn URL
    const linkedinUrl = `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(jobTitle)}&location=${encodeURIComponent(location)}&f_E=2`;

    // Mino Goal 指令
    const goal = `Navigate to LinkedIn jobs search page.

Extract 10 entry-level ${jobTitle} jobs in ${location}.

For each job, get:
- title: Job title
- company: Company name
- location: City and state
- salary: Salary range or "Not listed"
- url: Full job posting URL (click on job card to get the complete URL)
- postedDate: When posted (e.g. "2 days ago")

Return ONLY a JSON array in this exact format:
[
  {
    "title": "Product Manager",
    "company": "Google",
    "location": "San Francisco, CA",
    "salary": "$90,000 - $120,000/year",
    "url": "https://www.linkedin.com/jobs/view/123456",
    "postedDate": "1 day ago"
  }
]

Important rules:
- Skip any sponsored or promoted jobs
- Click on each job card to get the full URL
- If salary is not shown, use "Not listed"
- Return ONLY the JSON array, no additional text or markdown
- Ensure all URLs are complete and clickable`;

    // 调用 Mino API
    const minoResponse = await fetch('https://mino.ai/v1/automation/run-sse', {
      method: 'POST',
      headers: {
        'X-API-Key': MINO_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: linkedinUrl,
        goal: goal,
        browser_profile: 'stealth',
        proxy_config: {
          enabled: true,
          country_code: 'US'
        },
        timeout: 120
      })
    });

    if (!minoResponse.ok) {
      throw new Error(`Mino API returned status ${minoResponse.status}`);
    }

    // 处理 Server-Sent Events (SSE) 流
    const reader = minoResponse.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let jobs = [];

    // 读取流数据
    while (true) {
      const { done, value } = await reader.read();
      
      if (done) {
        console.log('Stream ended');
        break;
      }

      // 解码数据
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      // 处理每一行
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            
            console.log('Mino event:', data.type);
            
            // 任务完成
            if (data.type === 'COMPLETE') {
              if (data.resultJson) {
                jobs = Array.isArray(data.resultJson) ? data.resultJson : [];
                
                console.log(`Successfully extracted ${jobs.length} jobs`);
                
                // 立即返回结果
                return res.status(200).json({ 
                  success: true, 
                  jobs: jobs,
                  count: jobs.length,
                  source: 'linkedin',
                  timestamp: new Date().toISOString()
                });
              } else {
                console.error('No resultJson in COMPLETE event');
                return res.status(500).json({ 
                  success: false, 
                  error: 'No jobs found in Mino response' 
                });
              }
            }
            
            // 任务出错
            if (data.type === 'ERROR') {
              console.error('Mino API error:', data.message);
              return res.status(500).json({ 
                success: false, 
                error: data.message || 'Mino API encountered an error'
              });
            }
            
            // 记录进度（可选）
            if (data.type === 'PROGRESS') {
              console.log('Progress:', data.message);
            }
            
          } catch (parseError) {
            console.error('Error parsing SSE data:', parseError);
          }
        }
      }
    }

    // 如果循环结束还没返回，说明出错了
    console.error('Stream ended without COMPLETE or ERROR event');
    return res.status(500).json({ 
      success: false, 
      error: 'No data received from Mino API' 
    });

  } catch (error) {
    console.error('Backend error:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message || 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
}
```

---

## ✅ Step 4: 提交

1. **粘贴完代码后**，往下滚动

2. **点击绿色按钮 "Commit changes..."**

3. **在弹出窗口里点 "Commit changes"**

---

## 🎯 完成！

现在你的仓库应该有：
```
careerpass/
├── index.html
└── api/
    └── jobs.js
