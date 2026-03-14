import Tool from "./Tool";

export default class Line extends Tool {
  mouseDown: boolean;
  startX: number;
  startY: number;
  savedImage: string;
  currentX: number;
  currentY: number;

  constructor(
    canvas: HTMLCanvasElement,
    socket: WebSocket | null = null,
    id: string | null = null,
  ) {
    super(canvas, socket as WebSocket, id as string);
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
      this.drawPreview(this.currentX, this.currentY);
    }
  }

  mouseUpHandler() {
    this.mouseDown = false;

    // Сохраняем последние координаты из движения мыши
    const endX = this.currentX;
    const endY = this.currentY;

    // Финальная отрисовка на локальном canvas
    this.finishDrawing(endX, endY);

    if (this.socket && this.id) {
      this.socket.send(
        JSON.stringify({
          method: "draw",
          id: this.id,
          figure: {
            type: "line",
            startX: this.startX,
            startY: this.startY,
            endX: endX,
            endY: endY,
          },
        }),
      );

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
  }

  // Метод для превью (временная отрисовка во время движения мыши)
  drawPreview(x: number, y: number) {
    const img = new Image();
    img.src = this.savedImage;
    img.onload = () => {
      this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.context.drawImage(img, 0, 0, this.canvas.width, this.canvas.height);
      this.context.beginPath();
      this.context.moveTo(this.startX, this.startY);
      this.context.lineTo(x, y);
      this.context.stroke();
    };
  }

  // Метод для завершения рисования
  finishDrawing(x: number, y: number) {
    const img = new Image();
    img.src = this.savedImage;
    img.onload = () => {
      this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.context.drawImage(img, 0, 0, this.canvas.width, this.canvas.height);
      this.context.beginPath();
      this.context.moveTo(this.startX, this.startY);
      this.context.lineTo(x, y);
      this.context.stroke();

      // Сохраняем новое состояние для undo/redo
      this.savedImage = this.canvas.toDataURL();
    };
  }

  // Статический метод для финальной отрисовки (для получения с сервера)
  static draw(
    ctx: CanvasRenderingContext2D,
    startX: number,
    startY: number,
    endX: number,
    endY: number,
  ) {
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();
  }
}
