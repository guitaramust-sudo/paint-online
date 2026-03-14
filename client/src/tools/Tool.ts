class Tool {
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
  socket: WebSocket;
  id: string;

  constructor(canvas: HTMLCanvasElement, socket: WebSocket, id: string) {
    this.socket = socket;
    this.id = id;
    this.canvas = canvas;
    this.context = canvas.getContext("2d") as CanvasRenderingContext2D;
  }

  destroyEvents() {
    this.canvas.onmousedown = null;
    this.canvas.onmousemove = null;
    this.canvas.onmouseup = null;
  }
}

export default Tool;
