export const logger = {
  // Ghi nhật ký thông tin chung
  info: (message: string, meta?: any) => {
    console.log(JSON.stringify({
      level: "info",
      message,
      ...meta,
      timestamp: new Date().toISOString()
    }))
  },

  // Ghi nhật ký lỗi (cực kỳ quan trọng để debug)
  error: (message: string, meta?: any) => {
    console.error(JSON.stringify({
      level: "error",
      message,
      ...meta,
      timestamp: new Date().toISOString()
    }))
  }
}