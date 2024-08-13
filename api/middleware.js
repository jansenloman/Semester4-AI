const db = require("./db");

function createOwnerObject(owner){
  if (owner.owner_id){
    return {
      id: owner.owner_id,
      email: owner.owner_email,
      name: owner.owner_name,
      bio: owner.owner_bio,
      pfp: owner.owner_pfp,
    }
  } else {
    return {
      id: 0,
      email: "-",
      name: "Deleted User",
      bio: "",
      pfp: "",
    }
  }
}
module.exports = {
  auth(req, res, next) {
    if (req.session.user) next();
    else res.status(401).end();
  },
  // Assumes that req.params.id is the id of the chatroom, and req.session.id is the id of the user
  // Use alongside auth
  async hasUserJoined(req, res, next){
    const isMember = await db.get("SELECT * FROM user_rooms WHERE user_id = ? AND room_id = ?", [req.session.user.id, req.params.id]);
    if (isMember) next();
    else res.status(401).end();
  },
  async doesChatroomExist(req, res, next){
    const doesExist = await db.get("SELECT * FROM rooms WHERE id = ?", [req.params.id]);
    if (doesExist) next();
    else res.status(404).end();
  },
  generateInviteLink(){
    return Math.random().toString(36).substring(2);
  },
  async isChatroomOwner(req, res, next){
    const { owner_id } = await db.get("SELECT rooms.owner_id FROM user_rooms JOIN rooms ON rooms.id = user_rooms.room_id WHERE user_id = ? AND room_id = ?", [req.session.user.id, req.params.id]);
    if (owner_id == req.session.user.id) next();
    else res.status(401).end();
  },
  createUserObject(user){
    return {id: user.id, email: user.email, name: user.name, bio: user.bio, pfp: user.pfp_path};
  },
  createChatroomInfoObject(chatroom){
    const owner = createOwnerObject(chatroom);
    return {
      id: chatroom.room_id,
      owner,
      settings: {
        title: chatroom.title,
        thumbnail: chatroom.thumbnail,
        description: chatroom.description,
        isToxicityFiltered: !!chatroom.is_filtered,
        isPublic: !!chatroom.is_public,
      }
    }
  },
  createChatroomObject(chatroom, members){
    const users = members.map(user => ({id: user.id, email: user.email, name: user.name, bio: user.bio, pfp: user.pfp_path}));
    const owner = createOwnerObject(chatroom)
    return {
        id: chatroom.room_id,
        owner,
        members: users,
        invite: chatroom.invite_link,
        settings: {
          title: chatroom.title,
          thumbnail: chatroom.thumbnail,
          description: chatroom.description,
          isToxicityFiltered: !!chatroom.is_filtered,
          isPublic: !!chatroom.is_public,
        }
    }
  },
  createMessageObject(message){
    return {
      id: message.id,
      user: createOwnerObject(message),
      message: message.text,
      time: message.created_at,
    }
  }
};
