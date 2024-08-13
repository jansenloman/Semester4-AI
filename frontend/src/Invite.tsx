import { useContext, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useInformativeFetch } from "./helpers/fetch";
import { API } from "./helpers/constants";
import { PageStateContext } from "./context";

function Invite(){
    const { link } = useParams();
    const pageState = useContext(PageStateContext);
    const navigate = useNavigate();
    useEffect(()=>{
        pageState?.letLoading(true);
        fetch(API + "/chatroom/invite/" + link, {
            credentials: "include",
            method: "POST",
        })
        .then(res => {
            pageState?.letLoading(false);
            if (res.ok) return res.json();
            else throw Error();
        })
        .then(json => navigate("/chat/" + json.id))
        .catch(() => navigate("/"));
    }, []);
    return <></>
}

export default Invite;