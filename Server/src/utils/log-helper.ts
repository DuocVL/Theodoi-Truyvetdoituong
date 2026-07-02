//log-helper.ts cấu trúc hóa log in ra màn hình 

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

  // Ghi nhật ký lỗi để debug
  error: (message: string, meta?: any) => {
    console.error(JSON.stringify({
      level: "error",
      message,
      ...meta,
      timestamp: new Date().toISOString()
    }))
  }
}