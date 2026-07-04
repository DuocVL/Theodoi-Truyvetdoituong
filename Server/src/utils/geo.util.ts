//xử lý việc tính toán khoảng cách giữa 2 điểm GPS(kinh độ , vĩ độ)

const EARTH_RADIUS_M = 6371000;//bán kính trái đất m

//tính toán khoảng cách
export function haversineDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (v: number) => (v * Math.PI) / 180;//dữ liệu lưu với đơn vị là độ nên cần chuyển sang radian
  //tính chênh lệch
  const dLat = toRad(lat2 - lat1);//delta vĩ độ
  const dLon = toRad(lon2 - lon1);//delta kinh độ
  //công thức Haversine a= sin2(dLat/2) + cos(lat1)*cos(lat2)*sin2(dLon/2)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return EARTH_RADIUS_M * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));//trả về khoản cách R* 2*arctan(sqrt(a)/sqrt(1-a))
}

//hàm kiểm tra xem 1 điểm có nằm trong 1 vùng không trả true nếu trong vùng
export function isInsideZone(lat: number, lng: number, zone: { latitude: number; longitude: number; radius: number }): boolean {
  return haversineDistanceMeters(lat, lng, zone.latitude, zone.longitude) <= zone.radius;
}