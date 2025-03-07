import request from "../utils/request";

/**
 * 测试
 * @param {Object} values 测试参数
 * @returns {Promise} 返回测试结果
 */
export async function Test() {
  return await request("/api/test", {
    method: "POST",
    skipErrorHandler: true, // 是否跳过全局错误处理
  });
}

/**
 * Fetch重试机制
 * @param url Fetch url
 * @param options Fetch 参数
 * @param retries 重试次数
 * @returns 返回结果
 */
export async function fetchWithRetry (url, options, retries = 3) {
  try {
    const response = await fetch(url, options);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response;
  } catch (err) {
    if (retries > 0) {
      console.log(`剩余重试次数: ${retries}`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      return fetchWithRetry(url, options, retries - 1);
    }
    throw err;
  }
};

export async function startOllama() {
  return await request("/api/startOllama", {
    method: "POST",
    skipErrorHandler: true, // 是否跳过全局错误处理
  });
}

export async function askAI(markdownTable, question) {
  return await request(
    "/api/askAi",
    {
      method: "POST",
      skipErrorHandler: true,
      timeout: 60000,
      data: { markdownTable: markdownTable, question: question },
      config: true,
    }
  );
}


