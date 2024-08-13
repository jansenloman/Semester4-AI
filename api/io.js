const { Server } = require("socket.io");
let io;
function dispatch(fn) {
  fn(io);
}


function initialize(httpServer, options, sessionMiddleware) {
  io = new Server(httpServer, options);

  // Middleware untuk session
  const wrap = (middleware) => (socket, next) =>
    middleware(socket.request, {}, next);
  io.use(wrap(sessionMiddleware));
  io.use((socket, next) => {
    if (socket.request.session.user) next();
    else next(new Error("Unauthorized user"));
  });

  // Event listener saat koneksi socket.io terhubung
  io.on("connection", (socket) => {
    // Event listener saat user bergabung ke sebuah chatroom
    socket.on("joinRoom", (roomId) => {
      socket.join(roomId);
      console.log(`SOCKET: User ${socket.request.session.user.id} (${socket.id}) bergabung ke chatroom: ${roomId}`);
    });
    
    // Event listener saat user meninggalkan chatroom
    socket.on("leaveRoom", (roomId) => {
      socket.leave(roomId);
      console.log(`SOCKET: User ${socket.request.session.user.id} (${socket.id}) meninggalkan chatroom: ${roomId}`);
    });
  });
}

module.exports = { initialize, dispatch };
