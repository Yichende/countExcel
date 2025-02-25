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
