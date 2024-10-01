require("dotenv").config();

const fs = require("fs");
const http = require("http");
const path = require("path");

const proxyIp = process.env.PROXY_IP || "5.42.77.69";
const proxyPort = process.env.PROXY_PORT || "31280";
const proxy = `PROXY ${proxyIp}:${proxyPort}`;
const whitelistFilePath = path.join(__dirname, "whitelist.txt");

// Функция генерации PAC-файла на основе whitelist-а
const generatePacFile = (domains) => `
    function FindProxyForURL(url, host) {
      var whitelist = ${JSON.stringify(domains)};
      
      for (var i = 0; i < whitelist.length; i++) {
        if (dnsDomainIs(host, whitelist[i])) 
          return ${proxy}
      }
      return "DIRECT";  // Прямое подключение
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
  if (req.url === "/default") {
    // Чтение доменов из файла whitelist-а
    getDomainsFromFile(whitelistFilePath, (err, domains) => {
      if (err) {
        res.writeHead(500, { "Content-Type": "text/plain" });
        res.end("Ошибка чтения файла с whitelist-ом");
        return;
      }

      // Генерация PAC-файла
      const pacFileContent = generatePacFile(domains);
      res.writeHead(200, {
        "Content-Type": "application/x-ns-proxy-autoconfig",
      });
      res.end(pacFileContent);
    });
  } else {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Страница не найдена");
  }
});

// Запуск сервера на порту 3000
server.listen(3005, () => {
  console.log("Сервер запущен на http://localhost:3005");
});
