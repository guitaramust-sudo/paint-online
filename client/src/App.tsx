import { BrowserRouter, Switch, Route, Redirect } from "react-router-dom";
import Canvas from "./components/Canvas";
import SettingBar from "./components/SettingBar";
import ToolBar from "./components/ToolBar";
import "./styles/app.scss";

function App() {
  return (
    <BrowserRouter>
      <Switch>
        <Route path={"/:id"}>
          <div className="app">
            <ToolBar />
            <SettingBar />
            <Canvas />
          </div>
        </Route>
        <Redirect to={`f${(+new Date()).toString(16)}`} />
      </Switch>
    </BrowserRouter>
  );
}

export default App;
