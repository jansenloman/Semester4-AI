import { useContext, useEffect, useState } from "react";
import { CurrentUserContext, PageStateContext, PublicChatroomsContext } from "../../context";
import { ChatroomInfo } from "../../helpers/classes";
import { ChatroomItem, ChatroomListItem } from "./ChatroomItem";
import "./home.css";
import { MaybeImage } from "../../components/Image";
import { PrimaryButton } from "../../components/Buttons";
import { useNavigate } from "react-router-dom";

import Add from "../../assets/add.svg";
import { API, CONNECTION_ERROR, SERVER_ERROR } from "../../helpers/constants";
import { Loading } from "../../components/Informative";
import { useInformativeFetch } from "../../helpers/fetch";
import { ChatroomJoinDetail, CreateNewChatroom } from "./ChatroomDetail";
import { AnimatePresence, motion } from "framer-motion";


function SearchView({searchTerm}:{searchTerm:string}){
    const [viewedChatroom, setViewedChatroom] = useState<{
        info: ChatroomInfo,
        hasJoined: boolean
    }|null>(null);
    const pageState = useContext(PageStateContext);

    const [myChatrooms, setMyChatrooms] = useState<ChatroomInfo[]>([]);
    const [publicChatrooms, setPublicChatrooms] = useState<ChatroomInfo[]>([]);
    async function updateSearch(){
        const params = new URLSearchParams();
        params.append("search", searchTerm);
        pageState?.letLoading(true);
        try {
            const res = await Promise.allSettled([
                fetch(API + "/chatroom/mine?" + params.toString(), {
                    credentials: "include"
                }),
                fetch(API + "/chatroom/public?" + params.toString(), {
                    credentials: "include"
                })
            ]);
            pageState?.letLoading(false);
            if (res[0].status == "fulfilled") {
                setMyChatrooms(ChatroomInfo.fromJSONArray(await res[0].value.json()));
            }
            if (res[1].status == "fulfilled") {
                setPublicChatrooms(ChatroomInfo.fromJSONArray(await res[1].value.json()));
            }
            if (res[0].status != "fulfilled" || res[1].status != "fulfilled"){
                pageState?.setErrMsg(SERVER_ERROR, 3000);
            }
        } catch (e){
            pageState?.letLoading(false);
            pageState?.setErrMsg(CONNECTION_ERROR, 3000);
        }
    }
    useEffect(()=>{
        updateSearch();
    }, [searchTerm]);
    
    return <>
        <AnimatePresence>
            {viewedChatroom && 
            // Animate opacity saja, kalau animate transform nanti bentrok dengan transform punya modal
            <motion.div initial={{opacity: 0}} animate={{opacity: 1}} exit={{opacity:0}}>
                <ChatroomJoinDetail hasJoined={false} onClose={() => setViewedChatroom(null)} chatroom={viewedChatroom.info}/>
            </motion.div>}
        </AnimatePresence>
        <div className="vertical-scroll">
            {myChatrooms.map(x => <ChatroomListItem chatroom={x} onOpen={() => setViewedChatroom({info: x, hasJoined: true})} key={x.id}/>)}
            {publicChatrooms.map(x => <ChatroomListItem chatroom={x} onOpen={() => setViewedChatroom({info: x, hasJoined: false})} key={x.id}/>)}
        </div>
    </>
}

function NewChatroomButton({onClick}:{onClick:(e:React.MouseEvent<HTMLButtonElement>)=>void}){
    return <PrimaryButton className="h-auto px-5 thick-shadow chatroom-box-item" onClick={onClick}>
        <img src={Add} alt="Add New Chatroom"/>
    </PrimaryButton>
}

function MainView(){
    const chatrooms = useContext(PublicChatroomsContext);
    const [viewedChatroom, setViewedChatroom] = useState<{
        room: ChatroomInfo|null,
        isNew:boolean,
        hasJoined: boolean
    }|null>(null);
    
    return <>
        <AnimatePresence>
        {viewedChatroom && (
            <motion.div initial={{opacity: 0}} animate={{opacity: 1}} exit={{opacity:0}}>
            {   
                viewedChatroom.isNew ?
                <CreateNewChatroom onClose={()=>setViewedChatroom(null)}/> :  
                <ChatroomJoinDetail hasJoined={viewedChatroom.hasJoined} onClose={() => setViewedChatroom(null)} chatroom={viewedChatroom.room!}/>
            }
            </motion.div>
        )}
        </AnimatePresence>
        <h2>My Chatrooms</h2>
        <div className="horizontal-scroll">
            <NewChatroomButton onClick={()=>setViewedChatroom({room: null, isNew: true, hasJoined: false})}/>
            {chatrooms?.mine.map(x => <ChatroomItem chatroom={x} key={x.id} onOpen={e => setViewedChatroom({room: e, isNew: false, hasJoined: true})}/>)}
        </div>
        <hr className="my-5"/>
        <h2>Public Chatrooms</h2>
        <div className="horizontal-scroll">
            {chatrooms?.public.map(x => <ChatroomItem chatroom={x} key={x.id} onOpen={e => setViewedChatroom({room: e, isNew: false, hasJoined: false})}/>)}
        </div>
    </>
}

function ProfileActions(){
    const [profileActionsVariant, setProfileActionsVariant] = useState("hidden");
    const user = useContext(CurrentUserContext);
    const navigate = useNavigate();
    const infoFetch = useInformativeFetch();
    async function logout(){
        try {
            const res = await infoFetch(() => fetch(API + "/accounts/logout", {
                method: "POST",
                credentials: "include"
            }));
            if (res.ok){
                user?.setUser(null);
                navigate("/login", {replace: true});
            }
        } catch {}
    }
    function toProfile(){
        navigate("/account");
    }
    
    return <div className="position-relative ms-5">
        <MaybeImage className="icon-circle profile-action-icon" src={user?.user?.pfp ?? ''} alt={user?.user?.name ?? ''}
        onClick={() => setProfileActionsVariant(x => {
            if (x == "hidden") return "visible";
            else return "hidden";
        })}/>
        {
            <motion.ul
            initial="hidden"
            variants={{
                visible: {scaleY: 1, height: 1},
                hidden: {scaleY: 0, height: 0}
            }}
            animate={profileActionsVariant}
            className="list-group position-absolute bg-white profile-actions">
                <li className="list-group-item" onClick={toProfile}>Profile</li>
                <li className="list-group-item" onClick={logout}>Logout</li>
            </motion.ul>
        }
    </div>
}

function App(){
    const [searchTerm, setSearchTerm] = useState("");
    const [displayedSearchTerm, setDisplayedSearchTerm] = useState("");

    const user = useContext(CurrentUserContext);
    const [myChatrooms, setMyChatrooms] = useState<ChatroomInfo[]>([]);
    const [publicChatrooms, setPublicChatrooms] = useState<ChatroomInfo[]>([]);
    
    const pageState = useContext(PageStateContext);
    const chatrooms = {
        mine: myChatrooms,
        public: publicChatrooms,
        setMine: setMyChatrooms,
        setPublic: setPublicChatrooms,
    };
    const infoFetch = useInformativeFetch();

    useEffect(()=>{
        infoFetch(() => fetch(API + "/chatroom/mine", {credentials: "include"}))
            .then(res => res.json())
            .then(json => setMyChatrooms(ChatroomInfo.fromJSONArray(json)))
            .catch(() => {});
        infoFetch(() => fetch(API + "/chatroom/public", {credentials: "include"}))
            .then(res => res.json())
            .then(json => setPublicChatrooms(ChatroomInfo.fromJSONArray(json)))
            .catch(() => {});
    }, []);
    
    return <PublicChatroomsContext.Provider value={chatrooms}>
        <div className="mx-5 mt-3">
            <div className="d-flex align-items-center mb-5">
                <input type="search" placeholder="Search" className="search-bar thick-shadow"
                value={displayedSearchTerm}
                onChange={e => setDisplayedSearchTerm(e.target.value)}
                onKeyUp={e => {
                    if (e.key == "Enter"){
                        setSearchTerm((e.target as HTMLInputElement).value);
                    }
                }}
                onBlur={e => setSearchTerm(e.target.value)}/>
                <Loading dependency={user?.user}>
                    <ProfileActions/>
                </Loading>
            </div>
            { searchTerm.length == 0 ? <MainView/> : <SearchView searchTerm={searchTerm}/>}
        </div>
    </PublicChatroomsContext.Provider>
}

export default App;