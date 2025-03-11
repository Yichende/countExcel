import React, { useState, useEffect } from "react";
import { useStreamHandler } from "../services/api";
import Textarea from "./textArea";

function TerminalInterface() {
  const [input, setInput] = useState("");

  const [output, setOutput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const { startStream, streamDebug } = useStreamHandler();

  // useEffect(() => {
  //   const interval = setInterval(() => { // test!
  //     console.log('连接状态:', streamDebug());
  //   }, 1000);
  //   return () => clearInterval(interval);
  // }, []);

  // 初始化请求并启动流
  const handleClick = async () => {
    // 添加请求标记
    const requestId = Date.now();
    console.log(`[${requestId}] 启动请求流程`); // test!

    setError(null);
    setIsLoading(true);
    const markdownTable = `
      | 月份   | 产品名称       | 销量（单位：件） | 增长率（%） | 地区    | 是否有促销活动 |
      |--------|----------------|------------------|------------|---------|---------------|
      | 2023-12 | 智能音箱     | 5,800            | 15.2       | 全国     | 是             |
      | 2023-11 | 蓝牙耳机     | 4,200            | 6.7        | 全国     | 是             |
      | 2023-10 | 智能手表     | 3,500            | -8.9       | 全国     | 否             |
      | 2023-09 | 手机壳       | 6,700            | 4.3        | 全国     | 是             |
      | 2023-08 | 耳机         | 5,100            | -3.2       | 北京     | 是             |
      | 2023-07 | 手机           | 4,900            | -6.5       | 上海     | 否             |
      | 2023-06 | 智能耳机     | 8,100            | 12.4       | 全国     | 是             |`;
    const question = "计算总销量，不需要考虑增长率";

    try {
      // 第一步：获取sessionId
      const initResponse = await fetch(`${API_BASE_URL}/api/init-stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          markdownTable, // 替换实际数据
          question, // 替换实际问题
        }),
      });

      console.log(`[${requestId}] 初始化响应:`, initResponse); // test!

      if (!initResponse.ok) {
        const errorData = await initResponse.json();
        throw new Error(`[${initResponse.status}] ${errorData.message}`);
      }

      const { sessionId } = await initResponse.json();

      // 第二步：启动流式传输
      const stopStream = startStream(sessionId, {
        onData: (token, fullText) => {
          const normalizedContent = fullText
            .replace(/\\n/g, "\n") // 处理转义换行符
            .replace(/\r\n/g, "\n"); // 统一换行符格式
          setOutput(normalizedContent);
          console.log("[Stream token]", token);
        },
        onError: (err) => {
          setError(err.message);
          setIsLoading(false);
        },
        onComplete: (finalText) => {
          setIsLoading(false);
          console.log("[Complete]", finalText);
        },
      });

      // 组件卸载时自动清理
      return () => {
        stopStream?.();
        setIsLoading(false);
      };
    } catch (err) {
      setError(err.message);
      setIsLoading(false);
      console.error(`[${requestId}] 完整错误链:`, err.stack);
    }
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
  };

  return (
    <div>
      <h1>Terminal</h1>
      <input
        type="text"
        value={input}
        onChange={handleInputChange}
        placeholder="Enter command"
      />
      <button
        onClick={handleClick}
        disabled={isLoading}>
        {isLoading ? "请求中..." : "开始对话"}
      </button>
      {error && <div style={{ color: "red" }}>错误: {error}</div>}

      <div>
        <h3>实时响应：</h3>
        {/* <pre>{output}</pre> */}
        {output && <Textarea content={output} />}
        {/* <Textarea content={output}/> */}
      </div>
    </div>
  );
}

export default TerminalInterface;
