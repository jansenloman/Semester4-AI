import React from 'react';
import './account.css';
import { ChatroomInfo } from '../../helpers/classes';
import { useNavigate } from 'react-router-dom';

interface Props {
  room: ChatroomInfo,
  color: string;
}

const RoomInfo: React.FC<Props> = ({ room, color }) => {
  const style = {
    backgroundColor: color,
  };
  const navigate = useNavigate();
  function redirect(){
    navigate("/chat/"+room.id);
  }

  return (
    <div className="roomInfo" style={style} onClick={redirect}>
      <h4>{room.settings.title}</h4>
    </div>
  );
};

export default RoomInfo;
