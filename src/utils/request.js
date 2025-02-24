import axios from 'axios';

// 设置默认的 axios 实例
const instance = axios.create({
  baseURL: 'http://localhost:3001', // 后端 API 地址
  timeout: 5000, // 设置请求超时时间（毫秒）
});

// 请求拦截器：添加请求头、处理 token 等
instance.interceptors.request.use(
  (config) => {
    // 你可以在这里处理请求头，例如加入认证 token
    const token = localStorage.getItem('token'); // 从本地存储获取 token
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`; // 如果有 token，添加到请求头中
    }
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
    return response.data;
  },
  (error) => {
    // 处理响应错误
    if (error.response) {
      console.error('API 错误:', error.response.data);
    } else {
      console.error('网络错误:', error.message);
    }
    return Promise.reject(error);
  }
);

// 封装一个统一的请求方法
const request = (url, options = {}) => {
  return instance(url, options)
    .then((response) => response)
    .catch((error) => {
      // 在这里可以对错误进行处理
      console.error('请求失败', error);
      throw error;  // 抛出错误让调用者处理
    });
};

export default request;
