import { useContext, useState } from "react";
import { DangerButton, PrimaryButton } from "../../components/Buttons";
import { MaybeImage } from "../../components/Image";
import { UserAccount } from "../../helpers/classes"
import { ChatroomContext, CurrentUserContext } from "../../context";
import { useInformativeFetch } from "../../helpers/fetch";
import { API } from "../../helpers/constants";
import { useNavigate } from "react-router-dom";

interface RequireUser {
    user: UserAccount
}

export function MemberInfo({user}:RequireUser){
    return <div className="member-info rounded bg-white py-2 border">
        <h5>About Me</h5>
        <p>{user.bio || <i>User did not provide any information</i>}</p>
    </div>
}

export function MemberListItem({user}:RequireUser){
    const [isShowingInfo, letShowInfo] = useState(false);
    const currentUser = useContext(CurrentUserContext);
    function openInfo(){
        letShowInfo(x => !x);
    }
    return <div className="member-list-item my-1" onClick={openInfo}>
        <div className={`d-flex align-items-center rounded ps-3 py-2 
        ${currentUser?.user?.id == user.id ? 'bg-highlight-dark' : 'bg-highlight'}`}>
            <MemberIcon user={user}/>
            <div className="ms-3">
                <h5 className="my-0">{user.name}</h5>
                <p className="fw-light my-0">{user.email}</p>
            </div>
        </div>
        {isShowingInfo && <MemberInfo user={user}/>}
    </div>
}

export function MemberIcon({user}:RequireUser){
    return <MaybeImage className="icon-circle" src={user.pfp} alt={user.name}/>
}

interface ChatMembersProps {
    onOpenSettings:()=>void
}
function ChatMembers({onOpenSettings}:ChatMembersProps){
    const chatroom = useContext(ChatroomContext);
    const user = useContext(CurrentUserContext);
    const infoFetch = useInformativeFetch();
    const navigate = useNavigate();
    async function leaveRoom(){
        try {
            await infoFetch(() => fetch(API + `/chatroom/${chatroom?.room?.id}/members`, {
                method: "DELETE",
                credentials: "include"
            }));
            navigate("/");
        } catch {}
    }
    return <div className="col-3 chat-member-list bg-white px-4 pt-4 pb-2">
        <div className="overflow-y-scroll h-screen mb-5">
            { chatroom?.room?.members.map(x => <MemberListItem key={x.id} user={x}/>) }
        </div>
        {
            chatroom?.room?.owner.id == user?.user?.id ?
            <PrimaryButton onClick={onOpenSettings}>
                Chatroom Settings
            </PrimaryButton> :
            <DangerButton onClick={leaveRoom}>
                Leave Room
            </DangerButton>
        }
    </div>
}

export default ChatMembers;