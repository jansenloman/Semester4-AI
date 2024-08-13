import { Await, useLocation, useNavigate } from "react-router-dom";
import { API, CONNECTION_ERROR, SERVER_ERROR } from "./constants";
import { ReactNode, useContext, useEffect, useState } from "react";
import { PageStateContext } from "../context";
import { Suspense } from "react";

interface ProtectedRouteProps {
    children: ReactNode
};
export function ProtectedRoute({children}:ProtectedRouteProps){
    const route = useLocation();
    const navigate = useNavigate();
    const pageState = useContext(PageStateContext);
    const [hasLoaded, letLoaded] = useState(false);
    let promise = new Promise(()=>{});
    useEffect(() => {
        pageState?.letLoading(true);
        promise = fetch(API + "/accounts/me", {credentials: "include"})
            .then((res) => {
                pageState?.letLoading(false);
                if (res.ok && route.pathname.startsWith("/login")){
                    navigate("/", {replace: true});
                } else if (!res.ok && !route.pathname.startsWith("/login")){
                    navigate("/login", {replace: true});
                }
                letLoaded(true);
            })
            .catch((err) => {
                console.error(err);
                pageState?.setErrMsg(CONNECTION_ERROR, 3000);
                pageState?.letLoading(false);
            });
    }, []);
    return <>
        {hasLoaded && children}
    </>
}

export function useInformativeFetch<T>(){
    const pageState = useContext(PageStateContext);
    return function (asyncfn: ()=>Promise<Response>){
        return new Promise<Response>(async (resolve, reject)=>{
            try {
                const res = await asyncfn();
                pageState?.letLoading(false);
                if (res.ok){
                    resolve(res);
                } else {
                    pageState?.setErrMsg(SERVER_ERROR, 3000); 
                    reject(res);
                }
            } catch (e) {
                console.error(e);
                pageState?.letLoading(false);
                pageState?.setErrMsg(CONNECTION_ERROR, 3000);
                reject(e);
            }
        });
    }
}