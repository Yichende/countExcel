import ExcelUploader from "./component/ExcelUploader";
import TerminalInterface from "./component/TerminalInterface";
import "./App.css";
import { askAI, Test, startOllama, fetchWithRetry } from "./services/api";
import { excelToMarkdown, markdownToExcel } from "./utils/excel2Markdown";
import axios from "axios";

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

      // 步骤2：建立流式连接
      return new Promise((resolve, reject) => {
        const eventSource = new EventSource(
          `${API_BASE_URL}/api/stream/${sessionId}`
        );

        eventSource.onopen = () => {
          console.log("连接已建立");
        };

        let buffer = "";

        eventSource.onmessage = (e) => {
          try {
            console.log("[原始事件数据]", e.data); // test!

            if (e.data === "[DONE]") {
              console.log("[流结束] 最终内容长度:", buffer.length); // test!
              eventSource.close();
              return resolve(buffer);
            }

            const payload = JSON.parse(e.data);
            console.log("[解析后payload]", payload); // test!

            if (payload.error) throw new Error(payload.error);

            buffer += payload.token;
            console.log("[实时缓冲] 当前长度:", buffer.length, "内容:", buffer); // test!
          } catch (err) {
            console.error('[消息处理异常]', err); // test!
            eventSource.close();
            reject(err);
          }
        };

        eventSource.onerror = () => {
          eventSource.close();
          reject(new Error("流连接异常"));
        };
      });
    } catch (err) {
      throw new Error(`请求失败: ${err.message}`);
    }
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

  return (
    <div className="displayArea">
      <ExcelUploader />
      <div>
        <TerminalInterface />
        <button onClick={startServe}>启动服务</button>
        <button onClick={() => handleTestRequest(1)}>测试</button>
        <button onClick={() => executeStreamDemo()}>流式测试</button>
      </div>
    </div>
  );
}

export default App;
