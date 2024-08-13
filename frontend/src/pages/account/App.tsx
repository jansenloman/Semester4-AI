import { useContext, useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import RoomInfo from './RoomInfo';
import backgroundImage from './images/background.jpg';
import './account.css';

import { BackButton } from '../../components/Buttons';
import { ChatroomInfo } from "../../helpers/classes";
import { API } from "../../helpers/constants";
import { CurrentUserContext } from '../../context';
import { useInformativeFetch } from "../../helpers/fetch";
import { Loading } from '../../components/Informative';
import { DangerButton } from "../../components/Buttons";
import { MaybeImage } from '../../components/Image';

function App() {
    const user = useContext(CurrentUserContext);
    const [myChatrooms, setMyChatrooms] = useState<ChatroomInfo[]>([]);
    const [roomColors, setRoomColors] = useState<string[]>([]);
    const infoFetch = useInformativeFetch();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchChatrooms = async () => {
            try {
                const response = await infoFetch(() => fetch(API + "/chatroom/mine", { credentials: "include" }));
                if (!response.ok) return;
                const json = await response.json();
                const colors = json.map(() => `#${Math.floor(Math.random() * 16777215).toString(16)}`);
                setRoomColors(colors);
                setMyChatrooms(ChatroomInfo.fromJSONArray(json));
            } catch (error) {
                console.error(error);
            }
        };
        fetchChatrooms();
    }, []);

    async function deleteAccount() {
        if (!confirm("Are you sure you want to delete this account?")) return;
        try {
            const res = await infoFetch(() => fetch(API + '/accounts', {
                method: "DELETE",
                credentials: "include"
            }));
            if (res.ok) {
                navigate("/login", { replace: true });
            }
        } catch (e) { };
    }

    return (
        <>
            <BackButton />
            <Loading dependency={user}>
                <div className="backImage">
                    <img src={backgroundImage} alt="Background" />
                </div>
                <div className="profileImage">
                    <div className="pic">
                        <MaybeImage src={user?.user?.pfp!} alt="Profile" />
                    </div>
                </div>
                <div className="description">
                    <div className="useProfile">
                        <h1>{user?.user?.name}</h1>
                        <h3>{user?.user?.email}</h3>
                        <p>{user?.user?.bio}</p>
                    </div>
                    <div className="info">
                        <div className="title">
                            <h3>Ruangan Saya</h3>
                        </div>
                        <div className="roomItem">
                            {myChatrooms.map((room, index) => (
                                <RoomInfo key={room.id} room={room} color={roomColors[index]} />
                            ))}
                        </div>
                    </div>
                </div>
                <DangerButton onClick={deleteAccount} className="ms-4 w-25">
                    Delete This Account
                </DangerButton>
            </Loading>
        </>
    )
};

export default App;