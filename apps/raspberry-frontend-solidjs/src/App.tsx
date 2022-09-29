import type { Component } from 'solid-js';
import client from "./feathers";

import logo from "./logo.svg";
import styles from "./App.module.css";
import Loading from "./components/Loading";

const postsService = client.service("posts");

const App: Component = () => {
  return (
    <div class={styles.App}>
      <Loading />
    </div>
  );
};

export default App;
