import { MaybeImage } from "../../components/Image";
import { ChatroomInfo } from "../../helpers/classes";

export interface ChatroomItemProps {
    chatroom:ChatroomInfo,
}
export interface OpenChatroomDetail {
    onOpen: (chatroom:ChatroomInfo)=>void
}

export function ChatroomItem({chatroom, onOpen}:ChatroomItemProps & OpenChatroomDetail){
    return <div className="bg-white rounded thick-shadow position-relative chatroom-box-item mx-3"
        onClick={()=>onOpen(chatroom)}>
        <MaybeImage alt={chatroom.settings.title} src={chatroom.settings.thumbnail} className="rounded w-100 h-100"/>
        <div className="position-absolute bottom-0 end-0 rounded-pill bg-highlight m-3 p-2 fw-bold">
            {chatroom.settings.title}
        </div>
    </div>
}

export function ChatroomListItem({chatroom, onOpen}:ChatroomItemProps & OpenChatroomDetail){
    return <div className="bg-white rounded thick-shadow m-3 chatroom-list-item d-flex"
    onClick={()=>onOpen(chatroom)}>
        <MaybeImage src={chatroom.settings.thumbnail} alt={chatroom.settings.title} className="rounded"/>
        <div className="ms-4 mt-3">
            <h4 className="m-0 p-0">{chatroom.settings.title}</h4>
            <p className="fw-light">owned by {chatroom.owner.name}</p>
            <p>{chatroom.settings.description}</p>
        </div>
    </div>
}