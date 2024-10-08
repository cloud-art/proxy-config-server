require("dotenv").config();

const fs = require("fs");
const http = require("http");
const path = require("path");

const serverPort = process.env.SERVER_PORT || 3005;
const proxyIp = process.env.PROXY_IP || "127.0.0.1";
const proxyPort = process.env.PROXY_PORT || "3128";
const whitelistFileName = process.env.whitelist || "whitelist.txt";

const proxy = `PROXY ${proxyIp}:${proxyPort}`;
const whitelistFilePath = path.join(__dirname, whitelistFileName);

// Функция генерации PAC-файла на основе whitelist-а
const generatePacFile = (domains) => `
    function FindProxyForURL(url, host) {
      url = url.toLowerCase();
      host = host.toLowerCase();
      const domains = ${domains};

      if (dnsResolve(host) === '${proxyIp}') return "DIRECT";
      
      for (const domain of domains) {
        if (dnsDomainIs(host, domain)) return '${proxy}';
      }

      return "DIRECT"; 
    }
  `;

// Функция чтения доменов из файла
function getDomainsFromFile(filePath, callback) {
  fs.readFile(filePath, "utf8", (err, data) => {
    if (err) {
      callback(err, null);
    } else {
      // Разделяем файл по строкам и фильтруем пустые строки
      const domains = data.split(/\r?\n/).filter(Boolean);
      callback(null, domains);
    }
  });
}

// Создание HTTP-сервера
const server = http.createServer((req, res) => {
  if (req.url === "/") {
    // Чтение доменов из файла whitelist-а
    getDomainsFromFile(whitelistFilePath, (err, domains) => {
      if (err) {
        res.writeHead(500, { "Content-Type": "text/plain" });
        res.end("Ошибка чтения файла с whitelist-ом");
        return;
      }

      // Генерация PAC-файла
      const pacFileContent = generatePacFile(JSON.stringify(domains));
      res.writeHead(200, {
        "Content-Type": "application/x-ns-proxy-autoconfig",
        "Content-Disposition": "attachment; filename=proxy.pac",
      });
      res.end(pacFileContent);
    });
  } else {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Страница не найдена");
  }
});

// Запуск сервера на порту 3005
server.listen(serverPort, () => {
  console.log(`Сервер запущен на http://localhost:${serverPort}`);
});
