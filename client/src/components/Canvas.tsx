/* eslint-disable @typescript-eslint/no-explicit-any */
import { observer } from "mobx-react-lite";
import "../styles/canvas.scss";
import { useEffect, useRef, useState } from "react";
import canvasState from "../store/canvasState";
import { Button, Modal } from "react-bootstrap";
import { useParams } from "react-router-dom";
import Brush from "../tools/Brush";
import Circle from "../tools/Circle";
import Line from "../tools/Line";
import Eraser from "../tools/Eraser";
import Rect from "../tools/Rect";

interface CanvasParams {
  id: string;
}

const Canvas = observer(() => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const usernameRef = useRef<HTMLInputElement>(null);
  const [modal, setModal] = useState(true);
  const params = useParams<CanvasParams>();

  // Генерируем уникальный ID для пользователя
  const generateUserId = () => {
    return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  };

  useEffect(() => {
    canvasState.setCanvas(canvasRef.current);
  }, []);

  useEffect(() => {
    if (canvasState.username) {
      const socket = new WebSocket("ws://10.223.160.166:12345/");
      canvasState.setSocket(socket);
      canvasState.setId(params.id);

      // Генерируем userId
      const userId = generateUserId();

      // При создании WebSocket соединения
      socket.onopen = () => {
        socket.send(
          JSON.stringify({
            id: params.id,
            username: canvasState.username,
            method: "connection",
            userId: userId, // Используем сгенерированный ID
          }),
        );
      };

      socket.onmessage = (e) => {
        const msg = JSON.parse(e.data);

        switch (msg.method) {
          case "connection":
            console.log(`Сервер: ${msg.message}`);
            break;

          case "loadHistory":
            console.log(`Загружаем историю: ${msg.message}`);
            if (msg.history && msg.history.length > 0) {
              loadHistory(msg.history);
            }
            break;

          case "draw":
            drawHandler(msg);
            break;

          case "clear":
            clearCanvas();
            break;

          case "userConnected":
            console.log(msg.message);
            break;
        }
      };

      socket.onclose = () => {
        console.log("Соединение с сервером закрыто");
      };

      socket.onerror = (error) => {
        console.error("Ошибка WebSocket:", error);
      };
    }

    return () => {
      if (canvasState.socket) {
        canvasState.socket.close();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvasState.username, params.id]);

  const loadHistory = (history: any[]) => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx || !canvasRef.current) return;

    console.log(`Воспроизводим ${history.length} действий из истории`);

    // Сохраняем текущие настройки кисти
    const currentStrokeStyle = ctx.strokeStyle;
    const currentFillStyle = ctx.fillStyle;
    const currentLineWidth = ctx.lineWidth;

    // Очищаем canvas перед воспроизведением
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

    // Воспроизводим каждое действие
    history.forEach((msg) => {
      if (msg.method === "draw") {
        drawHandler(msg);
      }
    });

    // Восстанавливаем настройки кисти
    ctx.strokeStyle = currentStrokeStyle;
    ctx.fillStyle = currentFillStyle;
    ctx.lineWidth = currentLineWidth;
  };

  const clearCanvas = () => {
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx && canvasRef.current) {
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  };

  const drawHandler = (msg: any) => {
    const figure = msg.figure;
    const ctx = canvasRef.current?.getContext("2d");

    if (!ctx) return;

    switch (figure.type) {
      case "brush":
        if (figure.x !== undefined && figure.y !== undefined) {
          Brush.draw(figure.x, figure.y, ctx);
        }
        break;

      case "finish":
        ctx.beginPath();
        break;

      case "circle":
        if (
          figure.x !== undefined &&
          figure.y !== undefined &&
          figure.radius !== undefined
        ) {
          Circle.draw(ctx, figure.x, figure.y, figure.radius);
        }
        break;

      case "line":
        if (
          figure.startX !== undefined &&
          figure.startY !== undefined &&
          figure.endX !== undefined &&
          figure.endY !== undefined
        ) {
          Line.draw(
            ctx,
            figure.startX,
            figure.startY,
            figure.endX,
            figure.endY,
          );
        }
        break;

      case "color":
        if (figure.color) {
          ctx.strokeStyle = figure.color;
          ctx.fillStyle = figure.color;
        }
        break;

      case "eraser":
        if (
          canvasRef.current &&
          figure.x !== undefined &&
          figure.y !== undefined &&
          figure.radius !== undefined
        ) {
          Eraser.eraseCircle(
            figure.x,
            figure.y,
            figure.radius,
            ctx,
            canvasRef.current,
          );
        }
        break;

      case "rect":
        if (
          canvasRef.current &&
          figure.x !== undefined &&
          figure.y !== undefined &&
          figure.width !== undefined &&
          figure.height !== undefined
        ) {
          Rect.draw(
            figure.x,
            figure.y,
            figure.width,
            figure.height,
            figure.savedImage,
            ctx,
            canvasRef.current,
          );
        }
        break;

      default:
        console.log("Неизвестный тип фигуры:", figure.type);
    }
  };

  const mouseDownHandler = () => {
    if (canvasRef.current) {
      canvasState.pushToUndo(canvasRef.current.toDataURL());
    }
  };

  const connectHandler = () => {
    if (usernameRef.current && usernameRef.current.value.trim()) {
      canvasState.setUsername(usernameRef.current.value.trim());
      setModal(false);
    } else {
      alert("Пожалуйста, введите имя");
    }
  };

  return (
    <div className="canvas">
      <Modal show={modal} onHide={() => {}} backdrop="static" keyboard={false}>
        <Modal.Header>
          <Modal.Title>Введите имя</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <input
            type="text"
            ref={usernameRef}
            className="form-control"
            placeholder="Ваше имя"
            onKeyPress={(e) => e.key === "Enter" && connectHandler()}
            autoFocus
          />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={() => connectHandler()}>
            Войти
          </Button>
        </Modal.Footer>
      </Modal>

      <canvas
        width={1000}
        height={600}
        ref={canvasRef}
        onMouseDown={mouseDownHandler}
      />
    </div>
  );
});

export default Canvas;
