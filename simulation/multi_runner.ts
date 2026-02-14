import { spawn } from "child_process";
import fs from "fs";
import dotenv from "dotenv";

// Ayarlar
const TARGET_FILE = "index_16.ts"; // Çalıştırılacak dosya
const ENV_FILES = [
  ".env_frodo",
  ".env_sam",
  ".env_pippin",
  ".env_merry",
  ".env_gandalf",
  ".env_saruman",
  ".env_aragorn",
  ".env_legolas",
  ".env_gimli",
  ".env_boromir",
]; // Kullanılacak env dosyaları
const BASE_ADMIN_PORT = 10000; // Eğer dosyada yoksa otomatik atanacak port başlangıcı

console.log(`🚀 ${ENV_FILES.length} adet client başlatılıyor...`);

const children: any[] = [];

ENV_FILES.forEach((envFile, index) => {
  if (!fs.existsSync(envFile)) {
    console.warn(`⚠️  Dosya bulunamadı: ${envFile}, atlanıyor...`);
    return;
  }

  // Env dosyasını oku ve parse et
  const fileContent = fs.readFileSync(envFile);
  const fileEnv = dotenv.parse(fileContent);

  // Eğer dosyada ADMIN_PORT yoksa, çakışmayı önlemek için biz atayalım
  let adminPort = fileEnv.ADMIN_PORT;
  if (!adminPort) {
    adminPort = (BASE_ADMIN_PORT + index).toString();
  }

  // Env dosyasında TARGET tanımlıysa onu kullan, yoksa genel varsayılanı kullan
  const targetScript = fileEnv.TARGET || TARGET_FILE;

  const cpId = fileEnv.CP_ID || `Unknown_CP_${index}`;

  const env = {
    ...process.env,
    ...fileEnv,
    ADMIN_PORT: adminPort,
    FORCE_COLOR: "1", // Logları renkli göster
  };
  // Docker vb. ortamda WS_URL verilmişse onu kullan (.env_* dosyası ezen)
  if (process.env.WS_URL) {
    env.WS_URL = process.env.WS_URL;
  }

  console.log(
    `👉 Başlatılıyor: ${envFile} | CP_ID: ${cpId} | Admin Port: ${adminPort} | Script: ${targetScript}`
  );

  const child = spawn("npx", ["tsx", targetScript], {
    env,
    stdio: "inherit",
    shell: true,
  });

  children.push(child);
});

// Ana process durdurulduğunda tüm çocukları öldür
process.on("SIGINT", () => {
  console.log("\n🛑 Tüm clientlar kapatılıyor...");
  children.forEach((child) => child.kill());
  process.exit();
});
