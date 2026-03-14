import "../styles/toolbar.scss";
import canvasState from "../store/canvasState";
import Eraser from "../tools/Eraser";
import toolState from "../store/toolState";
import Brush from "../tools/Brush";
import Rect from "../tools/Rect";
import Circle from "../tools/Circle";
import Line from "../tools/Line";
import { useParams } from "react-router-dom";

const ToolBar = () => {
  interface CanvasParams {
    id: string;
  }

  const params = useParams<CanvasParams>();

  return (
    <div className="toolbar">
      <button
        className="toolbar__btn toolbar__btn_brush"
        onClick={() =>
          toolState.setTool(
            new Brush(
              canvasState.canvas as HTMLCanvasElement,
              canvasState.socket as WebSocket,
              canvasState.sessionId as string,
            ),
          )
        }
      />
      <input
        className="toolbar__btn"
        type="color"
        onChange={(e) => {
          if (canvasState.socket) {
            canvasState.socket.send(
              JSON.stringify({
                method: "draw",
                id: params.id,
                figure: {
                  type: "color",
                  color: e.target.value,
                },
              }),
            );
          }
        }}
      />
      <button
        className="toolbar__btn toolbar__btn_circle"
        onClick={() => {
          toolState.setTool(
            new Circle(
              canvasState.canvas as HTMLCanvasElement,
              canvasState.socket as WebSocket,
              canvasState.sessionId as string,
            ),
          );
        }}
      />
      <button
        className="toolbar__btn toolbar__btn_line"
        onClick={() => {
          toolState.setTool(
            new Line(
              canvasState.canvas as HTMLCanvasElement,
              canvasState.socket as WebSocket,
              canvasState.sessionId as string,
            ),
          );
        }}
      />
      <button
        className="toolbar__btn toolbar__btn_rect"
        onClick={() =>
          toolState.setTool(
            new Rect(
              canvasState.canvas as HTMLCanvasElement,
              canvasState.socket as WebSocket,
              canvasState.sessionId as string,
            ),
          )
        }
        title="Прямоугольник"
      />
      <button
        className="toolbar__btn toolbar__btn_eraser"
        onClick={() =>
          toolState.setTool(
            new Eraser(
              canvasState.canvas as HTMLCanvasElement,
              canvasState.socket as WebSocket,
              canvasState.sessionId as string,
            ),
          )
        }
      />

      <div className="toolbar__separator" />

      <button
        className="toolbar__btn toolbar__btn_undo"
        onClick={() => {
          canvasState.undo();
        }}
      />
      <button
        className="toolbar__btn toolbar__btn_redo"
        onClick={() => {
          canvasState.redo();
        }}
      />

      <div className="toolbar__separator" />

      <button className="toolbar__btn toolbar__btn_save" />
    </div>
  );
};

export default ToolBar;
