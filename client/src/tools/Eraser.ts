import Tool from "./Tool";

export default class Eraser extends Tool {
  mouseDown: boolean;
  indicator: HTMLDivElement;
  radius: number = 60;

  constructor(canvas: HTMLCanvasElement, socket: WebSocket, id: string) {
    super(canvas, socket, id);
    this.mouseDown = false;

    this.indicator = this.createIndicator();

    this.listen();
  }

  createIndicator(): HTMLDivElement {
    const div = document.createElement("div");
    div.className = "eraser-indicator";

    div.style.width = this.radius * 2 + "px";
    div.style.height = this.radius * 2 + "px";

    return div;
  }

  listen() {
    this.canvas.onmousedown = this.mouseDownHandler.bind(this);
    this.canvas.onmousemove = this.mouseMoveHandler.bind(this);
    this.canvas.onmouseup = this.mouseUpHandler.bind(this);
    document.addEventListener("mouseup", this.mouseUpHandler.bind(this));

    this.canvas.onmouseenter = () => {
      this.indicator.style.display = "block";
    };

    this.canvas.onmouseleave = () => {
      this.indicator.style.display = "none";
    };
  }
  mouseUpHandler() {
    this.mouseDown = false;
    document.body.removeChild(this.indicator);
  }

  mouseDownHandler(e: MouseEvent) {
    this.mouseDown = true;
    document.body.appendChild(this.indicator);
    this.context.beginPath();
    this.context.moveTo(e.offsetX, e.offsetY);
  }

  mouseMoveHandler(e: MouseEvent) {
    if (this.mouseDown) {
      this.updateIndicatorPosition(e.offsetX, e.offsetY);

      Eraser.eraseCircle(
        e.offsetX,
        e.offsetY,
        this.radius,
        this.context,
        this.canvas,
      );

      this.socket.send(
        JSON.stringify({
          method: "draw",
          id: this.id,
          figure: {
            type: "eraser",
            x: e.offsetX,
            y: e.offsetY,
            radius: this.radius,
          },
        }),
      );
    }
  }

  updateIndicatorPosition(x: number, y: number) {
    const canvasRect = this.canvas.getBoundingClientRect();
    this.indicator.style.left = canvasRect.left + x + "px";
    this.indicator.style.top = canvasRect.top + y + "px";
  }

  static eraseCircle(
    x: number,
    y: number,
    radius: number,
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
  ) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.clip();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
  }
}
