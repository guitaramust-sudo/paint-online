import { makeAutoObservable } from "mobx";

class CanvasState {
  canvas: HTMLCanvasElement | null = null;
  undoList: string[] = [];
  redoList: string[] = [];
  username = "";
  socket: WebSocket | null = null;
  sessionId: string | null = null;

  constructor() {
    makeAutoObservable(this);
  }

  setCanvas(canvas: HTMLCanvasElement | null): void {
    this.canvas = canvas;
  }

  setUsername(username: string) {
    this.username = username;
  }

  setId(id: string) {
    this.sessionId = id;
  }

  setSocket(socket: WebSocket) {
    this.socket = socket;
  }

  pushToUndo(data: string): void {
    this.undoList.push(data);
  }

  pushToRedo(data: string): void {
    this.redoList.push(data);
  }

  undo(): void {
    const ctx = this.canvas?.getContext("2d");
    if (this.undoList.length > 0) {
      const currentState = this.canvas?.toDataURL();
      if (currentState) this.redoList.push(currentState);

      const dataUrl = this.undoList.pop();
      if (dataUrl && ctx && this.canvas) {
        const img = new Image();
        img.src = dataUrl;
        img.onload = () => {
          ctx.clearRect(0, 0, this.canvas!.width, this.canvas!.height);
          ctx.drawImage(img, 0, 0, this.canvas!.width, this.canvas!.height);
        };
      }
    } else {
      if (ctx && this.canvas) {
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      }
    }
  }

  redo(): void {
    const ctx = this.canvas?.getContext("2d");
    if (this.redoList.length > 0) {
      const currentState = this.canvas?.toDataURL();
      if (currentState) this.undoList.push(currentState);

      const dataUrl = this.redoList.pop();
      if (dataUrl && ctx && this.canvas) {
        const img = new Image();
        img.src = dataUrl;
        img.onload = () => {
          ctx.clearRect(0, 0, this.canvas!.width, this.canvas!.height);
          ctx.drawImage(img, 0, 0, this.canvas!.width, this.canvas!.height);
        };
      }
    }
  }
}

export default new CanvasState();
