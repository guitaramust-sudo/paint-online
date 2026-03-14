import Tool from "./Tool";

export default class Circle extends Tool {
  mouseDown: boolean;
  startX: number;
  startY: number;
  savedImage: string;
  currentX: number;
  currentY: number;

  constructor(canvas: HTMLCanvasElement, socket: WebSocket, id: string) {
    super(canvas, socket, id);
    this.mouseDown = false;
    this.startX = 0;
    this.startY = 0;
    this.currentX = 0;
    this.currentY = 0;
    this.savedImage = "";
    this.listen();
  }

  listen() {
    this.canvas.onmousedown = this.mouseDownHandler.bind(this);
    this.canvas.onmousemove = this.mouseMoveHandler.bind(this);
    this.canvas.onmouseup = this.mouseUpHandler.bind(this);
  }

  mouseDownHandler(e: MouseEvent) {
    this.mouseDown = true;
    this.startX = e.offsetX;
    this.startY = e.offsetY;
    this.currentX = e.offsetX;
    this.currentY = e.offsetY;
    this.savedImage = this.canvas.toDataURL();
  }

  mouseMoveHandler(e: MouseEvent) {
    if (this.mouseDown) {
      this.currentX = e.offsetX;
      this.currentY = e.offsetY;

      // Временная отрисовка (preview) - только на локальном канвасе
      this.drawPreview();
    }
  }

  drawPreview() {
    const centerX = (this.currentX + this.startX) / 2;
    const centerY = (this.currentY + this.startY) / 2;
    const radius =
      Math.sqrt(
        Math.pow(this.currentX - this.startX, 2) +
          Math.pow(this.currentY - this.startY, 2),
      ) / 2;

    const img = new Image();
    img.src = this.savedImage;
    img.onload = () => {
      this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.context.drawImage(img, 0, 0, this.canvas.width, this.canvas.height);
      this.context.beginPath();
      this.context.arc(centerX, centerY, radius, 0, Math.PI * 2);
      this.context.stroke();
    };
  }

  mouseUpHandler() {
    this.mouseDown = false;

    // Финальная отрисовка - отправляем на сервер для всех пользователей
    const centerX = (this.currentX + this.startX) / 2;
    const centerY = (this.currentY + this.startY) / 2;
    const radius =
      Math.sqrt(
        Math.pow(this.currentX - this.startX, 2) +
          Math.pow(this.currentY - this.startY, 2),
      ) / 2;

    this.socket.send(
      JSON.stringify({
        method: "draw",
        id: this.id,
        figure: {
          type: "circle",
          x: centerX,
          y: centerY,
          radius: radius,
        },
      }),
    );

    // Отправляем сигнал о завершении
    this.socket.send(
      JSON.stringify({
        method: "draw",
        id: this.id,
        figure: {
          type: "finish",
        },
      }),
    );
  }

  static draw(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.stroke();
  }
}
