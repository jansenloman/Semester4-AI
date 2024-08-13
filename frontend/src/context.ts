import { createContext } from "react";
import { Chatroom, ChatroomInfo, UserAccount } from "./helpers/classes";
import { Socket } from "socket.io-client";

export const CurrentUserContext = createContext<{
    user:UserAccount|null,
    setUser: React.Dispatch<React.SetStateAction<UserAccount|null>>,
}|undefined>(undefined);
export const ChatroomContext = createContext<{
    room:Chatroom|null,
    setRoom: React.Dispatch<React.SetStateAction<Chatroom|null>>
}|undefined>(undefined);
export const PublicChatroomsContext = createContext<{
    mine:ChatroomInfo[],
    public:ChatroomInfo[],
    setMine: React.Dispatch<React.SetStateAction<ChatroomInfo[]>>,
    setPublic: React.Dispatch<React.SetStateAction<ChatroomInfo[]>>,
}|undefined>(undefined);

export const PageStateContext = createContext<{
    isLoading: boolean,
    errMsg: string,
    letLoading: React.Dispatch<React.SetStateAction<boolean>>,
    setErrMsg: (message:string, timeout:number|null) => void,
    cleanup: () => void,
}|undefined>(undefined);

export const ChatSocketContext = createContext<Socket|null>(null);