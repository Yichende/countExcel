import request from "../utils/request";
import { useRef } from "react";

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
export async function fetchWithRetry(url, options, retries = 3) {
  try {
    const response = await fetch(url, options);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response;
  } catch (err) {
    if (retries > 0) {
      console.log(`剩余重试次数: ${retries}`);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return fetchWithRetry(url, options, retries - 1);
    }
    throw err;
  }
}

export async function startOllama() {
  return await request("/api/startOllama", {
    method: "POST",
    skipErrorHandler: true, // 是否跳过全局错误处理
  });
}

export async function stopOllama() {
  return await request("/api/shutdownOllama", {
    method: "POST",
    skipErrorHandler: true, // 是否跳过全局错误处理
  });
}

export async function askAI(markdownTable, question) {
  return await request("/api/askAi", {
    method: "POST",
    skipErrorHandler: true,
    timeout: 60000,
    data: { markdownTable: markdownTable, question: question },
    config: true,
  });
}

// 流式请求处理函数（可放在单独工具文件中）
export function useStreamHandler() {
  const eventSourceRef = useRef(null);
  const bufferRef = useRef("");
  const fullResponseRef = useRef("");
  const packetCountRef = useRef(0);
  const isNormalClosureRef = useRef(false);

  const streamDebug = () => ({
    connectionState: eventSourceRef.current?.readyState,
    buffer: bufferRef.current,
    fullResponse: fullResponseRef.current,
    isNormalClose: isNormalClosureRef.current,
  });

  // 核心启动方法
  const startStream = (sessionId, callbacks) => {
    isNormalClosureRef.current = false;
    // 清理现有连接
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      // safeClose();
      eventSourceRef.current = null;
      console.warn("Closing existing connection");
    }

    // 重置状态
    bufferRef.current = "";
    fullResponseRef.current = "";
    packetCountRef.current = 0;

    // 创建SSE连接
    const eventSource = new EventSource(
      `${API_BASE_URL}/api/stream/${sessionId}`
    );
    eventSourceRef.current = eventSource;

    // 添加 readyState 检查
    let animationFrameId;
    const checkConnection = () => {
      if (eventSource.readyState === 2 && !isNormalClosureRef.current) {
        console.error("异常关闭");
        callbacks.onError?.(new Error("连接意外终止"));
      }
      animationFrameId = requestAnimationFrame(checkConnection);
    };
    animationFrameId = requestAnimationFrame(checkConnection);

    const handleMessage = (event) => {

      // 提取有效内容
      const rawData = event.data.replace(/^data: /, "");

      try {
        // 处理空数据
        if (!event.data.trim()) return;
        // packetCountRef.current++;

        console.log("[原始SSE数据]", event.data); // 新增调试日志

        // 处理结束标记
        if (event.data === "[DONE]") {
          isNormalClosureRef.current = true;
          flushBuffer(callbacks);
          safeClose();
          callbacks.onComplete?.(fullResponseRef.current);
          return;
        }

        // const jsonData = JSON.parse(event.data);
        const jsonData = JSON.parse(rawData);

        // 错误处理
        if (jsonData.error) {
          callbacks.onError?.(new Error(jsonData.error));
          safeClose();
          return;
        }

        // 处理数据流
        if (jsonData.token) {
          bufferRef.current += jsonData.token;
          packetCountRef.current++; // test!

          // 动态调整刷新条件
          const shouldFlush =
            bufferRef.current.length >= 3 || // 缓冲区达3字符
            jsonData.token.match(/[\n。？！]/); // 遇到标点符号

          // 触发更新（每5字符或标点符号）
          if (shouldFlush) {
            flushBuffer(callbacks);
          }
        }
      } catch (error) {
        console.error("完整错误上下文:", {
          eventData: event.data,
          error: error.stack,
        });
        console.error('解析失败:', { rawData, error });
      }
    };

    const handleError = (event) => {
      console.error("SSE connection error:", event);
      // eventSource.close();
      safeClose();
      callbacks.onError?.(new Error("Connection failed"));
    };

    eventSource.addEventListener("message", handleMessage);
    eventSource.addEventListener("error", handleError);

    // 关闭逻辑
    const safeClose = () => {
      cancelAnimationFrame(animationFrameId);
      if (eventSource) {
        eventSource.removeEventListener("message", handleMessage);
        eventSource.removeEventListener("error", handleError);
        // 安全关闭连接
        if (eventSource.readyState === 1) {
          // OPEN 状态才需要关闭
          eventSource.close();
        }
      }
    };

    // 返回清理函数
    return () => {
      safeClose();
      flushBuffer(callbacks);
      console.log("连接清理完成");
    };
  };

  // 刷新缓冲区
  const flushBuffer = (callbacks) => {
    if (bufferRef.current.length > 0) {
      // 使用队列机制确保状态同步
      const currentBuffer = bufferRef.current;
      bufferRef.current = "";

      // 异步更新避免React批处理
      Promise.resolve().then(() => {
        fullResponseRef.current += currentBuffer;
        callbacks.onData?.(currentBuffer, fullResponseRef.current);
      });

      // fullResponseRef.current += bufferRef.current;
      // callbacks.onData?.(bufferRef.current, fullResponseRef.current);
      // bufferRef.current = "";
    }
  };

  return { startStream, streamDebug };
}
