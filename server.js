import { WebSocketServer } from "ws";

const wss = new WebSocketServer({ port: 10000 });

let rooms = {};

function generateRoomCode() {
  return Math.random().toString(36).substring(2, 7).toUpperCase();
}

wss.on("connection", (ws) => {
  ws.on("message", (message) => {
    const data = JSON.parse(message);

    if (data.type === "create_room") {
      const code = generateRoomCode();
      rooms[code] = [ws];
      ws.room = code;
      ws.send(JSON.stringify({ type: "room_created", code }));
    }

    if (data.type === "join_room") {
      const code = data.code;
      if (rooms[code] && rooms[code].length < 3) {
        rooms[code].push(ws);
        ws.room = code;

        rooms[code].forEach(player => {
          player.send(JSON.stringify({ type: "game_start" }));
        });
      } else {
        ws.send(JSON.stringify({ type: "error", message: "Room full or not found" }));
      }
    }

    if (data.type === "state_update") {
      if (ws.room && rooms[ws.room]) {
        rooms[ws.room].forEach(player => {
          if (player !== ws) {
            player.send(JSON.stringify({
              type: "player_update",
              state: data.state
            }));
          }
        });
      }
    }
  });

  ws.on("close", () => {
    if (ws.room && rooms[ws.room]) {
      rooms[ws.room] = rooms[ws.room].filter(p => p !== ws);
      if (rooms[ws.room].length === 0) {
        delete rooms[ws.room];
      }
    }
  });
});

console.log("WebSocket server running on port 10000");
