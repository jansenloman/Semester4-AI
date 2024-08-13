import { useContext, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { DangerButton, PrimaryButton } from "../../components/Buttons";
import { MaybeImage } from "../../components/Image";
import { ArbitraryInput, exportResponses } from "../../components/Inputs";
import { PublicChatroomsContext, CurrentUserContext, PageStateContext } from "../../context";
import { API } from "../../helpers/constants";
import { useInformativeFetch } from "../../helpers/fetch";
import { validateChatroomTitle, noValidate } from "../../helpers/inputValidators";
import { CheckboxInputObject, FileInputObject, TextInputObject } from "../../helpers/inputs";
import { ChatroomItemProps } from "./ChatroomItem";

interface JoinDetail {
    hasJoined: boolean,
}
interface CloseChatroomDetail {
    onClose: ()=>void
}
export function ChatroomJoinDetail({chatroom, hasJoined, onClose}:ChatroomItemProps & JoinDetail & CloseChatroomDetail){
    const chatrooms = useContext(PublicChatroomsContext);
    const navigate = useNavigate();
    const user = useContext(CurrentUserContext);
    const infoFetch = useInformativeFetch();

    async function joinChatroom(){
        try {
            await infoFetch(() => fetch(API + `/chatroom/${chatroom.id}/members`, {
                method: "POST",
                headers: {
                    'Content-Type': "application/json",
                },
                credentials: "include"
            }));
            navigate(`/chat/${chatroom.id}`);
        } catch {}
    }
    async function leaveChatroom(){
        try {
            await infoFetch(() => fetch(API + `/chatroom/${chatroom.id}/members`, {
                method: "DELETE",
                credentials: "include"
            }));
            chatrooms?.setMine(mine => mine.filter(x => x.id != chatroom.id));
            chatrooms?.setPublic(pub => [chatroom, ...pub]);
            onClose();
        } catch {}
    }
    return <div className="very-rounded chat-options thick-shadow bg-white">
        <div className="p-4">
            <MaybeImage src={chatroom.settings.thumbnail} alt={chatroom.settings.title} className="w-100"/>
            <div className="ms-5">
                <h2 className="m-0 p-0">{chatroom.settings.title}</h2>
                <p className="fw-light">owned by {chatroom.owner.name}</p>
                <p className="border-start ps-4">{chatroom.settings.description}</p>
                <div className="form-check">
                    <label
                        className="form-check-label"
                        htmlFor="chatroom-join-detail-is-filtered-checkbox"
                    >Delete Toxic Messages</label>
                    <input
                        className = "form-check-input"
                        disabled
                        type = "checkbox"
                        checked={chatroom.settings.isToxicityFiltered}
                    />
                </div>
            </div>
        </div>
        <div className="p-1 d-flex flex-row-reverse">
            <PrimaryButton onClick={joinChatroom} className="w-25">Join</PrimaryButton>
            { hasJoined && chatroom.owner.id != user?.user?.id && <DangerButton onClick={leaveChatroom} className="w-25">Leave</DangerButton> }
            <button className="btn btn-secondary m-2 p-2 w-25" onClick={onClose}>Cancel</button>
        </div>
    </div>
}

export function CreateNewChatroom({onClose}:CloseChatroomDetail){
    const [isValidating, letValidating] = useState(false);
    const navigate = useNavigate();
    const inputs = useRef([
        new TextInputObject("Chatroom Title", "", validateChatroomTitle),
        new TextInputObject("Chatroom Description", "", noValidate, {
            isTextarea: true,
        }),
        new FileInputObject("Chatroom Thumbnail", x => x ? "" : "Chatroom thumbnail is required", {
            accept: "image/*"
        }),
        new CheckboxInputObject("Settings", [], [
            {label: "Delete Toxic Messages", value:"filtered"},
            {label: "Public Chatroom", value:"public"}
        ], noValidate)
    ]);
    const infoFetch = useInformativeFetch();
    function createFormData(responses:{[key:string]: string}){
        const formData = new FormData();
        formData.append("title", responses["Chatroom Title"]);
        formData.append("description", responses["Chatroom Description"]);
        formData.append("thumbnail", responses["Chatroom Thumbnail"]);
        formData.append("isFiltered", responses["Settings"].includes("filtered") ? "yes" : "");
        formData.append("isPublic", responses["Settings"].includes("public") ? "yes" : "");
        return formData;
    }
    async function createNewChatroom(){
        let [responses, hasError] = exportResponses(inputs.current);
        letValidating(true);
        if (hasError) return;
        
        try {
            const formBody = createFormData(responses);
            const res = await infoFetch(() => fetch(API + "/chatroom/", {
                method: "POST",
                credentials: "include",
                body: formBody,
            }));
            const json = await res.json();
            navigate("/chat/" + json.id);
        } catch (e){}
    }

    return <div className="very-rounded chat-options thick-shadow bg-white">
        <div className="p-4">
            <div>
                {inputs.current.map(x => <ArbitraryInput input={x} shouldValidate={isValidating} key={x.id.toString() + (isValidating ? '1' : '0')}/>)}
            </div>
        </div>
        <div className="p-1 d-flex flex-row-reverse">
            <PrimaryButton onClick={createNewChatroom} className="w-25">
                Create New Chatroom
            </PrimaryButton>
            <button className="btn btn-secondary m-2 p-2 w-25"
            onClick={onClose}>
                Cancel
            </button>
        </div>
    </div>
}