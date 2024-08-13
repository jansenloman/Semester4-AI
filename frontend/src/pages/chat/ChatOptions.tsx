import { useContext, useRef, useState } from "react";
import { DangerButton, PrimaryButton } from "../../components/Buttons";
import { MaybeImage } from "../../components/Image";
import { ArbitraryInput, exportResponses } from "../../components/Inputs";
import { CheckboxInputObject, FileInputObject, TextInputObject } from "../../helpers/inputs";
import { noValidate, validateChatroomTitle } from "../../helpers/inputValidators";
import { ChatroomContext } from "../../context";
import { useNavigate } from "react-router-dom";
import { useInformativeFetch } from "../../helpers/fetch";
import { API } from "../../helpers/constants";
import Dice from "../../assets/dice.svg";

interface ChatOptionsProps {
    onClose: ()=>void
}

function ChatOptions({onClose}:ChatOptionsProps){
    const chatroom = useContext(ChatroomContext)!;
    const navigate = useNavigate();
    const [hasCopied, letCopied] = useState(false);

    const chatroomOptions = [];
    if (chatroom?.room?.settings.isToxicityFiltered)
        chatroomOptions.push("filtered");
    if (chatroom?.room?.settings.isPublic)
        chatroomOptions.push("public");

    const infoFetch = useInformativeFetch();
    const inputs = useRef([
        new TextInputObject("Chatroom Title", chatroom?.room!.settings.title, validateChatroomTitle),
        new TextInputObject("Chatroom Description", chatroom?.room!.settings.description, noValidate, {
            isTextarea: true,
        }),
        new FileInputObject("Chatroom Thumbnail", noValidate, {
            accept: "image/*"
        }),
        new CheckboxInputObject("Settings", chatroomOptions, [
            {label: "Delete Toxic Messages", value:"filtered"},
            {label: "Public Chatroom", value:"public"}
        ], noValidate)
    ]);
    function createFormData(responses:{[key:string]: string}){
        const formData = new FormData();
        formData.append("title", responses["Chatroom Title"]);
        formData.append("description", responses["Chatroom Description"]);
        formData.append("thumbnail", responses["Chatroom Thumbnail"]);
        formData.append("isFiltered", responses["Settings"].includes("filtered") ? "yes" : "no");
        formData.append("isPublic", responses["Settings"].includes("public") ? "yes" : "no");
        return formData;
    }
    async function saveSettings(){
        const [responses, hasError] = exportResponses(inputs.current);
        if (hasError) return;
        const formData = createFormData(responses);
        try {
            const res = await infoFetch(() => fetch(API + "/chatroom/" + chatroom?.room?.id, {
                method: "PUT",
                credentials: "include",
                body: formData
            }));
            if (!res.ok) return;
            chatroom.setRoom(room => {
                if (!room) return room;
                return room.withSettings({
                    title: responses["Chatroom Title"],
                    description: responses["Chatroom Description"],
                    thumbnail: responses["Chatroom Thumbnail"],
                    isToxicityFiltered: responses["Settings"]?.includes("filtered"),
                    isPublic: responses["Settings"]?.includes("public")
                });
            })
            onClose();
        } catch (e){}
        
    }
    async function deleteChatroom(){
        if (!confirm("Are you sure you want to delete this chatroom?")) return;
        try {
            const res = await infoFetch(() => fetch(API + "/chatroom/" + chatroom?.room?.id, {
                method: "DELETE",
                credentials: "include"
            }));
            if (res.ok){
                navigate("/", {replace: true});
            }
        } catch (e){};
    }
    function copyToClipboard(invite:string){
        navigator.clipboard.writeText(`${window.location.origin}/invite/${invite}`);
        letCopied(true);
    }
    async function rerollLink(ev:React.MouseEvent<HTMLImageElement>){
        ev.preventDefault();
        try {
            const res = await infoFetch(() => fetch(API + "/chatroom/invite/" + chatroom!.room!.id, {
                credentials: "include",
                method: "PUT",
            }));
            if (res.ok){
                const link:string = (await res.json()).link;
                chatroom!.setRoom(room => room!.withInvite(link));
                copyToClipboard(link);
            }
        } catch (err){}

        // http://localhost:5173/invite/0kveur6e1bi
    }

    return <div className="very-rounded chat-options thick-shadow bg-white">
        <div className="p-4">
            <MaybeImage src={chatroom?.room!.settings.thumbnail} alt={chatroom?.room!.settings.title} className="w-100"/>
            <div>
                {inputs.current.map(x => <ArbitraryInput input={x} shouldValidate={true} key={x.id}/>)}
                <div className="mx-2">
                    <b>Invite Link: </b>
                    <div className="rounded px-4 py-2 bg-highlight d-flex justify-content-between align-items-center" role="button" onClick={() => copyToClipboard(chatroom?.room!.invite)}>
                        {window.location.origin}/invite/{chatroom?.room!.invite}
                        <img src={Dice} alt="Change Invite Link" className="reroll-icon" role="button" onClick={rerollLink}/>
                    </div>
                    {hasCopied && <p className="text-success">Copied to clipboard!</p>}
                </div>
            </div>
        </div>
        <div className="p-1 d-flex flex-row-reverse">
            <PrimaryButton onClick={saveSettings} className="w-25">
                Save
            </PrimaryButton>
            <DangerButton onClick={deleteChatroom} className="w-25">
                Delete This Chatroom
            </DangerButton>
            <button className="btn btn-secondary m-2 p-2 w-25"
            onClick={onClose}>
                Cancel
            </button>
        </div>
    </div>
}

export default ChatOptions;