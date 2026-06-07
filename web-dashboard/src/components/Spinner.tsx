/**
 * @file Spinner.tsx
 * @description
 * Cung cấp một component `Spinner` đơn giản, dùng để hiển thị trạng thái đang tải (loading).
 * Component này có thể tùy chỉnh kích thước thông qua props.
 */

import React from 'react';
import styled, { keyframes } from 'styled-components';

// ==================================================================
// STYLED COMPONENTS & KEYFRAMES
// ==================================================================

// Định nghĩa animation cho hiệu ứng xoay vô tận.
// `keyframes` là một helper từ styled-components để tạo animation CSS.
const spin = keyframes`
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
`;

// Styled component cho hình ảnh spinner.
// Đây là một div được style để trông giống một vòng tròn xoay.
const SpinnerContainer = styled.div<{ size: number }>`
  border: ${({ size }) => `${Math.max(2, Math.floor(size / 8))}px`} solid rgba(0, 0, 0, 0.1);
  border-left-color: #3498db; /* Màu của phần đang xoay, tạo điểm nhấn. */
  border-radius: 50%; /* Biến div thành hình tròn. */
  
  /* Kích thước của spinner được truyền qua props. */
  width: ${({ size }) => `${size}px`};
  height: ${({ size }) => `${size}px`};

  /* Áp dụng animation đã định nghĩa ở trên. */
  animation: ${spin} 1.1s linear infinite;
`;

// ==================================================================
// INTERFACE & COMPONENT
// ==================================================================

// Định nghĩa kiểu cho props của component Spinner.
interface SpinnerProps {
    size?: number; // Kích thước (chiều rộng và cao) của spinner, tính bằng pixels. Đây là prop không bắt buộc.
}

/**
 * Component `Spinner` dùng để hiển thị trạng thái tải.
 * @param {SpinnerProps} props - Props của component.
 * @param {number} [props.size=40] - Kích thước của spinner. Mặc định là 40px.
 * @returns {React.ReactElement}
 */
const Spinner: React.FC<SpinnerProps> = ({ size = 40 }) => {
    // Component trả về một `SpinnerContainer` đã được style, 
    // truyền `size` prop vào để styled-component có thể sử dụng.
    // `data-testid` được thêm vào để hỗ trợ cho việc viết test (ví dụ: với React Testing Library).
    return <SpinnerContainer size={size} data-testid="spinner" />;
};

export default Spinner;
