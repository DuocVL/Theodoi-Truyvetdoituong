import { createClient } from "redis";

async function main() {
  const client = createClient({
    url: "redis://localhost:6379",
  });

  client.on("error", (err) => {
    console.error("Redis Error:", err);
  });

  try {
    // Kết nối
    await client.connect();
    console.log("✅ Connected to Redis");

    // Ghi chuỗi
    await client.set("message", "Hello Redis");
    console.log("✅ SET message");

    // Đọc chuỗi
    const message = await client.get("message");
    console.log("GET message =", message);

    // Ghi object JSON
    const user = {
      id: 1,
      username: "admin",
      role: "student",
    };

    await client.set("user:1", JSON.stringify(user));
    console.log("✅ SET user:1");

    // Đọc object JSON
    const userData = await client.get("user:1");

    if (userData) {
      console.log("GET user:1 =", JSON.parse(userData));
    }

    // TTL 10 giây
    await client.set("temp", "expires soon", {
      EX: 10,
    });

    console.log("TTL temp =", await client.ttl("temp"));

    // Kiểm tra key tồn tại
    const exists = await client.exists("message");
    console.log("message exists =", exists);

    // Liệt kê key
    const keys = await client.keys("*");
    console.log("All keys =", keys);

    // Xóa key
    await client.del("message");
    console.log("Deleted message");

    console.log(
      "message after delete =",
      await client.get("message")
    );
  } catch (err) {
    console.error(err);
  } finally {
    await client.quit();
    console.log("🔌 Disconnected");
  }
}

main();