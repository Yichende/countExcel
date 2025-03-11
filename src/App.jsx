import ExcelUploader from "./component/ExcelUploader";
import TerminalInterface from "./component/TerminalInterface";
import "./App.css";
import { askAI, Test, startOllama, fetchWithRetry, stopOllama } from "./services/api";
import { excelToMarkdown, markdownToExcel } from "./utils/excel2Markdown";
import axios from "axios";
import { useRef } from "react";

function App() {
  const MAX_RETRY = 2;
  const handleTestRequest = async (retryCount) => {
    try {
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

      const result = await askAI(markdownTable, "计算总销量");
      console.log(result);
    } catch (err) {
      if (retryCount < MAX_RETRY) {
        console.log(`请求失败，第${retryCount}次重试`);
        return handleTestRequest(++retryCount);
      }
      console.log(err);
    }
  };

  const handleTestStreamRequest = async () => {
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
    const question = "计算总销量";

    try {
      // 步骤1：初始化会话
      const initResponse = await fetchWithRetry(
        `${API_BASE_URL}/api/init-stream`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            markdownTable,
            question,
          }),
        }
      );

      // 增强响应处理
      if (!initResponse.ok) {
        const errorData = await initResponse.json();
        throw new Error(`[${initResponse.status}] ${errorData.message}`);
      }

      const { sessionId } = await initResponse.json();

      // 使用ref保持持久化引用
      const eventSourceRef = useRef(null);
      const bufferRef = useRef("");
      const fullResponseRef = useRef("");
      const packetCountRef = useRef(0);

      // 核心处理函数
      const startStream = (sessionId, callbacks) => {
        // 清理现有连接
        if (eventSourceRef.current) {
          eventSourceRef.current.close();
          console.warn("已有活跃连接，先关闭旧连接");
        }

        // 初始化状态
        bufferRef.current = "";
        fullResponseRef.current = "";
        packetCountRef.current = 0;

        // 创建新连接
        const eventSource = new EventSource(
          `${API_BASE_URL}/api/stream/${sessionId}`
        );
        eventSourceRef.current = eventSource;

        // 消息处理器
        const handleMessage = (event) => {
          try {
            packetCountRef.current++;

            // 处理结束标记
            if (event.data === "[DONE]") {
              flushBuffer(callbacks);
              eventSource.close();
              if (callbacks.onComplete) {
                callbacks.onComplete(fullResponseRef.current);
              }
              return;
            }

            // 解析数据包
            const jsonData = JSON.parse(event.data);

            // 错误处理
            if (jsonData.error) {
              eventSource.close();
              if (callbacks.onError) {
                callbacks.onError(new Error(jsonData.error));
              }
              return;
            }

            // 流式数据处理
            if (jsonData.token) {
              bufferRef.current += jsonData.token;

              // 触发渲染更新（每5字符或标点符号时）
              if (
                packetCountRef.current % 5 === 0 ||
                /[\n。？！]/.test(jsonData.token)
              ) {
                flushBuffer(callbacks);
              }
            }
          } catch (error) {
            console.error("[数据解析错误]", error);
            if (callbacks.onError) {
              callbacks.onError(error);
            }
          }
        };

        // 错误处理器
        const handleError = (event) => {
          console.error("[SSE连接错误]", event);
          eventSource.close();
          if (callbacks.onError) {
            callbacks.onError(new Error("SSE连接异常"));
          }
        };

        // 绑定监听器
        eventSource.addEventListener("message", handleMessage);
        eventSource.addEventListener("error", handleError);

        // 返回终止方法
        return () => {
          eventSource.close();
          flushBuffer(callbacks);
          console.log("[手动终止] 流式请求");
        };
      };
    } catch (err) {
      throw new Error(`请求失败: ${err.message}`);
    }

    return <div>请查看浏览器控制台输出</div>;
  };

  const executeStreamDemo = async () => {
    try {
      const result = await handleTestStreamRequest();
      console.log("最终响应:", result);
    } catch (streamErr) {
      console.error("流处理异常:", streamErr);
    }
  };

  const startServe = async () => {
    try {
      const res = await startOllama();
      console.log(res);
    } catch (err) {
      console.log(err);
    }
  };

  const stopServe = async () => {
    try {
      const res = await stopOllama();
      console.log(res);
    } catch (err) {
      console.log(err)
    }
  }

  return (
    <div className="displayArea">
      <ExcelUploader />
      <div className="bufferDisplay">
        <TerminalInterface />
        <div>
          <button onClick={startServe}>启动服务</button>
          <button onClick={stopServe}>关闭服务</button>
          <button onClick={() => handleTestRequest(1)}>测试</button>
          <button onClick={() => executeStreamDemo()}>流式测试</button>
        </div>
      </div>
    </div>
  );
}

export default App;
