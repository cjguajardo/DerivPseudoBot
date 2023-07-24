const app_id = 1089; // Replace with your app_id or leave as 1089 for testing.
const botToken = 'utpD7uT32mi0Mck'; // Replace with your bot token.

const send = data => {
  if (socket && socket.readyState === WebSocket.OPEN) {
    if (typeof data.ping === 'undefined') console.log('readyState::OPEN', data);
    socket.send(JSON.stringify(data));
  } else {
    //reopen socket
    if (socket.readyState === WebSocket.CLOSED) {
      console.log('readyState::CLOSED');
      openSocket();
      setTimeout(() => {
        socket.send(JSON.stringify(data));
      }, 1000);
    } else if (socket.readyState === WebSocket.CLOSING) {
      console.log('readyState::CLOSING');
      setTimeout(() => {
        openSocket();
        setTimeout(() => {
          socket.send(JSON.stringify(data));
        }, 1000);
      }, 2000);
    } else if (socket.readyState === WebSocket.CONNECTING) {
      console.log('readyState::CONNECTING');
      setTimeout(() => {
        socket.send(JSON.stringify(data));
      }, 1000);
    }
  }
};

const openSocket = () => {
  const socket = new WebSocket(
    `wss://ws.binaryws.com/websockets/v3?app_id=${app_id}`
  );
  return socket;
};

export default { openSocket, botToken };
