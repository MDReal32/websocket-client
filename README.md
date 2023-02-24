# @mdreal/websocket-client

Simple websocket client for browser and nodejs environments.

## Installation

```bash
npm install @mdreal/websocket-client
# or
yarn add @mdreal/websocket-client
```

## Usage

```js
import { WebSocketClient } from '@mdreal/websocket-client';

const client = WebSocketClient.getInstance('<websocket-url-here>');
client.send('Hello world!');
client.on("data", (data) => {
  console.log(data);
});
```

Message format:

```ts
interface Message {
  event: string,
  data: any
}
```

## License

[MIT](LICENSE)

## Author

- [MDReal@github](https://github.com/MDReal32)
- [MDReal@linkedin](https://www.linkedin.com/in/mdrealiyev)
