import Tool from "./Tool";

export default class Brush extends Tool {
  mouseDown: boolean;
  constructor(canvas: HTMLCanvasElement, socket: WebSocket, id: string) {
    super(canvas, socket, id);
    this.mouseDown = false;
    this.listen();
  }

  listen() {
    this.canvas.onmousedown = this.mouseDownHandler.bind(this);
    this.canvas.onmousemove = this.mouseMoveHandler.bind(this);
    this.canvas.onmouseup = this.mouseUpHandler.bind(this);
  }

  mouseUpHandler() {
    this.mouseDown = false;
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

  mouseDownHandler(e: MouseEvent) {
    this.mouseDown = true;
    this.context.beginPath();
    this.context.moveTo(e.offsetX, e.offsetY);
  }

  mouseMoveHandler(e: MouseEvent) {
    if (this.mouseDown) {
      // Рисуем локально
      this.context.lineTo(e.offsetX, e.offsetY);
      this.context.stroke();

      // Отправляем на сервер
      this.socket.send(
        JSON.stringify({
          method: "draw",
          id: this.id,
          figure: {
            type: "brush",
            x: e.offsetX,
            y: e.offsetY,
          },
        }),
      );
    }
  }

  static draw(x: number, y: number, ctx: CanvasRenderingContext2D) {
    ctx.lineTo(x, y);
    ctx.stroke();
  }
}
