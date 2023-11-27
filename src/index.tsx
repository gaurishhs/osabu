import { render } from 'preact'
import { App } from './app'
import './index.css';

// @ts-ignore - Preact is not typed for some reason
render(<App />, document.getElementById('root'))
