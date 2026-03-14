import Tool from "./Tool";

export default class Rect extends Tool {
  mouseDown: boolean;
  startX: number;
  startY: number;
  savedImage: string;

  constructor(
    canvas: HTMLCanvasElement,
    socket: WebSocket | null = null,
    id: string | null = null,
  ) {
    super(canvas, socket as WebSocket, id as string);
    this.mouseDown = false;
    this.startX = 0;
    this.startY = 0;
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
    this.savedImage = this.canvas.toDataURL();
  }

  mouseMoveHandler(e: MouseEvent) {
    if (this.mouseDown) {
      const currentX = e.offsetX;
      const currentY = e.offsetY;
      const width = currentX - this.startX;
      const height = currentY - this.startY;

      this.drawPreview(this.startX, this.startY, width, height);
    }
  }

  mouseUpHandler(e: MouseEvent) {
    const currentX = e.offsetX;
    const currentY = e.offsetY;
    const width = currentX - this.startX;
    const height = currentY - this.startY;
    this.mouseDown = false;
    this.socket.send(
      JSON.stringify({
        method: "draw",
        id: this.id,
        figure: {
          type: "rect",
          x: this.startX,
          y: this.startY,
          width: width,
          height: height,
          savedImage: this.savedImage,
        },
      }),
    );
  }

  static draw(
    x: number,
    y: number,
    w: number,
    h: number,
    savedImage: string,
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
  ) {
    const img = new Image();
    img.src = savedImage;
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      ctx.beginPath();
      ctx.rect(x, y, w, h);
      ctx.stroke();
    };
  }

  drawPreview(x: number, y: number, w: number, h: number) {
    const img = new Image();
    img.src = this.savedImage;
    img.onload = () => {
      this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.context.drawImage(img, 0, 0, this.canvas.width, this.canvas.height);
      this.context.beginPath();
      this.context.rect(x, y, w, h);
      this.context.stroke();
    };
  }
}
