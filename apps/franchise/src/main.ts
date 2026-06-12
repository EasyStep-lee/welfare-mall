import 'element-plus/dist/index.css';
import { createPinia } from 'pinia';
import { createApp } from 'vue';
import App from './App';
import './styles.css';

createApp(App).use(createPinia()).mount('#root');
