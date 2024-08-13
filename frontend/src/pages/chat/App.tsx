import { useParams } from 'react-router-dom';
import ChatMembers from './ChatMembers';
import ChatMessages from './ChatMessages';

import "./chat.css";
import { useEffect, useState } from 'react';
import { Chatroom, UserAccount } from '../../helpers/classes';
import { ChatroomContext, ChatSocketContext, CurrentUserContext } from '../../context';
import { BackButton } from '../../components/Buttons';
import ChatOptions from './ChatOptions';
import { useInformativeFetch } from '../../helpers/fetch';
import { API, BACKEND } from '../../helpers/constants';
import { Loading } from '../../components/Informative';
import { io, Socket } from "socket.io-client";
import { AnimatePresence, motion } from 'framer-motion';

function App(){
    const { id } = useParams();
    const infoFetch = useInformativeFetch();
    const [chatroom, setChatroom] = useState<Chatroom|null>(null);
    const [socket, setSocket] = useState<Socket|null>(null);
    
    useEffect(() => {
        try {
            const channel = io(BACKEND, {
                withCredentials: true,
                transports: ['websocket','polling', 'flashsocket']
            });
            setSocket(channel);
            infoFetch(() => fetch(API + "/chatroom/" + id, { credentials: "include"}))
            .then(res => res.json())
            .then(json => {
                const room = Chatroom.fromJSON(json);
                channel.emit("joinRoom", room.id);
                setChatroom(room);
            });
        } catch (e) {}

        return () => {
            if (!chatroom) return;
            socket?.emit("leaveRoom", chatroom.id);
            socket?.close();
        }
    }, []);

    const [isOptionsOpen, letOptionsOpen] = useState(false);
    return <ChatroomContext.Provider value={{room: chatroom, setRoom: setChatroom}}>
        <ChatSocketContext.Provider value={socket}>
            <BackButton/>
            <Loading dependency={chatroom}>
                <div className="d-flex justify-content-stretch mt-4 mx-3">
                    <ChatMessages/>
                    <ChatMembers onOpenSettings={()=>letOptionsOpen(true)}/>
                </div>
            </Loading>
            <AnimatePresence>
                {isOptionsOpen &&
                <motion.div initial={{opacity: 0}} animate={{opacity: 1}} exit={{opacity:0}}>
                    <ChatOptions onClose={()=>letOptionsOpen(false)}/>
                </motion.div>}
            </AnimatePresence>
        </ChatSocketContext.Provider>
    </ChatroomContext.Provider>
}

export default App;