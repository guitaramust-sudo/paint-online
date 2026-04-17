import { makeAutoObservable } from "mobx";
import Tool from "../tools/Tool";

class ToolState {
  tool: Tool | null = null;
  color: string = "#000000";
  constructor() {
    makeAutoObservable(this);
  }

  setTool(tool: Tool) {
    this.tool = tool;
  }

  setColor(color: string) {
    this.color = color;

    if (this.tool?.canvas) {
      const ctx = this.tool.canvas.getContext("2d");
      if (ctx) {
        ctx.strokeStyle = color;
        ctx.fillStyle = color;
      }
    }
  }
}

export default new ToolState();
