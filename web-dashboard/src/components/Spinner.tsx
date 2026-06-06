import React from 'react';
import styled, { keyframes } from 'styled-components';

// Keyframes cho hiệu ứng xoay
const spin = keyframes`
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
`;

// Styled component cho hình ảnh spinner
const SpinnerContainer = styled.div<{ size: number }>`
  border: ${({ size }) => `${Math.max(2, Math.floor(size / 8))}px`} solid rgba(0, 0, 0, 0.1);
  border-left-color: #3498db; // Một màu xanh dễ chịu
  border-radius: 50%;
  width: ${({ size }) => `${size}px`};
  height: ${({ size }) => `${size}px`};
  animation: ${spin} 1.1s linear infinite;
`;

interface SpinnerProps {
    size?: number; // Kích thước của spinner (pixels)
}

/**
 * Component Spinner đơn giản và có thể tái sử dụng.
 */
const Spinner: React.FC<SpinnerProps> = ({ size = 40 }) => {
    return <SpinnerContainer size={size} data-testid="spinner" />;
};

export default Spinner;
