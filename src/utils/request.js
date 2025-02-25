import { duration } from "@mui/material";
import axios from "axios";

// 设置默认的 axios 实例
const instance = axios.create({
  baseURL: "http://localhost:3001", // 后端 API 地址
  timeout: 30000, // 设置请求超时时间（毫秒）
});

// 请求拦截器：添加请求头、处理 token 等
instance.interceptors.request.use(
  (config) => {
    // 你可以在这里处理请求头，例如加入认证 token
    const token = localStorage.getItem("token"); // 从本地存储获取 token
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`; // 如果有 token，添加到请求头中
    }
    // 在请求拦截器中添加计时器
    config.metadata = { startTime: performance.now(), url: config.url };
    return config;
  },
  (error) => {
    // 处理请求错误
    return Promise.reject(error);
  }
);

// 响应拦截器：处理响应数据
instance.interceptors.response.use(
  (response) => {
    // 你可以在这里对返回的数据进行统一的处理
    const { config, data } = response;
    const endTime = performance.now();

    // 计算耗时
    const duration = endTime - config.metadata.startTime;
    console.log(`[${config.method.toUpperCase()}] ${config.url} 耗时 ${duration.toFixed(2)}ms`)
    return {
      // ...response,
      data: {
        ...data,
          duration,
      }
    };
  },
  (error) => {
    // 超时专项处理
    if (error.code === "ECONNABORTED") {
      console.warn(
        `[${error.config.url}] 请求超时 (${error.config.timeout}ms)`
      );
      return Promise.reject({
        code: "TIMEOUT",
        message: `请求超时（${Math.round(error.config.timeout / 1000)}秒）`,
        suggestion: "复杂计算需要更长时间，请稍后重试",
      });
    }
    // 返回包含耗时信息的错误格式
    // 网络错误分类处理
    const errorType = !window.navigator.onLine
      ? "NETWORK_OFFLINE"
      : "SERVER_ERROR";
    return Promise.reject({
      code: errorType,
      details: error.response?.data || error.message,
      message,
      duration,
      state: error.response?.status || 500,
      url: config.url
    });
  }
);


// 封装一个统一的请求方法
const request = (url, options = {}) => {
  return instance(url, options)
    .then((response) => response)
    .catch((error) => {
      // 在这里可以对错误进行处理
      console.error("请求失败", error);
      throw error; // 抛出错误让调用者处理
    });
};

export default request;
