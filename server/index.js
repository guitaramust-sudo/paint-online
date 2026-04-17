const express = require("express");
const path = require("path");
const app = express();
const WSServer = require("express-ws")(app);
const aWss = WSServer.getWss();
const PORT = 12345;

// Хранилище сессий и их истории
const sessions = new Map();

// Путь к клиентским файлам
const clientDistPath = path.resolve(__dirname, "../client/dist");

// Раздача статических файлов из папки client/dist
app.use(express.static(clientDistPath));

// WebSocket маршрут
app.ws("/", (ws, req) => {
  ws.on("message", (msg) => {
    msg = JSON.parse(msg);

    switch (msg.method) {
      case "connection":
        connectionHandler(ws, msg);
        break;
      case "draw":
        drawHandler(ws, msg);
        break;
      case "clear":
        clearHandler(ws, msg);
        break;
    }
  });

  ws.on("close", () => {
    // Очищаем закрытые соединения из сессий
    sessions.forEach((session, sessionId) => {
      session.clients = session.clients.filter((client) => client !== ws);
    });
  });
});

// API маршруты (должны быть до catch-all маршрута)
app.get("/session/:id/stats", (req, res) => {
  const sessionId = req.params.id;
  if (sessions.has(sessionId)) {
    const session = sessions.get(sessionId);
    res.json({
      id: sessionId,
      clientsCount: session.clients.length,
      historyLength: session.history.length,
      clients: session.clients.map((c) => c.id),
    });
  } else {
    res.status(404).json({ error: "Сессия не найдена" });
  }
});

// Для SPA (Single Page Application) - все неизвестные маршруты отдаем index.html
// Используем middleware функцию вместо '*' wildcard
app.use((req, res, next) => {
  // Проверяем, не является ли запрос на API
  if (req.path.startsWith("/session/") && req.method === "GET") {
    return next();
  }

  // Проверяем, не является ли запрос на WebSocket (обычно не нужно, но для безопасности)
  if (
    req.headers.upgrade &&
    req.headers.upgrade.toLowerCase() === "websocket"
  ) {
    return next();
  }

  res.sendFile(path.join(clientDistPath, "index.html"), (err) => {
    if (err) {
      console.error("Ошибка при отправке index.html:", err);
      next(err);
    }
  });
});

// Обработка ошибок
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Что-то пошло не так!");
});

app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
  console.log(`Статические файлы обслуживаются из: ${clientDistPath}`);
});

const connectionHandler = (ws, msg) => {
  ws.id = msg.id;

  // Создаем сессию если её нет
  if (!sessions.has(msg.id)) {
    sessions.set(msg.id, {
      clients: [],
      history: [],
    });
  }

  const session = sessions.get(msg.id);
  session.clients.push(ws);

  console.log(`Пользователь ${msg.username} подключился к сессии ${msg.id}`);

  // Отправляем приветственное сообщение
  ws.send(
    JSON.stringify({
      method: "connection",
      message: `Добро пожаловать, ${msg.username}!`,
      username: msg.username,
    }),
  );

  // Отправляем историю новому пользователю
  if (session.history.length > 0) {
    console.log(
      `Отправляем историю (${session.history.length} действий) пользователю ${msg.username}`,
    );

    // Отправляем всю историю одним сообщением
    ws.send(
      JSON.stringify({
        method: "loadHistory",
        history: session.history,
        message: `Загружено ${session.history.length} предыдущих действий`,
      }),
    );
  }

  // Уведомляем остальных о новом пользователе
  broadcastToSession(
    ws,
    msg.id,
    {
      method: "userConnected",
      username: msg.username,
      message: `Пользователь ${msg.username} подключился`,
    },
    ws,
  ); // Исключаем отправителя
};

const drawHandler = (ws, msg) => {
  if (!sessions.has(msg.id)) return;

  const session = sessions.get(msg.id);

  // Важно! Сохраняем ID отправителя
  const senderId = ws.id;
  const senderUsername = ws.username;

  // Добавляем информацию об отправителе в сообщение
  const enrichedMessage = {
    ...msg,
    senderId: senderId,
    senderUsername: senderUsername,
    timestamp: Date.now(),
  };

  // Сохраняем в историю
  session.history.push(enrichedMessage);

  // Рассылаем ВСЕМ клиентам (включая отправителя)
  // Но на клиенте мы будем игнорировать свои сообщения
  session.clients.forEach((client) => {
    if (client.readyState === 1) {
      client.send(JSON.stringify(enrichedMessage));
    }
  });

  // Ограничиваем историю
  if (session.history.length > 1000) {
    session.history = session.history.slice(-1000);
  }
};
const clearHandler = (ws, msg) => {
  if (sessions.has(msg.id)) {
    sessions.get(msg.id).history = [];
    console.log(`Сессия ${msg.id} очищена`);
  }

  broadcastToSession(ws, msg.id, {
    method: "clear",
    message: "Холст очищен",
  });
};

const broadcastToSession = (ws, sessionId, message, excludeSender = null) => {
  if (sessions.has(sessionId)) {
    const session = sessions.get(sessionId);
    session.clients.forEach((client) => {
      if (client !== excludeSender && client.readyState === 1) {
        client.send(JSON.stringify(message));
      }
    });
  }
};
