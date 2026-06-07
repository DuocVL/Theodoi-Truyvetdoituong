/**
 * @file main.tsx
 * @description
 * Đây là điểm vào (entry point) chính của ứng dụng React.
 * File này chịu trách nhiệm render component `App` vào trong DOM của trình duyệt.
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css'; // Import các style toàn cục

// Lấy phần tử root từ file index.html.
const rootElement = document.getElementById('root');

// Đảm bảo rằng phần tử root thực sự tồn tại trong DOM trước khi render.
if (!rootElement) {
  throw new Error("Không tìm thấy phần tử root. Hãy chắc chắn rằng có một div với id='root' trong file index.html của bạn.");
}

// Sử dụng ReactDOM.createRoot để tạo một root cho ứng dụng React 18+.
// API này cho phép sử dụng các tính năng mới như Concurrent Mode.
const root = ReactDOM.createRoot(rootElement);

// Render component `App` vào trong root.
// React.StrictMode là một công cụ giúp phát hiện các vấn đề tiềm ẩn trong ứng dụng.
// Nó kích hoạt các kiểm tra và cảnh báo bổ sung cho các component con của nó.
// StrictMode chỉ chạy trong môi trường development và không ảnh hưởng đến production build.
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
