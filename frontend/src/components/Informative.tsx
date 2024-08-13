import { ReactNode, useContext, useEffect } from "react"
import { PageStateContext } from "../context"

export function Spinner(){
    return <div className="spinner-border text-primary" role="status">
        <span className="visually-hidden">Loading...</span>
    </div>
}

interface AlertProps {
    message: string
    isFloating?: boolean,
    onClose?: () => void
}
export function ErrorAlert({message, isFloating, onClose}: AlertProps){
    return <div className={"alert alert-danger" + (isFloating ? " floating-alert" : "")}
        role="alert"
        onClick={onClose}
    >
        { message }
    </div>
}

export function Loading({dependency, children}: {children:ReactNode, dependency:unknown|null}){
    const pageState = useContext(PageStateContext);
    useEffect(()=>{
        if (!dependency){
            pageState?.letLoading(true);
        } else {
            pageState?.letLoading(false);
        }
    }, [dependency])
    return <>
        {dependency && children}
    </>
}