import "./app.css";
import "@fontsource/hanken-grotesk/400.css";
import "@fontsource/hanken-grotesk/700.css";
import App from "./App.svelte";

const app = new App({
  target: document.getElementById("app")!,
});

export default app;
