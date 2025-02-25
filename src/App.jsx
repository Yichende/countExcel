import ExcelUploader from "./component/ExcelUploader";
import TerminalInterface from "./component/TerminalInterface";
import "./App.css";
import { askAI, Test, startOllama } from "./services/api";
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
        <button onClick={()=>handleTestRequest(1)}>测试</button>
      </div>
    </div>
  );
}

export default App;
